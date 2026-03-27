"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

async function getOrCreateUser(clerkId: string) {
  const existing = await db.user.findUnique({ where: { clerkId } });
  if (existing) return existing;

  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("User not authenticated");

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) throw new Error("User has no email address");

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const profileImage = clerkUser.imageUrl ?? "";

  return db.user.create({
    data: { clerkId, email, name, profileImage, tier: "Free", credits: "10" },
  });
}

export async function getDashboardStats() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");

    await getOrCreateUser(userId);

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        workflows: { select: { id: true, publish: true } },
        connections: { select: { id: true } },
        DiscordWebhook: { select: { id: true } },
        Notion: { select: { id: true } },
        Slack: { select: { id: true } },
      },
    });

    if (!user) throw new Error("User not found");

    const workflowIds = user.workflows.map((w) => w.id);
    const totalWorkflows = workflowIds.length;
    const activeAutomations = user.workflows.filter((w) => w.publish).length;
    const unpublishedWorkflows = totalWorkflows - activeAutomations;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [successCount, failedCount, totalRuns, last30DaysRuns] = await Promise.all([
      workflowIds.length
        ? db.executionLog.count({ where: { workflowId: { in: workflowIds }, status: "success" } })
        : Promise.resolve(0),
      workflowIds.length
        ? db.executionLog.count({ where: { workflowId: { in: workflowIds }, status: "failed" } })
        : Promise.resolve(0),
      workflowIds.length
        ? db.executionLog.count({ where: { workflowId: { in: workflowIds } } })
        : Promise.resolve(0),
      workflowIds.length
        ? db.executionLog.count({
            where: { workflowId: { in: workflowIds }, createdAt: { gte: thirtyDaysAgo } },
          })
        : Promise.resolve(0),
    ]);

    // Find the most active workflow (most execution logs)
    let mostActiveWorkflow: string | null = null;
    if (workflowIds.length) {
      const runCounts = await db.executionLog.groupBy({
        by: ["workflowId"],
        where: { workflowId: { in: workflowIds } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 1,
      });
      if (runCounts.length > 0) {
        const topId = runCounts[0].workflowId;
        const wf = await db.workflows.findUnique({
          where: { id: topId },
          select: { name: true },
        });
        mostActiveWorkflow = wf?.name ?? null;
      }
    }

    const successRate =
      totalRuns > 0 ? Math.round((successCount / totalRuns) * 100 * 10) / 10 : 0;
    const totalSavings = Math.round(successCount * 0.5 * 10) / 10;
    const monthlyCost = Math.round(totalRuns * 0.005 * 100) / 100;

    return {
      totalWorkflows,
      activeAutomations,
      unpublishedWorkflows,
      totalRuns,
      successCount,
      failedCount,
      last30DaysRuns,
      totalSavings,
      successRate,
      monthlyCost,
      mostActiveWorkflow,
      googleDriveConnected: !!user.localGoogleId,
      discordConnected: user.DiscordWebhook.length > 0,
      notionConnected: user.Notion.length > 0,
      slackConnected: user.Slack.length > 0,
      emailConnected: true,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

export async function getRecentActivity() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");

    const workflows = await db.workflows.findMany({
      where: { userId },
      select: { id: true, name: true, publish: true },
    });

    const workflowIds = workflows.map((w) => w.id);
    const workflowMap = new Map(workflows.map((w) => [w.id, w]));

    const recentLogs = workflowIds.length
      ? await db.executionLog.findMany({
          where: { workflowId: { in: workflowIds } },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, workflowId: true, step: true, status: true, createdAt: true },
        })
      : [];

    if (recentLogs.length > 0) {
      return recentLogs.map((log) => {
        const workflow = workflowMap.get(log.workflowId);
        const seconds = Math.floor((Date.now() - new Date(log.createdAt).getTime()) / 1000);
        const time =
          seconds < 60
            ? "Just now"
            : seconds < 3600
            ? `${Math.floor(seconds / 60)}m ago`
            : seconds < 86400
            ? `${Math.floor(seconds / 3600)}h ago`
            : `${Math.floor(seconds / 86400)}d ago`;

        return {
          id: log.id,
          type: "execution",
          title: `${workflow?.name ?? "Workflow"} → ${log.step}`,
          time,
          status: log.status,
          workflowId: log.workflowId,
        };
      });
    }

    return workflows.slice(0, 10).map((workflow) => ({
      id: workflow.id,
      type: "workflow",
      title: workflow.name,
      time: "No runs yet",
      status: workflow.publish ? "active" : "draft",
      workflowId: workflow.id,
    }));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }
}

export async function getConnectionStatus() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");

    await getOrCreateUser(userId);

    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: {
        DiscordWebhook: { select: { id: true } },
        Notion: { select: { id: true } },
        Slack: { select: { id: true } },
      },
    });

    if (!user) throw new Error("User not found");

    return {
      googleDrive: true,
      email: true,
      slack: user.Slack.length > 0,
      discord: user.DiscordWebhook.length > 0,
      notion: user.Notion.length > 0,
    };
  } catch (error) {
    console.error("Error fetching connection status:", error);
    throw error;
  }
}

export async function getAutomationStatus() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("User not authenticated");

    const workflows = await db.workflows.findMany({
      where: { userId },
      select: { id: true, publish: true },
    });

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter((w) => w.publish).length;

    return {
      totalWorkflows,
      activeWorkflows,
    };
  } catch (error) {
    console.error("Error fetching automation status:", error);
    throw error;
  }
}

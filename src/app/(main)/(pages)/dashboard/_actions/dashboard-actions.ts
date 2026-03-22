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
        workflows: { select: { id: true, publish: true, zoomMeetingId: true } },
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
    const meetingsProcessed = user.workflows.filter((w) => w.zoomMeetingId).length;

    const [successCount, failedCount, totalRuns] = await Promise.all([
      workflowIds.length
        ? db.executionLog.count({ where: { workflowId: { in: workflowIds }, status: "success" } })
        : Promise.resolve(0),
      workflowIds.length
        ? db.executionLog.count({ where: { workflowId: { in: workflowIds }, status: "failed" } })
        : Promise.resolve(0),
      workflowIds.length
        ? db.executionLog.count({ where: { workflowId: { in: workflowIds } } })
        : Promise.resolve(0),
    ]);

    const successRate =
      totalRuns > 0 ? Math.round((successCount / totalRuns) * 100 * 10) / 10 : 0;
    const totalSavings = Math.round(successCount * 0.5 * 10) / 10;
    const monthlyCost = Math.round(totalRuns * 0.005 * 100) / 100;

    return {
      totalWorkflows,
      activeAutomations,
      meetingsProcessed,
      totalRuns,
      successCount,
      failedCount,
      totalSavings,
      successRate,
      monthlyCost,
      googleDriveConnected: !!user.localGoogleId,
      discordConnected: user.DiscordWebhook.length > 0,
      notionConnected: user.Notion.length > 0,
      slackConnected: user.Slack.length > 0,
      emailConnected: true,
      zoomConnected: true,
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
      select: { id: true, name: true, publish: true, zoomMeetingId: true, zoomMeetingTitle: true, zoomSummary: true, zoomTranscript: true },
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
          hasSummary: !!workflow?.zoomSummary,
          hasTranscript: !!workflow?.zoomTranscript,
          isZoomWorkflow: !!workflow?.zoomMeetingId,
        };
      });
    }

    return workflows.slice(0, 10).map((workflow) => ({
      id: workflow.id,
      type: workflow.zoomMeetingId ? "meeting" : "workflow",
      title: workflow.zoomMeetingTitle || workflow.name,
      time: "No runs yet",
      status: workflow.publish ? "active" : "draft",
      workflowId: workflow.id,
      hasSummary: !!workflow.zoomSummary,
      hasTranscript: !!workflow.zoomTranscript,
      isZoomWorkflow: !!workflow.zoomMeetingId,
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
      zoom: true,
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
      select: { id: true, publish: true, zoomMeetingId: true },
    });

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter((w) => w.publish).length;
    const zoomWorkflows = workflows.filter((w) => w.zoomMeetingId).length;
    const zoomMonitoringProgress =
      totalWorkflows > 0 ? Math.round((zoomWorkflows / totalWorkflows) * 100) : 0;

    return {
      zoomMonitoring: { active: activeWorkflows > 0, progress: zoomMonitoringProgress },
      whisperTranscription: { enabled: zoomWorkflows > 0, progress: zoomWorkflows > 0 ? 92 : 0 },
      aiSummaries: { running: zoomWorkflows > 0, progress: zoomWorkflows > 0 ? 78 : 0 },
      totalWorkflows,
      activeWorkflows,
      zoomWorkflows,
    };
  } catch (error) {
    console.error("Error fetching automation status:", error);
    throw error;
  }
}

"use server";

import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function getDashboardStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        workflows: true,
        connections: true,
        DiscordWebhook: true,
        Notion: true,
        Slack: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Calculate real statistics
    const totalWorkflows = user.workflows.length;
    const activeAutomations = user.workflows.filter(
      (w) => w.publish === true
    ).length;

    // Count meetings processed (workflows with Zoom data)
    const meetingsProcessed = user.workflows.filter(
      (w) => w.zoomMeetingId
    ).length;

    // Calculate time saved (estimate: 30 min per meeting processed)
    const totalSavings = meetingsProcessed * 0.5; // 30 minutes = 0.5 hours

    // Calculate success rate (workflows with summaries vs total)
    const successfulMeetings = user.workflows.filter(
      (w) => w.zoomSummary
    ).length;
    const successRate =
      meetingsProcessed > 0
        ? (successfulMeetings / meetingsProcessed) * 100
        : 0;

    // Estimate monthly cost (assuming $0.005 per meeting)
    const monthlyCost = meetingsProcessed * 0.005;

    // Count connections
    const connectionCount = user.connections.length;
    const googleDriveConnected = !!user.localGoogleId;
    const discordConnected = user.DiscordWebhook.length > 0;
    const notionConnected = user.Notion.length > 0;
    const slackConnected = user.Slack.length > 0;

    return {
      totalWorkflows,
      activeAutomations,
      meetingsProcessed,
      totalSavings: Math.round(totalSavings * 10) / 10, // Round to 1 decimal
      successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal
      monthlyCost: Math.round(monthlyCost * 100) / 100, // Round to 2 decimals
      connectionCount,
      googleDriveConnected,
      discordConnected,
      notionConnected,
      slackConnected,
      emailConnected: true, // Email is always connected via Google OAuth
      zoomConnected: true, // Zoom uses Google OAuth
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

export async function getRecentActivity() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get recent workflows - show all workflows, not just Zoom ones
    const recentWorkflows = await prisma.workflows.findMany({
      where: {
        userId: userId,
      },
      orderBy: { id: "desc" },
      take: 10,
    });

    const activities = recentWorkflows.map((workflow, index) => {
      const hoursAgo = index; // Simple mock for now - in real app, use createdAt
      const duration = "45 min"; // Mock duration

      // Determine if this is a Zoom workflow or regular workflow
      const isZoomWorkflow = !!workflow.zoomMeetingId;
      const title = isZoomWorkflow
        ? workflow.zoomMeetingTitle || `Zoom Meeting ${index + 1}`
        : workflow.name || `Workflow ${index + 1}`;

      return {
        id: workflow.id,
        type: isZoomWorkflow ? "meeting" : "workflow",
        title: title,
        time: hoursAgo === 0 ? "Just now" : `${hoursAgo} hours ago`,
        status: isZoomWorkflow
          ? workflow.zoomSummary
            ? "completed"
            : "processing"
          : workflow.publish
          ? "active"
          : "draft",
        duration: isZoomWorkflow ? duration : undefined,
        workflowId: workflow.id,
        hasSummary: !!workflow.zoomSummary,
        hasTranscript: !!workflow.zoomTranscript,
        isZoomWorkflow: isZoomWorkflow,
      };
    });

    return activities;
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    throw error;
  }
}

export async function getConnectionStatus() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        connections: true,
        DiscordWebhook: true,
        Notion: true,
        Slack: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Align with Connections page behavior: Drive, Email, Zoom considered connected by default
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
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        workflows: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const totalWorkflows = user.workflows.length;
    const activeWorkflows = user.workflows.filter(
      (w) => w.publish === true
    ).length;
    const zoomWorkflows = user.workflows.filter((w) => w.zoomMeetingId).length;

    // Calculate percentages
    const zoomMonitoringProgress =
      totalWorkflows > 0 ? (zoomWorkflows / totalWorkflows) * 100 : 0;
    const whisperProgress = zoomWorkflows > 0 ? 92 : 0; // Mock for now
    const aiSummaryProgress = zoomWorkflows > 0 ? 78 : 0; // Mock for now

    return {
      zoomMonitoring: {
        active: activeWorkflows > 0,
        progress: Math.round(zoomMonitoringProgress),
      },
      whisperTranscription: {
        enabled: zoomWorkflows > 0,
        progress: whisperProgress,
      },
      aiSummaries: {
        running: zoomWorkflows > 0,
        progress: aiSummaryProgress,
      },
      totalWorkflows,
      activeWorkflows,
      zoomWorkflows,
    };
  } catch (error) {
    console.error("Error fetching automation status:", error);
    throw error;
  }
}

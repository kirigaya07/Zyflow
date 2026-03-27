"use server";

/**
 * Workflow Connections Actions Module
 *
 * This module handles server-side workflow management operations:
 * - Workflow creation, publishing, and configuration
 * - Node template management for different service integrations
 * - Database operations for workflow persistence
 * - Google Drive listener configuration
 * - Multi-service workflow orchestration
 *
 * Features:
 * - Support for Discord, Slack, Notion, Email, and Zoom integrations
 * - Template-based workflow configuration
 * - Publishing/unpublishing workflow controls
 * - Node and edge persistence for visual workflows
 * - Channel and recipient management for messaging services
 */

import { Option } from "@/components/ui/multiple-selector";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/encryption";
import { auth, currentUser } from "@clerk/nextjs/server";

/**
 * Retrieves Google Drive listener configuration for the current user.
 *
 * This function:
 * - Authenticates the current user
 * - Fetches Google resource ID for Drive API webhooks
 * - Returns listener configuration for workflow triggers
 *
 * @returns User's Google Drive listener configuration or undefined
 */
export const getGoogleListener = async () => {
  const { userId } = await auth();

  if (userId) {
    const listener = await db.user.findUnique({
      where: {
        clerkId: userId,
      },
      select: {
        googleResourceId: true,
      },
    });

    if (listener) return listener;
  }
};

/**
 * Toggles the published state of a workflow.
 *
 * This function:
 * - Updates workflow publish status in database
 * - Returns user-friendly status message
 * - Controls workflow activation/deactivation
 *
 * @param workflowId - Unique identifier of the workflow
 * @param state - New publish state (true = published, false = unpublished)
 * @returns Success message indicating current publish status
 */
export const onFlowPublish = async (workflowId: string, state: boolean) => {
  const { userId } = await auth();
  if (!userId) return "Unauthorized";

  if (state) {
    const workflow = await db.workflows.findUnique({
      where: { id: workflowId, userId },
      select: { flowPath: true },
    });

    let path: string[] = [];
    try {
      path = workflow?.flowPath ? JSON.parse(workflow.flowPath) : [];
    } catch {
      path = [];
    }

    if (!path.length) {
      return "Cannot publish: connect your nodes and save the workflow first.";
    }
  }

  const published = await db.workflows.update({
    where: { id: workflowId, userId },
    data: { publish: state },
  });

  if (published.publish) return "Workflow published";
  return "Workflow unpublished";
};

/**
 * Creates or updates node templates for different service integrations.
 *
 * This function:
 * - Handles template configuration for Discord, Slack, Notion, Email, and Zoom
 * - Stores service-specific settings and authentication tokens
 * - Manages channel/recipient lists for messaging services
 * - Updates workflow database records with template data
 *
 * Supported service types:
 * - Discord: Message templates and webhook configuration
 * - Slack: Channel selection and message templates
 * - Notion: Database integration and content templates
 * - Email: Recipient management and email templates
 * - Zoom: Meeting integration and summary templates
 *
 * @param content - Template content/message for the service
 * @param type - Service type (Discord, Slack, Notion, Email, Zoom)
 * @param workflowId - Unique identifier of the workflow
 * @param channels - Optional Slack channels for message distribution
 * @param accessToken - Optional OAuth token for service authentication
 * @param notionDbId - Optional Notion database ID for content creation
 * @param emailRecipients - Optional email recipient list
 * @param emailSubject - Optional email subject template
 * @param zoomMeetingId - Optional Zoom meeting identifier
 * @param zoomMeetingTitle - Optional Zoom meeting title
 * @returns Success message for the specific service template
 */
export const onCreateNodeTemplate = async (
  content: string,
  type: string,
  workflowId: string,
  channels?: Option[],
  accessToken?: string,
  notionDbId?: string,
  emailRecipients?: Option[],
  emailSubject?: string,
) => {
  if (type === "Discord") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        discordTemplate: content,
      },
    });

    if (response) {
      return "Discord template saved";
    }
  }
  if (type === "Slack") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        slackTemplate: content,
        slackAccessToken: accessToken ? encrypt(accessToken) : undefined,
      },
    });

    if (response) {
      // Clear existing channels and add new ones
      if (channels && channels.length > 0) {
        await db.workflows.update({
          where: {
            id: workflowId,
          },
          data: {
            slackChannels: channels.map((channel) => channel.value),
          },
        });
      }
      return "Slack template saved";
    }
  }

  if (type === "Notion") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        notionTemplate: content,
        notionAccessToken: accessToken ? encrypt(accessToken) : undefined,
        notionDbId: notionDbId,
      },
    });

    if (response) return "Notion template saved";
  }

  if (type === "Email") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        emailTemplate: content,
        emailSubject: emailSubject,
      },
    });

    if (response) {
      // Clear existing recipients and add new ones
      if (emailRecipients && emailRecipients.length > 0) {
        await db.workflows.update({
          where: {
            id: workflowId,
          },
          data: {
            emailRecipients: emailRecipients.map(
              (recipient) => recipient.value
            ),
          },
        });
      }
      return "Email template saved";
    }
  }

};

/**
 * Retrieves all workflows for the current authenticated user.
 *
 * This function:
 * - Authenticates the current user via Clerk
 * - Queries database for user's workflows
 * - Returns array of workflow objects
 *
 * @returns Array of user's workflows or undefined if user not found
 */
export const onGetWorkflows = async () => {
  const user = await currentUser();
  if (user) {
    const workflow = await db.workflows.findMany({
      where: {
        userId: user.id,
      },
    });

    if (workflow) return workflow;
  }
};

/**
 * Creates a new workflow for the current user.
 *
 * This function:
 * - Authenticates the current user
 * - Creates new workflow record in database
 * - Sets initial workflow configuration
 * - Returns creation status message
 *
 * @param name - Display name for the new workflow
 * @param description - Brief description of workflow purpose
 * @returns Object containing success or error message
 */
export const onCreateWorkflow = async (name: string, description?: string) => {
  if (!name) return { message: "Name is required" };

  const user = await currentUser();

  if (user) {
    const workflow = await db.workflows.create({
      data: {
        userId: user.id,
        name,
        description: description ?? "",
      },
    });

    if (workflow) return { message: "workflow created" };
    return { message: "Oops! try again" };
  }
};

/**
 * Retrieves the visual flow data (nodes and edges) for a specific workflow.
 *
 * This function:
 * - Queries workflow by ID
 * - Returns serialized nodes and edges data
 * - Used for loading existing workflows in the visual editor
 *
 * @param flowId - Unique identifier of the workflow
 * @returns Object containing nodes and edges JSON data, or undefined if not found
 */
export const onGetNodesEdges = async (flowId: string) => {
  const { userId } = await auth();
  if (!userId) return null;

  const nodesEdges = await db.workflows.findUnique({
    where: { id: flowId, userId },
    select: { nodes: true, edges: true },
  });
  if (nodesEdges?.nodes && nodesEdges?.edges) return nodesEdges;
};

/**
 * Returns the last 50 execution log entries for a workflow, newest first.
 * Only returns logs for workflows owned by the current user.
 */
export const getWorkflowExecutionLogs = async (workflowId: string) => {
  const { userId } = await auth();
  if (!userId) return null;

  const workflow = await db.workflows.findUnique({
    where: { id: workflowId, userId },
    select: { id: true },
  });
  if (!workflow) return null;

  return db.executionLog.findMany({
    where: { workflowId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
};

/**
 * Returns the last 20 WorkflowRun records with their NodeRun children for the editor history panel.
 */
export const getWorkflowRuns = async (workflowId: string) => {
  const { userId } = await auth();
  if (!userId) return null;

  const workflow = await db.workflows.findUnique({
    where: { id: workflowId, userId },
    select: { id: true, publish: true },
  });
  if (!workflow) return null;

  const runs = await db.workflowRun.findMany({
    where: { workflowId },
    orderBy: { startedAt: "desc" },
    take: 20,
    include: {
      nodeRuns: {
        orderBy: { startedAt: "asc" },
        select: {
          id: true,
          nodeId: true,
          nodeType: true,
          status: true,
          inputData: true,
          outputData: true,
          error: true,
          startedAt: true,
          completedAt: true,
        },
      },
    },
  });

  return { runs, isPublished: workflow.publish ?? false };
};

/**
 * Permanently deletes a workflow owned by the current user.
 */
export const deleteWorkflow = async (workflowId: string) => {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  await db.workflows.delete({ where: { id: workflowId, userId } });
  return { message: "Workflow deleted" };
};

/**
 * Creates an exact copy of a workflow (unpublished) with "(Copy)" appended to the name.
 */
export const duplicateWorkflow = async (workflowId: string) => {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };

  const source = await db.workflows.findUnique({
    where: { id: workflowId, userId },
  });
  if (!source) return { error: "Workflow not found" };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, ...rest } = source;
  const copy = await db.workflows.create({
    data: { ...rest, name: `${rest.name} (Copy)`, publish: false },
  });

  return { message: "Workflow duplicated", id: copy.id };
};

/**
 * Returns the total execution log count for each of the given workflow IDs.
 * Used by the workflow list to show run counts on each card.
 */
export const getRunCountsForWorkflows = async (
  workflowIds: string[]
): Promise<Record<string, number>> => {
  if (!workflowIds.length) return {};

  const rows = await db.executionLog.groupBy({
    by: ["workflowId"],
    where: { workflowId: { in: workflowIds } },
    _count: { id: true },
  });

  return Object.fromEntries(rows.map((r) => [r.workflowId, r._count.id]));
};

/**
 * Returns the most recent ExecutionLog entry for each of the given workflow IDs.
 * Used by the workflow list to show last-run status on each card.
 */
export const getLastRunsForWorkflows = async (workflowIds: string[]) => {
  if (!workflowIds.length) return [];

  const rows = await Promise.all(
    workflowIds.map((id) =>
      db.executionLog.findFirst({
        where: { workflowId: id },
        orderBy: { createdAt: "desc" },
        select: { workflowId: true, status: true, createdAt: true },
      })
    )
  );

  return rows.filter(Boolean) as {
    workflowId: string;
    status: string;
    createdAt: Date;
  }[];
};

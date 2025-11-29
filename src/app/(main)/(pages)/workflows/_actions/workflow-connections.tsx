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
  console.log(state);
  const published = await db.workflows.update({
    where: {
      id: workflowId,
    },
    data: {
      publish: state,
    },
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
  zoomMeetingId?: string,
  zoomMeetingTitle?: string
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
        slackAccessToken: accessToken,
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
        notionAccessToken: accessToken,
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

  if (type === "Zoom") {
    const response = await db.workflows.update({
      where: {
        id: workflowId,
      },
      data: {
        zoomMeetingId: zoomMeetingId,
        zoomMeetingTitle: zoomMeetingTitle,
        zoomSummary: content,
      },
    });

    if (response) {
      return "Zoom template saved";
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
export const onCreateWorkflow = async (name: string, description: string) => {
  const user = await currentUser();

  if (user) {
    //create new workflow
    const workflow = await db.workflows.create({
      data: {
        userId: user.id,
        name,
        description,
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
  const nodesEdges = await db.workflows.findUnique({
    where: {
      id: flowId,
    },
    select: {
      nodes: true,
      edges: true,
    },
  });
  if (nodesEdges?.nodes && nodesEdges?.edges) return nodesEdges;
};

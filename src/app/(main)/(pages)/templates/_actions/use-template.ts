/**
 * Template Instantiation Server Actions
 *
 * This module provides server-side functionality for creating workflows from pre-built templates:
 * - Template definitions with metadata and node configurations
 * - Workflow instantiation from template specifications
 * - Database operations for storing new workflows
 * - UUID generation for unique node and edge identifiers
 *
 * Features:
 * - Multiple pre-defined workflow templates for common automation scenarios
 * - Dynamic node and edge generation with proper positioning
 * - Template metadata management with names and descriptions
 * - Workflow creation with user authentication and validation
 * - Flow path generation for workflow execution routing
 */

"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { EditorNodeType } from "@/lib/types";

/**
 * Supported template identifiers for workflow instantiation.
 * Each template represents a specific automation pattern with predefined nodes and connections.
 */
type TemplateId =
  | "webhook-to-slack-notion"
  | "drive-to-slack"
  | "drive-to-discord"
  | "summary-to-notion"
  | "discord-announcements"
  | "email-digest";

/**
 * Template metadata containing display names and descriptions for each available template.
 * This metadata is used for template display and workflow creation.
 */
const TEMPLATE_META: Record<TemplateId, { name: string; description: string }> =
  {
    "webhook-to-slack-notion": {
      name: "Webhook → Slack + Notion",
      description:
        "Receive a webhook, post a Slack message, and create a Notion page — all in one flow.",
    },
    "drive-to-slack": {
      name: "Drive Upload → Slack Notification",
      description:
        "Notify a Slack channel when a new file is added in Google Drive.",
    },
    "drive-to-discord": {
      name: "Drive Upload → Discord Notification",
      description:
        "Notify a Discord channel when a new file is added in Google Drive.",
    },
    "summary-to-notion": {
      name: "Transcript → AI Summary → Notion Page",
      description:
        "Generate a Notion page from a transcript with key points and action items.",
    },
    "discord-announcements": {
      name: "Meeting Summary → Discord Announcement",
      description:
        "Publish meeting highlights to a Discord channel with mentions and links.",
    },
    "email-digest": {
      name: "Daily Summary → Email Digest",
      description: "Send a daily digest email with all meeting summaries.",
    },
  };

function createWebhookToSlackNotionNodes(): {
  nodes: EditorNodeType[];
  edges: any[];
} {
  const generateId = () => crypto.randomUUID();

  const nodes: EditorNodeType[] = [
    {
      id: generateId(),
      type: "Webhook Trigger",
      position: { x: 100, y: 100 },
      data: {
        title: "Webhook Trigger",
        description: "Start a workflow when a POST request is sent to a unique URL.",
        completed: false,
        current: true,
        metadata: {},
        type: "Webhook Trigger",
      },
    },
    {
      id: generateId(),
      type: "Slack",
      position: { x: 400, y: 50 },
      data: {
        title: "Slack",
        description: "Send a notification to slack",
        completed: false,
        current: false,
        metadata: {},
        type: "Slack",
      },
    },
    {
      id: generateId(),
      type: "Notion",
      position: { x: 400, y: 250 },
      data: {
        title: "Notion",
        description: "Create entries directly in notion.",
        completed: false,
        current: false,
        metadata: {},
        type: "Notion",
      },
    },
  ];

  const edges = [
    { id: generateId(), source: nodes[0].id, target: nodes[1].id },
    { id: generateId(), source: nodes[0].id, target: nodes[2].id },
  ];

  return { nodes, edges };
}

function createDriveToSlackNodes(): { nodes: EditorNodeType[]; edges: any[] } {
  // Generate proper UUIDs for template nodes
  const generateId = () => crypto.randomUUID();

  const nodes: EditorNodeType[] = [
    {
      id: generateId(),
      type: "Google Drive",
      position: { x: 100, y: 100 },
      data: {
        title: "Google Drive",
        description:
          "Connect with Google drive to trigger actions or to create files and folders.",
        completed: false,
        current: true,
        metadata: {},
        type: "Google Drive",
      },
    },
    {
      id: generateId(),
      type: "Slack",
      position: { x: 400, y: 100 },
      data: {
        title: "Slack",
        description: "Send a notification to slack",
        completed: false,
        current: false,
        metadata: {},
        type: "Slack",
      },
    },
  ];

  const edges = [
    { id: generateId(), source: nodes[0].id, target: nodes[1].id },
  ];

  return { nodes, edges };
}

function createDriveToDiscordNodes(): {
  nodes: EditorNodeType[];
  edges: any[];
} {
  // Generate proper UUIDs for template nodes
  const generateId = () => crypto.randomUUID();

  const nodes: EditorNodeType[] = [
    {
      id: generateId(),
      type: "Google Drive",
      position: { x: 100, y: 100 },
      data: {
        title: "Google Drive",
        description:
          "Connect with Google drive to trigger actions or to create files and folders.",
        completed: false,
        current: true,
        metadata: {},
        type: "Google Drive",
      },
    },
    {
      id: generateId(),
      type: "Discord",
      position: { x: 400, y: 100 },
      data: {
        title: "Discord",
        description: "Post messages to your discord server",
        completed: false,
        current: false,
        metadata: {},
        type: "Discord",
      },
    },
  ];

  const edges = [
    { id: generateId(), source: nodes[0].id, target: nodes[1].id },
  ];

  return { nodes, edges };
}

function createSummaryToNotionNodes(): {
  nodes: EditorNodeType[];
  edges: any[];
} {
  // Generate proper UUIDs for template nodes
  const generateId = () => crypto.randomUUID();

  const nodes: EditorNodeType[] = [
    {
      id: generateId(),
      type: "Trigger",
      position: { x: 100, y: 100 },
      data: {
        title: "Transcript Input",
        description: "Upload or paste transcript",
        completed: false,
        current: true,
        metadata: {},
        type: "Trigger",
      },
    },
    {
      id: generateId(),
      type: "AI",
      position: { x: 400, y: 100 },
      data: {
        title: "AI Summary",
        description: "Generate structured summary",
        completed: false,
        current: false,
        metadata: {},
        type: "AI",
      },
    },
    {
      id: generateId(),
      type: "Notion",
      position: { x: 700, y: 100 },
      data: {
        title: "Notion Page",
        description: "Create structured page",
        completed: false,
        current: false,
        metadata: {},
        type: "Notion",
      },
    },
  ];

  const edges = [
    { id: generateId(), source: nodes[0].id, target: nodes[1].id },
    { id: generateId(), source: nodes[1].id, target: nodes[2].id },
  ];

  return { nodes, edges };
}

function createDiscordAnnouncementsNodes(): {
  nodes: EditorNodeType[];
  edges: any[];
} {
  // Generate proper UUIDs for template nodes
  const generateId = () => crypto.randomUUID();

  const nodes: EditorNodeType[] = [
    {
      id: generateId(),
      type: "Trigger",
      position: { x: 100, y: 100 },
      data: {
        title: "Meeting Summary",
        description: "Input meeting summary",
        completed: false,
        current: true,
        metadata: {},
        type: "Trigger",
      },
    },
    {
      id: generateId(),
      type: "Discord",
      position: { x: 400, y: 100 },
      data: {
        title: "Discord Announcement",
        description: "Publish to Discord channel",
        completed: false,
        current: false,
        metadata: {},
        type: "Discord",
      },
    },
  ];

  const edges = [
    { id: generateId(), source: nodes[0].id, target: nodes[1].id },
  ];

  return { nodes, edges };
}

function createEmailDigestNodes(): { nodes: EditorNodeType[]; edges: any[] } {
  // Generate proper UUIDs for template nodes
  const generateId = () => crypto.randomUUID();

  const nodes: EditorNodeType[] = [
    {
      id: generateId(),
      type: "Trigger",
      position: { x: 100, y: 100 },
      data: {
        title: "Daily Trigger",
        description: "Run daily at 9 AM",
        completed: false,
        current: true,
        metadata: {},
        type: "Trigger",
      },
    },
    {
      id: generateId(),
      type: "Google Drive",
      position: { x: 400, y: 100 },
      data: {
        title: "Google Drive",
        description:
          "Connect with Google drive to trigger actions or to create files and folders.",
        completed: false,
        current: false,
        metadata: {},
        type: "Google Drive",
      },
    },
    {
      id: generateId(),
      type: "Email",
      position: { x: 700, y: 100 },
      data: {
        title: "Email Digest",
        description: "Send daily digest email",
        completed: false,
        current: false,
        metadata: {},
        type: "Email",
      },
    },
  ];

  const edges = [
    { id: generateId(), source: nodes[0].id, target: nodes[1].id },
    { id: generateId(), source: nodes[1].id, target: nodes[2].id },
  ];

  return { nodes, edges };
}

/**
 * Server action to instantiate a workflow from a pre-built template.
 *
 * This function handles the complete workflow creation process:
 * - Validates user authentication and template availability
 * - Generates workflow nodes and edges based on template type
 * - Calculates flow execution paths for workflow routing
 * - Creates database record with template configuration
 * - Returns workflow ID for navigation to editor
 *
 * Template instantiation process:
 * 1. Authenticate user and validate template existence
 * 2. Generate nodes and edges using template-specific creation functions
 * 3. Calculate flow paths for workflow execution routing
 * 4. Create workflow database record with generated configuration
 * 5. Return success response with new workflow ID
 *
 * Security considerations:
 * - Requires authenticated user via Clerk
 * - Associates workflow with authenticated user ID
 * - Validates template ID against allowed templates
 *
 * @param templateId - The template identifier to instantiate
 * @returns Promise<{ok: boolean, workflowId?: string, error?: string}> - Result with workflow ID or error
 */
export async function useTemplate(templateId: TemplateId) {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Unauthorized" };

  const meta = TEMPLATE_META[templateId];
  if (!meta) return { ok: false, error: "Unknown template" };

  let nodes: EditorNodeType[] = [];
  let edges: any[] = [];

  // Generate template-specific workflow configuration
  switch (templateId) {
    case "webhook-to-slack-notion":
      ({ nodes, edges } = createWebhookToSlackNotionNodes());
      break;
    case "drive-to-slack":
      ({ nodes, edges } = createDriveToSlackNodes());
      break;
    case "drive-to-discord":
      ({ nodes, edges } = createDriveToDiscordNodes());
      break;
    case "summary-to-notion":
      ({ nodes, edges } = createSummaryToNotionNodes());
      break;
    case "discord-announcements":
      ({ nodes, edges } = createDiscordAnnouncementsNodes());
      break;
    case "email-digest":
      ({ nodes, edges } = createEmailDigestNodes());
      break;
  }

  // Generate flowPath from connected edges (same logic as flow-instance.tsx)
  // This creates the execution order for workflow processing
  const flows: any = [];
  const connectedEdges = edges.map((edge) => edge.target);
  connectedEdges.map((target) => {
    nodes.map((node) => {
      if (node.id === target) {
        flows.push(node.type);
      }
    });
  });

  // Create workflow database record with template configuration
  const workflow = await db.workflows.create({
    data: {
      userId: user.id,
      name: meta.name,
      description: meta.description,
      nodes: JSON.stringify(nodes),
      edges: JSON.stringify(edges),
      flowPath: JSON.stringify(flows),
      publish: false, // Templates start unpublished for user configuration
    },
    select: { id: true },
  });

  return { ok: true, workflowId: workflow.id };
}

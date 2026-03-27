"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Fetches the user's saved connection credentials for Slack, Notion, and Discord.
 * Tokens are returned as-is (encrypted) — executors call safeDecrypt internally.
 */
export const getConnectedServices = async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const [slack, notion, discord] = await Promise.all([
    db.slack.findFirst({
      where: { userId },
      select: { slackAccessToken: true, teamName: true },
    }),
    db.notion.findFirst({
      where: { userId },
      select: { accessToken: true, workspaceName: true },
    }),
    db.discordWebhook.findFirst({
      where: { userId },
      select: { url: true, name: true, guildName: true },
    }),
  ]);

  return {
    slack: slack
      ? { token: slack.slackAccessToken, teamName: slack.teamName ?? "Slack" }
      : null,
    notion: notion
      ? { token: notion.accessToken, workspaceName: notion.workspaceName ?? "Notion" }
      : null,
    discord: discord
      ? { url: discord.url, name: discord.name ?? "Discord", guildName: discord.guildName ?? "" }
      : null,
  };
};

/**
 * Returns the workflow name and publish status — used by the editor toolbar.
 */
export const getWorkflowMeta = async (workflowId: string) => {
  const { userId } = await auth();
  if (!userId) return null;
  return db.workflows.findUnique({
    where: { id: workflowId, userId },
    select: { name: true, publish: true },
  });
};

export const onCreateNodesEdges = async (
  flowId: string,
  nodes: string,
  edges: string,
  flowPath: string
) => {
  const { userId } = await auth();
  if (!userId) return { message: "Unauthorized" };

  const flow = await db.workflows.update({
    where: { id: flowId, userId },
    data: { nodes, edges, flowPath },
  });

  if (flow) return { message: "flow saved" };
};

"use server";

/**
 * Slack Connection Actions Module
 *
 * This module handles Slack workspace integration functionality:
 * - OAuth callback processing for Slack bot connections
 * - Channel listing and management
 * - Message posting to Slack channels
 * - Multi-channel broadcasting capabilities
 *
 * Features:
 * - Bot token management and authentication
 * - Channel permissions and membership validation
 * - Bulk message posting to multiple channels
 * - Error handling for Slack API operations
 */

import { Option } from "@/components/ui/multiple-selector";
import { db } from "@/lib/db";
import { encrypt, safeDecrypt } from "@/lib/encryption";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";

/**
 * Processes Slack OAuth callback and creates bot connection.
 *
 * This function:
 * - Validates Slack OAuth tokens from callback
 * - Prevents duplicate connections for the same workspace
 * - Creates database records for bot and connection
 * - Stores workspace and bot metadata
 *
 * @param app_id - Slack app identifier
 * @param authed_user_id - Authenticated user ID in Slack
 * @param authed_user_token - User-specific OAuth token
 * @param slack_access_token - Bot access token for API calls
 * @param bot_user_id - Bot user ID in the workspace
 * @param team_id - Slack workspace (team) identifier
 * @param team_name - Display name of the Slack workspace
 * @param user_id - User ID from Clerk authentication
 */
export const onSlackConnect = async (
  app_id: string,
  authed_user_id: string,
  authed_user_token: string,
  slack_access_token: string,
  bot_user_id: string,
  team_id: string,
  team_name: string,
  user_id: string
): Promise<void> => {
  if (!slack_access_token || !authed_user_token || !team_id || !user_id) return;

  // Upsert by userId + teamId composite key to prevent duplicate records
  await db.slack.upsert({
    where: { userId_teamId: { userId: user_id, teamId: team_id } },
    update: {
      appId: app_id,
      authedUserId: authed_user_id,
      authedUserToken: encrypt(authed_user_token),
      slackAccessToken: encrypt(slack_access_token),
      botUserId: bot_user_id,
      teamName: team_name,
    },
    create: {
      userId: user_id,
      appId: app_id,
      authedUserId: authed_user_id,
      authedUserToken: encrypt(authed_user_token),
      slackAccessToken: encrypt(slack_access_token),
      botUserId: bot_user_id,
      teamId: team_id,
      teamName: team_name,
      connections: {
        connectOrCreate: {
          where: { userId_type: { userId: user_id, type: "Slack" } },
          create: { userId: user_id, type: "Slack" },
        },
      },
    },
  });
};

/**
 * Retrieves the Slack connection details for the current user.
 *
 * @returns Slack connection data (tokens, workspace info) or null if not found
 */
export const getSlackConnection = async () => {
  const user = await currentUser();
  if (user) {
    const connection = await db.slack.findFirst({
      where: { userId: user.id },
    });
    if (!connection) return null;
    return {
      ...connection,
      authedUserToken: safeDecrypt(connection.authedUserToken),
      slackAccessToken: safeDecrypt(connection.slackAccessToken),
    };
  }
  return null;
};

/**
 * Lists all channels where the Slack bot is a member.
 *
 * This function:
 * - Queries Slack API for channel list
 * - Filters for channels where bot has membership
 * - Formats results for UI selector component
 * - Handles API errors and rate limiting
 *
 * @param slackAccessToken - Bot access token for Slack API
 * @returns Array of channel options with label and value pairs
 */
export async function listBotChannels(
  slackAccessToken: string
): Promise<Option[]> {
  const url = `https://slack.com/api/conversations.list?${new URLSearchParams({
    types: "public_channel,private_channel",
    limit: "200",
  })}`;

  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${slackAccessToken}` },
    });

    if (!data.ok) throw new Error(data.error);

    if (!data?.channels?.length) return [];

    return data.channels
      .filter((ch: any) => ch.is_member)
      .map((ch: any) => {
        return { label: ch.name, value: ch.id };
      });
  } catch (error: any) {
    console.error("Error listing bot channels:", error.message);
    throw error;
  }
}

const postMessageInSlackChannel = async (
  slackAccessToken: string,
  slackChannel: string,
  content: string
): Promise<void> => {
  try {
    await axios.post(
      "https://slack.com/api/chat.postMessage",
      { channel: slackChannel, text: content },
      {
        headers: {
          Authorization: `Bearer ${slackAccessToken}`,
          "Content-Type": "application/json;charset=utf-8",
        },
      }
    );
  } catch {
    // Swallow per-channel errors so other channels still receive the message
  }
};

/**
 * Posts messages to multiple Slack channels simultaneously.
 *
 * This function:
 * - Validates content and channel selection
 * - Posts messages to all selected channels
 * - Handles errors gracefully without stopping other posts
 * - Provides consolidated response status
 *
 * @param slackAccessToken - Bot access token for Slack API
 * @param selectedSlackChannels - Array of selected channel options
 * @param content - Message content to post
 * @returns Response object with success/failure status
 */
/**
 * Removes the Slack connection for the current user.
 */
export const disconnectSlack = async () => {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" };

  await db.slack.deleteMany({ where: { userId: user.id } });
  await db.connections.deleteMany({ where: { userId: user.id, type: "Slack" } });
  return { success: true };
};

export const postMessageToSlack = async (
  slackAccessToken: string,
  selectedSlackChannels: Option[],
  content: string
): Promise<{ message: string }> => {
  if (!content) return { message: "Content is empty" };
  if (!selectedSlackChannels?.length)
    return { message: "Channel not selected" };

  try {
    await Promise.all(
      selectedSlackChannels.map((channel) =>
        postMessageInSlackChannel(slackAccessToken, channel.value, content)
      )
    );
  } catch (error) {
    return { message: "Message could not be sent to Slack" };
  }

  return { message: "Success" };
};

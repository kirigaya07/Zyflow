"use server";

/**
 * Discord Connection Actions Module
 *
 * This module handles Discord webhook integration functionality:
 * - OAuth callback processing for Discord connections
 * - Webhook creation and management in the database
 * - Message posting to Discord channels via webhooks
 * - Connection status retrieval and validation
 *
 * Features:
 * - Duplicate webhook prevention
 * - Error handling for webhook operations
 * - Connection record management
 * - Message posting with error feedback
 */

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";

/**
 * Processes Discord OAuth callback and creates webhook connection.
 *
 * This function:
 * - Validates webhook parameters from Discord OAuth
 * - Prevents duplicate webhook creation for the same channel
 * - Creates database records for webhook and connection
 * - Handles existing webhook scenarios
 *
 * @param channel_id - Discord channel ID where webhook will operate
 * @param webhook_id - Unique Discord webhook identifier
 * @param webhook_name - Display name for the webhook
 * @param webhook_url - Discord webhook endpoint URL
 * @param id - User ID from Clerk authentication
 * @param guild_name - Discord server (guild) name
 * @param guild_id - Discord server (guild) ID
 */
export const onDiscordConnect = async (
  channel_id: string,
  webhook_id: string,
  webhook_name: string,
  webhook_url: string,
  id: string,
  guild_name: string,
  guild_id: string
) => {
  //check if webhook id params set
  if (webhook_id) {
    //check if webhook exists in database with userid
    const webhook = await db.discordWebhook.findFirst({
      where: {
        userId: id,
      },
      include: {
        connections: {
          select: {
            type: true,
          },
        },
      },
    });

    //if webhook does not exist for this user
    if (!webhook) {
      //create new webhook
      await db.discordWebhook.create({
        data: {
          userId: id,
          webhookId: webhook_id,
          channelId: channel_id!,
          guildId: guild_id!,
          name: webhook_name!,
          url: webhook_url!,
          guildName: guild_name!,
          connections: {
            create: {
              userId: id,
              type: "Discord",
            },
          },
        },
      });
    }

    //if webhook exists return check for duplicate
    if (webhook) {
      //check if webhook exists for target channel id
      const webhook_channel = await db.discordWebhook.findUnique({
        where: {
          channelId: channel_id,
        },
        include: {
          connections: {
            select: {
              type: true,
            },
          },
        },
      });

      //if no webhook for channel create new webhook
      if (!webhook_channel) {
        await db.discordWebhook.create({
          data: {
            userId: id,
            webhookId: webhook_id,
            channelId: channel_id!,
            guildId: guild_id!,
            name: webhook_name!,
            url: webhook_url!,
            guildName: guild_name!,
            connections: {
              create: {
                userId: id,
                type: "Discord",
              },
            },
          },
        });
      } else {
        // Webhook exists for this channel - ensure connection record exists
        const existingConnection = webhook_channel.connections.find(
          (conn) => conn.type === "Discord"
        );

        if (!existingConnection) {
          // Connection record missing, create it
          await db.connections.create({
            data: {
              userId: id,
              type: "Discord",
              discordWebhookId: webhook_channel.id,
            },
          });
        }
      }
    }
  }
};

/**
 * Retrieves the Discord webhook connection details for the current user.
 *
 * @returns Discord webhook data (URL, name, guild name) or null if not found
 */
export const getDiscordConnectionUrl = async () => {
  const user = await currentUser();
  if (user) {
    const webhook = await db.discordWebhook.findFirst({
      where: {
        userId: user.id,
      },
      select: {
        url: true,
        name: true,
        guildName: true,
      },
    });

    return webhook;
  }
};

/**
 * Posts content to a Discord channel via webhook.
 *
 * This function:
 * - Validates content before posting
 * - Handles webhook API communication
 * - Provides detailed error feedback
 * - Detects deleted/invalid webhooks
 *
 * @param content - Message content to post to Discord
 * @param url - Discord webhook URL endpoint
 * @returns Response object with success/failure status and error details
 */
export const postContentToWebHook = async (content: string, url: string) => {
  console.log("Posting to Discord webhook:", url);
  console.log("Content:", content);

  if (content != "") {
    try {
      const posted = await axios.post(url, { content });
      if (posted) {
        return { message: "success" };
      }
      return { message: "failed request" };
    } catch (error: any) {
      console.error(
        "Discord webhook error:",
        error.response?.status,
        error.response?.data
      );

      if (error.response?.status === 404) {
        return {
          message: "Webhook not found - please reconnect Discord integration",
          error: "webhook_deleted",
        };
      }

      return {
        message: `Failed to post: ${error.message}`,
        error: error.response?.data || error.message,
      };
    }
  }
  return { message: "String empty" };
};

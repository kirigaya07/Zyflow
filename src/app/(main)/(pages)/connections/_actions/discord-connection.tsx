"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";

export const onDiscordConnect = async (
  channel_id: string,
  webhook_id: string,
  webhook_name: string,
  webhook_url: string,
  id: string,
  guild_name: string,
  guild_id: string
) => {
  if (!webhook_id || !channel_id || !webhook_name || !webhook_url || !guild_id || !guild_name || !id) return;

  // Upsert webhook record per-user per-channel (composite unique: userId + channelId)
  await db.discordWebhook.upsert({
    where: { userId_channelId: { userId: id, channelId: channel_id } },
    update: {
      webhookId: webhook_id,
      url: webhook_url,
      name: webhook_name,
      guildName: guild_name,
      guildId: guild_id,
    },
    create: {
      userId: id,
      webhookId: webhook_id,
      channelId: channel_id,
      guildId: guild_id,
      name: webhook_name,
      url: webhook_url,
      guildName: guild_name,
      connections: {
        connectOrCreate: {
          where: { userId_type: { userId: id, type: "Discord" } },
          create: { userId: id, type: "Discord" },
        },
      },
    },
  });
};

export const getDiscordConnectionUrl = async () => {
  const user = await currentUser();
  if (user) {
    const webhook = await db.discordWebhook.findFirst({
      where: { userId: user.id },
      select: { url: true, name: true, guildName: true },
    });
    return webhook;
  }
};

export const connectDiscordManually = async (params: {
  webhookId: string;
  webhookUrl: string;
  webhookName: string;
  guildId: string;
  guildName: string;
  channelId: string;
}) => {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" };

  const { webhookId, webhookUrl, webhookName, guildId, guildName, channelId } = params;
  await onDiscordConnect(channelId, webhookId, webhookName, webhookUrl, user.id, guildName, guildId);
  return { success: true };
};

export const disconnectDiscord = async () => {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" };

  await db.discordWebhook.deleteMany({ where: { userId: user.id } });
  await db.connections.deleteMany({ where: { userId: user.id, type: "Discord" } });
  return { success: true };
};

export const postContentToWebHook = async (content: string, url: string) => {
  if (content !== "") {
    try {
      const posted = await axios.post(url, { content });
      if (posted) return { message: "success" };
      return { message: "failed request" };
    } catch (error: any) {
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

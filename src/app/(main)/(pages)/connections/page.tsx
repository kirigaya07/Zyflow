import { CONNECTIONS } from "@/lib/constants";
import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { onDiscordConnect } from "./_actions/discord-connection";
import { onNotionConnect } from "./_actions/notion-connection";
import { onSlackConnect } from "./_actions/slack-connection";
import { getUserData } from "./_actions/get-user";
import ConnectionCard from "./_components/connection-card";
import { getDiscordConnectionUrl } from "./_actions/discord-connection";
import { getSlackConnection } from "./_actions/slack-connection";
import { getNotionConnection } from "./_actions/notion-connection";
import { AlertCircle } from "lucide-react";

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

const ERROR_MESSAGES: Record<string, string> = {
  no_bot_token:            "Discord bot token is not configured — use the manual webhook option below.",
  webhook_creation_failed: "Could not create a webhook automatically — use the manual webhook option below.",
  no_text_channels:        "No text channels found in your Discord server.",
  no_guilds:               "No Discord servers found for your account.",
  no_code:                 "OAuth authorization failed — no code received.",
  oauth_failed:            "Discord OAuth failed. Please try again.",
  no_token:                "Discord did not return an access token. Please try again.",
};

const Connections = async (props: Props) => {
  const searchParams = await props.searchParams;

  const {
    webhook_id,
    webhook_name,
    webhook_url,
    guild_id,
    guild_name,
    channel_id,
    access_token,
    workspace_name,
    workspace_icon,
    workspace_id,
    app_id,
    authed_user_id,
    authed_user_token,
    slack_access_token,
    bot_user_id,
    team_id,
    team_name,
    discord_setup,
    error,
  } = searchParams ?? {};

  const user = await currentUser();
  if (!user) return null;

  const onUserConnections = async () => {
    if (webhook_id && channel_id && guild_id && !discord_setup) {
      await onDiscordConnect(
        channel_id!,
        webhook_id!,
        webhook_name!,
        webhook_url!,
        user.id,
        guild_name!,
        guild_id!
      );
    }

    if (workspace_id && access_token && !discord_setup) {
      await onNotionConnect(
        access_token!,
        workspace_id!,
        workspace_icon!,
        workspace_name!,
        user.id
      );
    }

    if (app_id && team_id && slack_access_token) {
      await onSlackConnect(
        app_id!,
        authed_user_id!,
        authed_user_token || "",
        slack_access_token!,
        bot_user_id!,
        team_id!,
        team_name!,
        user.id
      );
    }

    const connections: Record<string, boolean> = {};
    const user_info = await getUserData(user.id);
    user_info?.connections.forEach((connection) => {
      connections[connection.type] = true;
    });

    return {
      ...connections,
      "Google Drive": true,
      Email: true,
    };
  };

  const [connections, discord, slack, notion] = await Promise.all([
    onUserConnections(),
    getDiscordConnectionUrl(),
    getSlackConnection(),
    getNotionConnection(),
  ]);

  // Show the manual Discord form if OAuth flow indicated setup is needed
  const showManualDiscord = discord_setup === "true" || !!error?.startsWith("discord_") || !!error;

  const workspaceNames: Partial<Record<string, string>> = {
    Discord: discord?.guildName ? `${discord.name} — ${discord.guildName}` : discord?.name,
    Slack:   slack?.teamName,
    Notion:  notion?.workspaceName,
  };

  const errorMessage = error ? (ERROR_MESSAGES[error] ?? `Connection error: ${error}`) : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Connections</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your apps to use them in workflows. You may need to reconnect periodically to refresh authorization.
        </p>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">{errorMessage}</p>
        </div>
      )}

      {/* Connection cards */}
      <div className="flex flex-col gap-3">
        {CONNECTIONS.map((connection) => (
          <ConnectionCard
            key={connection.title}
            description={connection.description}
            title={connection.title}
            icon={connection.image}
            type={connection.title}
            connected={connections}
            workspaceName={workspaceNames[connection.title]}
            showManualDiscord={connection.title === "Discord" && showManualDiscord}
          />
        ))}
      </div>
    </div>
  );
};

export default Connections;

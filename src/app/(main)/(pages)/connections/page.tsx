import { CONNECTIONS } from "@/lib/constants";
import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { onDiscordConnect } from "./_actions/discord-connection";
import { onNotionConnect } from "./_actions/notion-connection";
import { onSlackConnect } from "./_actions/slack-connection";
import { getUserData } from "./_actions/get-user";
import ConnectionCard from "./_components/connection-card";

type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
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
    database_id,
    app_id,
    authed_user_id,
    authed_user_token,
    slack_access_token,
    bot_user_id,
    team_id,
    team_name,
    discord_setup,
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
        authed_user_token!,
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
      Zoom: true,
    };
  };

  const connections = await onUserConnections();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Connections</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Connect your apps to use them in workflows. You may need to reconnect periodically to refresh authorization.
        </p>
      </div>

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
          />
        ))}
      </div>
    </div>
  );
};

export default Connections;

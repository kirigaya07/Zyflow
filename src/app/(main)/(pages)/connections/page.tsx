import { CONNECTIONS } from "@/lib/constants";
import React from "react";
import ConnectionCard from "./_components/connection-card";
import { currentUser } from "@clerk/nextjs/server";
import { onDiscordConnect } from "./_actions/discord-connection";
import { onNotionConnect } from "./_actions/notion-connection";
import { onSlackConnect } from "./_actions/slack-connection";
import { getUserData } from "./_actions/get-user";

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
  } = searchParams ?? {
    webhook_id: "",
    webhook_name: "",
    webhook_url: "",
    guild_id: "",
    guild_name: "",
    channel_id: "",
    access_token: "",
    workspace_name: "",
    workspace_icon: "",
    workspace_id: "",
    database_id: "",
    app_id: "",
    authed_user_id: "",
    authed_user_token: "",
    slack_access_token: "",
    bot_user_id: "",
    team_id: "",
    team_name: "",
    discord_setup: "",
  };

  const user = await currentUser();
  if (!user) return null;

  const onUserConnections = async () => {
    // Only call the connection handler for the service that just completed OAuth
    if (webhook_id && channel_id && guild_id && !discord_setup) {
      // Discord OAuth completed with webhook creation
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
    // Note: discord_setup=true means Discord OAuth is authorized but webhook not yet created
    // This will be handled separately when user selects a channel

    if (workspace_id && database_id && access_token && !discord_setup) {
      // Notion OAuth completed
      await onNotionConnect(
        access_token!,
        workspace_id!,
        workspace_icon!,
        workspace_name!,
        database_id!,
        user.id
      );
    }

    if (app_id && team_id && slack_access_token) {
      // Slack OAuth completed
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

    const connections: any = {};

    const user_info = await getUserData(user.id);

    //get user info with all connections
    user_info?.connections.map((connection) => {
      connections[connection.type] = true;
      return (connections[connection.type] = true);
    });

    // Google Drive connection will always be true
    // as it is given access during the login process
    return { ...connections, "Google Drive": true };
  };

  const connections = await onUserConnections();

  return (
    <div className="relative flex flex-col gap-4">
      <h1 className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 p-6 text-4xl backdrop-blur-lg">
        Connections
      </h1>
      <div className="relative flex flex-col gap-4">
        <section className="flex flex-col gap-4 p-6 text-muted-foreground">
          <p className="mb-4">
            Connect all your apps directly from here. You may need to connect
            these apps regularly to refresh verification
          </p>
          <div className="grid gap-4">
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
        </section>
      </div>
    </div>
  );
};

export default Connections;

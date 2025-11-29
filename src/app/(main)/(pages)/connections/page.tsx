/**
 * Connections Page Component
 *
 * This is the main connections management page that allows users to:
 * - View all available service integrations
 * - Connect/disconnect from third-party services (Discord, Slack, Notion, etc.)
 * - Handle OAuth callback processing for service authorizations
 * - Manage Zoom meeting automation settings
 *
 * The page processes OAuth redirect parameters and automatically establishes
 * connections when users return from service authorization flows.
 */

import { CONNECTIONS } from "@/lib/constants";
import React from "react";
import ZoomWatcherControl from "@/components/zoom-watcher-control";
import { currentUser } from "@clerk/nextjs/server";
import { onDiscordConnect } from "./_actions/discord-connection";
import { onNotionConnect } from "./_actions/notion-connection";
import { onSlackConnect } from "./_actions/slack-connection";
import { getUserData } from "./_actions/get-user";
import ConnectionCard from "./_components/connection-card";

/**
 * Props interface for the Connections page component.
 * Handles search parameters from OAuth redirects.
 */
type Props = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

/**
 * Main Connections page component that handles service integrations and OAuth callbacks.
 *
 * This component:
 * - Processes OAuth redirect parameters from various services
 * - Automatically establishes connections when users return from authorization
 * - Displays connection status for all available services
 * - Provides Zoom automation controls
 *
 * @param props - Component props containing search parameters from OAuth redirects
 * @returns JSX.Element - The connections management interface
 */
const Connections = async (props: Props) => {
  const searchParams = await props.searchParams;

  // Extract OAuth callback parameters for different services
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

  /**
   * Processes OAuth callbacks and establishes service connections.
   *
   * This function:
   * - Handles Discord webhook setup after OAuth authorization
   * - Processes Notion workspace connections
   * - Establishes Slack bot integrations
   * - Retrieves and formats existing connection status
   *
   * @returns Object containing connection status for all services
   */
  const onUserConnections = async () => {
    // Process Discord OAuth callback - only if webhook creation is complete
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
    // Email and Zoom use the same Google OAuth as Drive, so they're also connected
    return {
      ...connections,
      "Google Drive": true,
      Email: true,
      Zoom: true,
    };
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

          {/* Zoom Automation Control */}
          <div className="mt-8">
            <ZoomWatcherControl />
          </div>
        </section>
      </div>
    </div>
  );
};

export default Connections;

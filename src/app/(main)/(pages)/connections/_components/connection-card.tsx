"use client";

/**
 * Connection Card Component
 *
 * This component renders individual service connection cards in the connections page.
 * Displays connection status and provides OAuth redirect links for service authorization.
 *
 * Features:
 * - Visual connection status indicators
 * - Service-specific OAuth redirect handling
 * - Error handling for missing icons
 * - Responsive design with proper spacing
 * - Loading states during connection process
 */

import { ConnectionTypes } from "@/lib/types";
import React from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { LoadingLink } from "@/components/global/loading-link";

/**
 * Props interface for the ConnectionCard component.
 */
type Props = {
  /** Type of connection service */
  type: ConnectionTypes;
  /** Path to service icon/logo */
  icon: string;
  /** Display title of the service */
  title: ConnectionTypes;
  /** Brief description of the service integration */
  description: string;
  /** Optional callback function for custom actions */
  callback?: () => void;
  /** Object containing connection status for all services */
  connected: Record<string, unknown>;
};

/**
 * ConnectionCard component that displays service integration status and connection options.
 *
 * This component:
 * - Shows service icon, title, and description
 * - Displays connection status with visual indicators
 * - Provides appropriate OAuth redirect links
 * - Handles image loading errors gracefully
 * - Uses loading links for better UX during redirects
 *
 * @param props - Component props containing service information and connection status
 * @returns JSX.Element - Rendered connection card
 */
const ConnectionCard = ({
  description,
  type,
  icon,
  title,
  connected,
}: Props) => {
  return (
    <Card className="w-full">
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-shrink-0">
            <Image
              src={icon}
              alt={title}
              width={48}
              height={48}
              className="object-contain"
              onError={(e) => {
                console.error("Failed to load connection image:", icon);
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          {connected[type] ? (
            <div className="rounded-lg border-2 border-green-500 bg-green-500/10 px-4 py-2 font-bold text-green-500">
              Connected
            </div>
          ) : (
            <LoadingLink
              href={
                title == "Discord"
                  ? process.env.NEXT_PUBLIC_DISCORD_REDIRECT!
                  : title == "Notion"
                  ? process.env.NEXT_PUBLIC_NOTION_AUTH_URL!
                  : title == "Slack"
                  ? process.env.NEXT_PUBLIC_SLACK_REDIRECT!
                  : title == "Google Drive"
                  ? process.env.NEXT_PUBLIC_GOOGLE_DRIVE_AUTH_URL ||
                    "/api/auth/google-drive"
                  : title == "Email"
                  ? process.env.NEXT_PUBLIC_GOOGLE_DRIVE_AUTH_URL ||
                    "/api/auth/google-drive"
                  : title == "Zoom"
                  ? process.env.NEXT_PUBLIC_GOOGLE_DRIVE_AUTH_URL ||
                    "/api/auth/google-drive"
                  : "#"
              }
              className="rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Connect
            </LoadingLink>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ConnectionCard;

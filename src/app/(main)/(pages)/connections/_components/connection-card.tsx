"use client";

import { ConnectionTypes } from "@/lib/types";
import React from "react";
import Image from "next/image";
import { LoadingLink } from "@/components/global/loading-link";
import { CheckCircle2 } from "lucide-react";

type Props = {
  type: ConnectionTypes;
  icon: string;
  title: ConnectionTypes;
  description: string;
  callback?: () => void;
  connected: Record<string, unknown>;
};

const ConnectionCard = ({ description, type, icon, title, connected }: Props) => {
  const isConnected = Boolean(connected[type]);

  const href =
    title === "Discord"
      ? process.env.NEXT_PUBLIC_DISCORD_REDIRECT!
      : title === "Notion"
      ? process.env.NEXT_PUBLIC_NOTION_AUTH_URL!
      : title === "Slack"
      ? process.env.NEXT_PUBLIC_SLACK_REDIRECT!
      : process.env.NEXT_PUBLIC_GOOGLE_DRIVE_AUTH_URL || "/api/auth/google-drive";

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3.5 hover:bg-card/80 transition-colors">
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div className="h-9 w-9 flex-shrink-0 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
          <Image
            src={icon}
            alt={title}
            width={24}
            height={24}
            className="object-contain"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>

      <div className="ml-4 flex-shrink-0">
        {isConnected ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Connected
          </div>
        ) : (
          <LoadingLink
            href={href}
            className="inline-flex items-center h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
          >
            Connect
          </LoadingLink>
        )}
      </div>
    </div>
  );
};

export default ConnectionCard;

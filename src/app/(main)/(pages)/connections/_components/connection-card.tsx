"use client";
import { ConnectionTypes } from "@/lib/types";
import React from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import Link from "next/link";

type Props = {
  type: ConnectionTypes;
  icon: string;
  title: ConnectionTypes;
  description: string;
  callback?: () => void;
  connected: Record<string, unknown>;
};

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
            <Link
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
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
};

export default ConnectionCard;

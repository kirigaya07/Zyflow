"use client";

import { ConnectionTypes } from "@/lib/types";
import React, { useTransition } from "react";
import Image from "next/image";
import { LoadingLink } from "@/components/global/loading-link";
import { CheckCircle2, Loader2, RefreshCw, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { disconnectDiscord } from "../_actions/discord-connection";
import { disconnectSlack } from "../_actions/slack-connection";
import { disconnectNotion } from "../_actions/notion-connection";
import { DiscordManualConnect } from "./discord-manual-connect";

type Props = {
  type: ConnectionTypes;
  icon: string;
  title: ConnectionTypes;
  description: string;
  connected: Record<string, unknown>;
  /** Workspace / team name to show when connected */
  workspaceName?: string;
  /** Whether to show the manual Discord webhook form inline */
  showManualDiscord?: boolean;
};

const RECONNECT_HREF: Partial<Record<ConnectionTypes, string>> = {
  Discord: process.env.NEXT_PUBLIC_DISCORD_REDIRECT ?? "#",
  Notion:  process.env.NEXT_PUBLIC_NOTION_AUTH_URL ?? "#",
  Slack:   process.env.NEXT_PUBLIC_SLACK_REDIRECT ?? "#",
};

const ConnectionCard = ({
  description,
  type,
  icon,
  title,
  connected,
  workspaceName,
  showManualDiscord,
}: Props) => {
  const isConnected = Boolean(connected[type]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isAlwaysOn = type === "Google Drive" || type === "Email";

  const handleDisconnect = () => {
    startTransition(async () => {
      let result: { error?: string; success?: boolean } = {};
      if (type === "Discord") result = await disconnectDiscord();
      else if (type === "Slack")   result = await disconnectSlack();
      else if (type === "Notion")  result = await disconnectNotion();

      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${title} disconnected`);
        router.refresh();
      }
    });
  };

  const reconnectHref = RECONNECT_HREF[type];

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3.5 transition-colors hover:bg-card/80">
      <div className="flex items-center justify-between gap-4">
        {/* Icon + text */}
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
            <p className="text-xs text-muted-foreground truncate">
              {isConnected && workspaceName ? workspaceName : description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isConnected ? (
            <>
              <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Connected
              </div>

              {!isAlwaysOn && reconnectHref && (
                <LoadingLink
                  href={reconnectHref}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span className="hidden sm:inline">Reconnect</span>
                </LoadingLink>
              )}

              {!isAlwaysOn && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleDisconnect}
                  disabled={isPending}
                  title="Disconnect"
                >
                  {isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Unlink className="h-3.5 w-3.5" />
                  }
                </Button>
              )}
            </>
          ) : (
            reconnectHref ? (
              <LoadingLink
                href={reconnectHref}
                className="inline-flex items-center h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
              >
                Connect
              </LoadingLink>
            ) : null
          )}
        </div>
      </div>

      {/* Discord manual connect form — shown when OAuth failed or as fallback */}
      {type === "Discord" && !isConnected && showManualDiscord && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Or paste a webhook URL manually:
          </p>
          <DiscordManualConnect />
        </div>
      )}
    </div>
  );
};

export default ConnectionCard;

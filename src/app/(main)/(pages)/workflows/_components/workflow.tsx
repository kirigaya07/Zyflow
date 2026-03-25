"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Copy,
  Trash2,
  ArrowRight,
  Pencil,
} from "lucide-react";
import {
  onFlowPublish,
  deleteWorkflow,
  duplicateWorkflow,
} from "../_actions/workflow-connections";
import { toast } from "sonner";
import { LoadingLink } from "@/components/global/loading-link";
import EditorCanvasIconHelper from "../editor/[editorId]/_components/editor-canvas-card-icon-helper";
import { EditorCanvasTypes } from "@/lib/types";
import { cn } from "@/lib/utils";

type LastRun = { status: string; createdAt: Date } | null;

type Props = {
  name: string;
  description: string;
  id: string;
  publish: boolean | null;
  lastRun?: LastRun;
  runCount?: number;
  nodeTypes?: EditorCanvasTypes[];
};

/** Accent color per node type — matches the editor canvas */
const NODE_ACCENT: Partial<Record<EditorCanvasTypes, string>> = {
  "Webhook Trigger": "text-amber-500",
  "Google Drive":    "text-orange-500",
  "HTTP Request":    "text-blue-500",
  "Set Fields":      "text-teal-500",
  Code:              "text-slate-500",
  Condition:         "text-yellow-500",
  Wait:              "text-purple-500",
  AI:                "text-violet-500",
  Discord:           "text-indigo-500",
  Slack:             "text-green-600",
  Notion:            "text-neutral-500",
  Email:             "text-red-500",
  Zoom:              "text-blue-600",
  Trigger:           "text-orange-500",
};

const TRIGGER_TYPES: EditorCanvasTypes[] = ["Webhook Trigger", "Google Drive", "Trigger"];

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const Workflow = ({ description, id, name, publish, lastRun, runCount = 0, nodeTypes = [] }: Props) => {
  const router = useRouter();

  const onPublishFlow = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const res = await onFlowPublish(id, e.currentTarget.ariaChecked === "false");
    if (res) toast.message(res);
  };

  const onDuplicate = async () => {
    const res = await duplicateWorkflow(id);
    if ("error" in res) toast.error(res.error);
    else { toast.success("Duplicated"); router.refresh(); }
  };

  const onDelete = async () => {
    const res = await deleteWorkflow(id);
    if ("error" in res) toast.error(res.error);
    else { toast.success("Deleted"); router.refresh(); }
  };

  const triggers = nodeTypes.filter((t) => TRIGGER_TYPES.includes(t));
  const actions  = nodeTypes.filter((t) => !TRIGGER_TYPES.includes(t));

  const runStatusColor =
    lastRun?.status === "success"   ? "bg-emerald-400" :
    lastRun?.status === "failed"    ? "bg-red-400" :
    "bg-zinc-400";

  return (
    <div className={cn(
      "group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-card",
      "hover:border-border/80 hover:shadow-sm transition-all duration-150"
    )}>

      {/* ── Left: node pipeline ── */}
      <div className="flex-1 min-w-0">
        {/* Node type icons */}
        {nodeTypes.length > 0 && (
          <div className="flex items-center gap-1 mb-2 flex-wrap">
            {triggers.map((t, i) => (
              <span key={i} title={t} className={cn("shrink-0", NODE_ACCENT[t] ?? "text-muted-foreground")}>
                <EditorCanvasIconHelper type={t} size={13} />
              </span>
            ))}
            {triggers.length > 0 && actions.length > 0 && (
              <ArrowRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            )}
            {actions.slice(0, 6).map((t, i) => (
              <span key={i} title={t} className={cn("shrink-0", NODE_ACCENT[t] ?? "text-muted-foreground")}>
                <EditorCanvasIconHelper type={t} size={13} />
              </span>
            ))}
            {actions.length > 6 && (
              <span className="text-[10px] text-muted-foreground">+{actions.length - 6}</span>
            )}
          </div>
        )}

        {/* Name + description */}
        <LoadingLink href={`/workflows/editor/${id}`} className="block group/link">
          <p className="text-sm font-medium text-foreground group-hover/link:text-primary transition-colors leading-tight truncate">
            {name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        </LoadingLink>
      </div>

      {/* ── Right: status + toggle + menu ── */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">

        {/* Last run + run count — hide on xs to save space */}
        <div className="hidden sm:flex flex-col items-end gap-0.5">
          {lastRun ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", runStatusColor)} />
              {timeAgo(lastRun.createdAt)}
            </div>
          ) : (
            <span className="text-[11px] text-muted-foreground/60">Never run</span>
          )}
          {runCount > 0 && (
            <span className="text-[10px] text-muted-foreground/60">
              {runCount} {runCount === 1 ? "run" : "runs"}
            </span>
          )}
        </div>

        {/* Publish toggle */}
        <div className="flex flex-col items-center gap-0.5">
          <Label
            htmlFor={`sw-${id}`}
            className="text-[10px] text-muted-foreground font-medium select-none"
          >
            {publish ? "Live" : "Off"}
          </Label>
          <Switch
            id={`sw-${id}`}
            onClick={onPublishFlow}
            defaultChecked={publish ?? false}
            className="scale-[0.8] data-[state=checked]:bg-primary"
          />
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => router.push(`/workflows/editor/${id}`)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Open Editor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDuplicate}>
              <Copy className="mr-2 h-3.5 w-3.5" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default Workflow;

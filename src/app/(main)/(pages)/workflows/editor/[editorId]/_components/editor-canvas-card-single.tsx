"use client";

import { EditorCanvasCardType, EditorCanvasTypes } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import React from "react";
import { NodeToolbar, Position, useNodeId } from "@xyflow/react";
import EditorCanvasIconHelper from "./editor-canvas-card-icon-helper";
import CustomHandle from "./custom-handle";
import { cn } from "@/lib/utils";
import { Copy } from "lucide-react";

/** Left-border accent per node type */
const ACCENT_BORDER: Partial<Record<EditorCanvasTypes, string>> = {
  "Webhook Trigger": "border-l-amber-400",
  "Google Drive":    "border-l-orange-400",
  "HTTP Request":    "border-l-blue-400",
  "Set Fields":      "border-l-teal-400",
  Code:              "border-l-zinc-400",
  Condition:         "border-l-yellow-400",
  Wait:              "border-l-purple-400",
  AI:                "border-l-violet-500",
  Discord:           "border-l-indigo-400",
  Slack:             "border-l-green-500",
  Notion:            "border-l-neutral-400",
  "Google Sheets":   "border-l-emerald-500",
  Email:             "border-l-red-400",
  Trigger:           "border-l-orange-400",
  Action:            "border-l-blue-400",
  "Custom Webhook":  "border-l-zinc-400",
  "Google Calendar": "border-l-blue-400",
};

/** Icon container bg + color per node type */
const ICON_STYLE: Partial<Record<EditorCanvasTypes, string>> = {
  "Webhook Trigger": "bg-amber-50    text-amber-500   dark:bg-amber-950/40  dark:text-amber-400",
  "Google Drive":    "bg-orange-50   text-orange-500  dark:bg-orange-950/40 dark:text-orange-400",
  "HTTP Request":    "bg-blue-50     text-blue-500    dark:bg-blue-950/40   dark:text-blue-400",
  "Set Fields":      "bg-teal-50     text-teal-600    dark:bg-teal-950/40   dark:text-teal-400",
  Code:              "bg-zinc-100    text-zinc-500    dark:bg-zinc-800      dark:text-zinc-400",
  Condition:         "bg-yellow-50   text-yellow-600  dark:bg-yellow-950/40 dark:text-yellow-400",
  Wait:              "bg-purple-50   text-purple-500  dark:bg-purple-950/40 dark:text-purple-400",
  AI:                "bg-violet-50   text-violet-600  dark:bg-violet-950/40 dark:text-violet-400",
  Discord:           "bg-indigo-50   text-indigo-500  dark:bg-indigo-950/40 dark:text-indigo-400",
  Slack:             "bg-green-50    text-green-600   dark:bg-green-950/40  dark:text-green-400",
  Notion:            "bg-neutral-100 text-neutral-600 dark:bg-neutral-800   dark:text-neutral-400",
  "Google Sheets":   "bg-emerald-50  text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  Email:             "bg-red-50      text-red-500     dark:bg-red-950/40    dark:text-red-400",
  Trigger:           "bg-orange-50   text-orange-500  dark:bg-orange-950/40 dark:text-orange-400",
  Action:            "bg-blue-50     text-blue-500    dark:bg-blue-950/40   dark:text-blue-400",
};

const FALLBACK_ICON = "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400";

const EditorCanvasCardSingle = ({ data }: { data: EditorCanvasCardType }) => {
  const { dispatch, state } = useEditor();
  const nodeId = useNodeId();

  const isSelected = state.editor.selectedNode.id === nodeId;

  const isTrigger =
    data.type === "Trigger" ||
    data.type === "Webhook Trigger" ||
    data.type === "Google Drive" ||
    data.type === "Cron Trigger";

  return (
    <>
      <NodeToolbar isVisible={isSelected} position={Position.Top} className="flex gap-1 items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(
              new CustomEvent("zyflow:duplicate-node", { detail: { nodeId } })
            );
          }}
          className="h-6 px-2 flex items-center gap-1 rounded bg-card border border-border shadow-sm hover:bg-secondary text-muted-foreground hover:text-foreground text-[10px] font-medium transition-colors"
          title="Duplicate node"
        >
          <Copy className="h-3 w-3" />
          Duplicate
        </button>
      </NodeToolbar>

      {!isTrigger && (
        <CustomHandle type="target" position={Position.Top} style={{ zIndex: 100 }} />
      )}

      <div
        onClick={(e) => {
          e.stopPropagation();
          const val = state.editor.elements.find((n) => n.id === nodeId);
          if (val) dispatch({ type: "SELECTED_ELEMENT", payload: { element: val } });
        }}
        className={cn(
          "w-[200px] rounded-xl border-l-[3px] bg-card shadow-sm cursor-pointer",
          "border border-border transition-all duration-100",
          ACCENT_BORDER[data.type] ?? "border-l-zinc-300",
          isSelected
            ? "ring-2 ring-primary ring-offset-1 shadow-md"
            : "hover:shadow-md hover:border-border/60"
        )}
      >
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className={cn("rounded-lg p-1.5 shrink-0", ICON_STYLE[data.type] ?? FALLBACK_ICON)}>
            <EditorCanvasIconHelper type={data.type} size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold truncate leading-tight text-foreground">
              {data.title}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
              {isTrigger ? "Trigger" : "Action"}
            </p>
          </div>
        </div>
      </div>

      <CustomHandle type="source" position={Position.Bottom} id="a" />
    </>
  );
};

export default EditorCanvasCardSingle;

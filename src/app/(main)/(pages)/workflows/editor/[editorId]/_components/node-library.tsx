"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { onDragStart } from "@/lib/editor-utils";
import { EditorCanvasTypes, EditorNodeType } from "@/lib/types";
import { EditorCanvasDefaultCardTypes } from "@/lib/constants";
import EditorCanvasIconHelper from "./editor-canvas-card-icon-helper";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Category = { label: string; types: EditorCanvasTypes[] };

const CATEGORIES: Category[] = [
  { label: "Triggers", types: ["Webhook Trigger", "Cron Trigger", "Google Drive"] },
  { label: "Core",     types: ["HTTP Request", "Set Fields", "Code", "Condition", "Wait", "AI"] },
  { label: "Apps",     types: ["Discord", "Slack", "Notion", "Email"] },
];

/** Left-border accent color per type — consistent with node card */
const ICON_COLOR: Partial<Record<EditorCanvasTypes, string>> = {
  "Webhook Trigger": "text-amber-500",
  "Cron Trigger":    "text-sky-500",
  "Google Drive":    "text-orange-500",
  "HTTP Request":    "text-blue-500",
  "Set Fields":      "text-teal-500",
  Code:              "text-zinc-500",
  Condition:         "text-yellow-500",
  Wait:              "text-purple-500",
  AI:                "text-violet-500",
  Discord:           "text-indigo-500",
  Slack:             "text-green-600",
  Notion:            "text-neutral-500",
  Email:             "text-red-500",
};

type Props = {
  nodes: EditorNodeType[];
  isOpen: boolean;
  onClose: () => void;
  onAddNode?: (type: EditorCanvasTypes) => void;
};

export function NodeLibrary({ nodes, isOpen, onClose, onAddNode }: Props) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase().trim();

  const hasTrigger = nodes.some(
    (n) =>
      n.type === "Trigger" ||
      n.type === "Webhook Trigger" ||
      n.type === "Google Drive" ||
      n.type === "Cron Trigger"
  );

  return (
    <>
      {/* Mobile/tablet backdrop — only renders when sheet is open */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "bg-background flex flex-col overflow-hidden",
          // ── Desktop: static left sidebar ──────────────────
          "lg:w-[240px] lg:h-full lg:border-r lg:border-border lg:shrink-0",
          "lg:static lg:z-auto lg:translate-y-0 lg:rounded-none lg:border-t-0",
          "lg:max-h-full lg:flex",
          // ── Mobile / tablet: bottom sheet ─────────────────
          "fixed bottom-0 left-0 right-0 z-50",
          "border-t border-border rounded-t-2xl",
          "max-h-[72vh]",
          "transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
        )}
      >
        {/* Drag handle — mobile only */}
        <div className="lg:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Sheet header — mobile only */}
        <div className="lg:hidden flex items-center justify-between px-4 py-2 shrink-0">
          <p className="text-sm font-semibold text-foreground">Node Library</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-secondary border border-border text-muted-foreground">
            <Search className="w-3 h-3 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nodes…"
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto p-2">
          {CATEGORIES.map((cat) => {
            const visible = cat.types.filter((type) => {
              if (q && !type.toLowerCase().includes(q)) return false;
              const kind = EditorCanvasDefaultCardTypes[type]?.type;
              if (!nodes.length) return kind === "Trigger";
              if (hasTrigger)    return kind === "Action";
              return true;
            });
            if (!visible.length) return null;

            return (
              <div key={cat.label} className="mb-4">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                  {cat.label}
                </p>
                <div className="space-y-0.5">
                  {visible.map((type) => (
                    <div
                      key={type}
                      draggable
                      onDragStart={(e) => onDragStart(e, type)}
                      onClick={() => {
                        onAddNode?.(type);
                        onClose();
                      }}
                      className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-secondary transition-colors group select-none"
                    >
                      <span className={cn("shrink-0 transition-colors", ICON_COLOR[type] ?? "text-muted-foreground")}>
                        <EditorCanvasIconHelper type={type} size={14} />
                      </span>
                      <span className="text-xs text-foreground truncate flex-1">{type}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* No results */}
          {q && CATEGORIES.every((cat) =>
            cat.types.every((t) => !t.toLowerCase().includes(q))
          ) && (
            <p className="text-xs text-muted-foreground text-center py-10 px-4">
              No nodes match &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* Mobile tap-to-add hint */}
        <div className="lg:hidden shrink-0 px-4 py-2.5 border-t border-border bg-secondary/30">
          <p className="text-[11px] text-muted-foreground text-center">
            Tap a node to add it · Drag on desktop
          </p>
        </div>
      </div>
    </>
  );
}

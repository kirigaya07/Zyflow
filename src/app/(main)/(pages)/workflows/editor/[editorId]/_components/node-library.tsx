"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { onDragStart } from "@/lib/editor-utils";
import { EditorCanvasTypes, EditorNodeType } from "@/lib/types";
import { EditorCanvasDefaultCardTypes } from "@/lib/constants";
import EditorCanvasIconHelper from "./editor-canvas-card-icon-helper";
import { cn } from "@/lib/utils";

type Category = { label: string; types: EditorCanvasTypes[] };

const CATEGORIES: Category[] = [
  { label: "Triggers", types: ["Webhook Trigger", "Google Drive"] },
  { label: "Core",     types: ["HTTP Request", "Set Fields", "Code", "Condition", "Wait", "AI"] },
  { label: "Apps",     types: ["Discord", "Slack", "Notion", "Email"] },
];

/** Left-border accent color per type — consistent with node card */
const ICON_COLOR: Partial<Record<EditorCanvasTypes, string>> = {
  "Webhook Trigger": "text-amber-500",
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

export function NodeLibrary({ nodes }: { nodes: EditorNodeType[] }) {
  const [query, setQuery] = useState("");
  const q = query.toLowerCase().trim();

  const hasTrigger = nodes.some(
    (n) => n.type === "Trigger" || n.type === "Webhook Trigger" || n.type === "Google Drive"
  );

  return (
    <div className="w-[240px] h-full border-r border-border bg-background flex flex-col shrink-0 overflow-hidden">

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
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-secondary transition-colors group"
                  >
                    <span className={cn("shrink-0 transition-colors", ICON_COLOR[type] ?? "text-muted-foreground")}>
                      <EditorCanvasIconHelper type={type} size={14} />
                    </span>
                    <span className="text-xs text-foreground truncate">{type}</span>
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
    </div>
  );
}

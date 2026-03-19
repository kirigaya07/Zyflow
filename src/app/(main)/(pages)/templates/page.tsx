"use client";

import React, { useState, useTransition } from "react";
import {
  Mic,
  FileText,
  Share2,
  Cloud,
  MessageSquare,
  Search,
  Zap,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTemplate } from "./_actions/use-template";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ─── Template data ──────────────────────────────────────── */

const TEMPLATES = [
  {
    id: "zoom-meeting-summary",
    title: "Zoom → Transcript → AI Summary",
    description: "Watch Zoom folder, transcribe with Whisper, generate summary, save to Drive, notify team.",
    icon: Mic,
    iconStyle: "bg-amber-50 text-amber-500 dark:bg-amber-950/40 dark:text-amber-400",
    tags: ["Zoom", "AI", "Google Drive", "Slack"],
    filter: ["zoom", "drive"],
    complexity: "Advanced",
  },
  {
    id: "drive-to-slack",
    title: "Drive Upload → Slack Notification",
    description: "Watch a Google Drive folder and auto-notify a Slack channel whenever a new file is added.",
    icon: Cloud,
    iconStyle: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
    tags: ["Google Drive", "Slack"],
    filter: ["drive", "slack"],
    complexity: "Simple",
  },
  {
    id: "drive-to-discord",
    title: "Drive Upload → Discord Notification",
    description: "Watch a Google Drive folder and auto-notify a Discord channel whenever a new file appears.",
    icon: Cloud,
    iconStyle: "bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400",
    tags: ["Google Drive", "Discord"],
    filter: ["drive"],
    complexity: "Simple",
  },
  {
    id: "summary-to-notion",
    title: "Transcript → AI Summary → Notion",
    description: "Convert a raw transcript into a structured Notion page with key points and action items.",
    icon: FileText,
    iconStyle: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    tags: ["Notion", "AI"],
    filter: ["notion"],
    complexity: "Moderate",
  },
  {
    id: "discord-announcements",
    title: "Meeting Summary → Discord",
    description: "Publish meeting highlights to a Discord channel with mentions and links automatically.",
    icon: Share2,
    iconStyle: "bg-indigo-50 text-indigo-500 dark:bg-indigo-950/40 dark:text-indigo-400",
    tags: ["Discord"],
    filter: [],
    complexity: "Simple",
  },
  {
    id: "email-digest",
    title: "Daily Summary → Email Digest",
    description: "Send a daily digest email with all meeting summaries and action items from Drive.",
    icon: MessageSquare,
    iconStyle: "bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400",
    tags: ["Email", "Google Drive"],
    filter: ["drive"],
    complexity: "Moderate",
  },
] as const;

type FilterKey = "all" | "zoom" | "drive" | "slack" | "notion";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",    label: "All" },
  { key: "zoom",   label: "Zoom" },
  { key: "drive",  label: "Drive" },
  { key: "slack",  label: "Slack" },
  { key: "notion", label: "Notion" },
];

const COMPLEXITY_STYLE: Record<string, string> = {
  Simple:   "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
  Moderate: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  Advanced: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400",
};

/* ─── Component ──────────────────────────────────────────── */

export default function TemplatesPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const onUseTemplate = (id: string) => {
    setLoadingId(id);
    startTransition(async () => {
      // @ts-expect-error server action import
      const res = await useTemplate(id);
      if (res?.ok && res.workflowId) {
        router.push(`/workflows/editor/${res.workflowId}`);
      } else {
        setLoadingId(null);
      }
    });
  };

  const q = query.toLowerCase().trim();
  const visible = TEMPLATES.filter((tpl) => {
    if (activeFilter !== "all" && !tpl.filter.includes(activeFilter)) return false;
    if (q) {
      return (
        tpl.title.toLowerCase().includes(q) ||
        tpl.description.toLowerCase().includes(q) ||
        tpl.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Templates</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start from a pre-built workflow and customize it to fit your needs.
        </p>
      </div>

      {/* ── Search + Filters ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-secondary border border-border text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring transition-shadow"
          />
        </div>

        {/* Filter pills */}
        <div className="flex gap-1.5">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-medium border transition-colors",
                activeFilter === key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground bg-secondary hover:bg-secondary/80"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Template grid ──────────────────────────────────── */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No templates match your search</p>
          <button
            onClick={() => { setQuery(""); setActiveFilter("all"); }}
            className="text-xs text-primary hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {visible.map((tpl) => {
            const Icon = tpl.icon;
            const isLoading = isPending && loadingId === tpl.id;
            return (
              <div
                key={tpl.id}
                className="group flex flex-col rounded-xl border border-border bg-card hover:shadow-sm transition-all duration-150 overflow-hidden"
              >
                {/* Card body */}
                <div className="flex gap-3.5 p-4 flex-1">
                  {/* Icon */}
                  <div className={cn("h-9 w-9 shrink-0 rounded-lg flex items-center justify-center", tpl.iconStyle)}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{tpl.title}</p>
                      <span className={cn(
                        "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                        COMPLEXITY_STYLE[tpl.complexity]
                      )}>
                        {tpl.complexity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tpl.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {tpl.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="px-4 pb-4">
                  <Button
                    size="sm"
                    className="h-7 gap-1.5 text-xs w-full"
                    onClick={() => onUseTemplate(tpl.id)}
                    disabled={isPending}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      <>
                        Use Template
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CTA ────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Need a custom template?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tell us your flow and we&apos;ll set it up for you.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs shrink-0">
          Request
        </Button>
      </div>

    </div>
  );
}

"use client";

import { useState } from "react";
import { Sparkles, Loader2, Wand2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { EditorNodeType } from "@/lib/types";
import { cn } from "@/lib/utils";

type FlowEdge = { id: string; source: string; target: string };

type Props = {
  onLoad: (nodes: EditorNodeType[], edges: FlowEdge[]) => void;
};

const EXAMPLE_PROMPTS = [
  "Send a Slack message and create a Notion page every time my webhook fires",
  "Every day at 9am, send an email digest to my team",
  "When a webhook fires, use AI to summarize the content and post to Discord",
  "Notify Slack when a new file is added to Google Drive",
  "If a webhook payload contains status=failed, send an email alert",
];

export function AiWorkflowBuilder({ onLoad }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<{
    nodes: EditorNodeType[];
    edges: FlowEdge[];
    summary: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Describe what your workflow should do");
      return;
    }

    setIsGenerating(true);
    setGenerated(null);

    try {
      const res = await fetch("/api/ai/generate-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate workflow");
        return;
      }

      const { nodes, edges } = data as { nodes: EditorNodeType[]; edges: FlowEdge[] };

      if (!nodes?.length) {
        toast.error("No nodes were generated. Try a more specific description.");
        return;
      }

      // Build a human-readable summary
      const nodeTypes = nodes.map((n) => n.type ?? n.data?.type).filter(Boolean);
      const summary = nodeTypes.join(" → ");

      setGenerated({ nodes, edges, summary });
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoad = () => {
    if (!generated) return;
    onLoad(generated.nodes, generated.edges);
    toast.success(`Loaded ${generated.nodes.length} nodes into canvas`);
    setOpen(false);
    setGenerated(null);
    setDescription("");
  };

  const handleReset = () => {
    setGenerated(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/50"
        >
          <Sparkles className="h-3 w-3" />
          <span className="hidden sm:inline">Build with AI</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[540px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Wand2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Build with AI</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Describe your automation and AI will generate the workflow
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-5">
          {!generated ? (
            <>
              {/* Prompt input */}
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Describe what your workflow should do..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
                  }}
                  className="min-h-[100px] text-sm resize-none"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground">
                  Press Ctrl+Enter to generate
                </p>
              </div>

              {/* Example chips */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Examples</p>
                <div className="flex flex-col gap-1.5">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => setDescription(prompt)}
                      className={cn(
                        "flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg",
                        "border border-border hover:border-primary/40 hover:bg-primary/5",
                        "text-muted-foreground hover:text-foreground transition-all",
                        description === prompt && "border-primary/40 bg-primary/5 text-foreground"
                      )}
                    >
                      <ChevronRight className="h-3 w-3 shrink-0 text-primary/60" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating workflow…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Workflow
                  </>
                )}
              </Button>
            </>
          ) : (
            /* Generated result */
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <p className="text-sm font-medium">Workflow generated</p>
                </div>

                <div className="flex flex-col gap-1">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">
                    Pipeline
                  </p>
                  <p className="text-sm text-foreground font-medium break-words">
                    {generated.summary}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{generated.nodes.length} nodes</span>
                  <span>{generated.edges.length} connections</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Loading will replace your current canvas. Configure each node after loading.
              </p>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleReset} className="flex-1">
                  Try again
                </Button>
                <Button size="sm" onClick={handleLoad} className="flex-1 gap-1.5">
                  <Wand2 className="h-3.5 w-3.5" />
                  Load to Canvas
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

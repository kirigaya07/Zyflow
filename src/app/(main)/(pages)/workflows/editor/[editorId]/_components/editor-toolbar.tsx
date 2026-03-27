"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Download,
  LayoutGrid,
  Loader2,
  Redo2,
  Save,
  Undo2,
  Upload,
  Zap,
  ZapOff,
} from "lucide-react";
import { toast } from "sonner";
import { useEditor } from "@/providers/editor-provider";
import {
  getWorkflowMeta,
  onCreateNodesEdges,
} from "../_actions/workflow-connections";
import { onFlowPublish } from "../../../_actions/workflow-connections";
import { cn } from "@/lib/utils";
import { EditorNodeType } from "@/lib/types";
import { AiWorkflowBuilder } from "./ai-workflow-builder";
import { TestRunDialog } from "./test-run-dialog";

type FlowEdge = { id: string; source: string; target: string };
type Props = {
  nodes: EditorNodeType[];
  edges: FlowEdge[];
  onToggleLibrary?: () => void;
  onLoadWorkflow?: (nodes: EditorNodeType[], edges: FlowEdge[]) => void;
};

/** Kahn's BFS topological sort — returns ordered node IDs. */
function topologicalSort(nodes: EditorNodeType[], edges: FlowEdge[]): string[] {
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  for (const n of nodes) { adj[n.id] = []; inDegree[n.id] = 0; }
  for (const e of edges) {
    if (adj[e.source]) adj[e.source].push(e.target);
    inDegree[e.target] = (inDegree[e.target] ?? 0) + 1;
  }
  const queue = nodes.filter((n) => (inDegree[n.id] ?? 0) === 0).map((n) => n.id);
  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const nb of adj[id] ?? []) {
      inDegree[nb]--;
      if (inDegree[nb] === 0) queue.push(nb);
    }
  }
  return sorted;
}

export function EditorToolbar({ nodes, edges, onToggleLibrary, onLoadWorkflow }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { dispatch } = useEditor();
  const workflowId = pathname.split("/").pop()!;

  const [workflowName, setWorkflowName] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const flowPath = topologicalSort(nodes, edges);

  useEffect(() => {
    getWorkflowMeta(workflowId).then((meta) => {
      if (meta) {
        setWorkflowName(meta.name);
        setIsPublished(meta.publish ?? false);
      }
    });
  }, [workflowId]);

  const handleSave = async () => {
    if (!flowPath.length) {
      toast.error("Connect your nodes before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await onCreateNodesEdges(
        workflowId,
        JSON.stringify(nodes),
        JSON.stringify(edges),
        JSON.stringify(flowPath)
      );
      toast.success(res?.message ?? "Saved");
    } catch {
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName || "workflow"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow exported");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as {
          nodes?: unknown[];
          edges?: unknown[];
        };
        if (Array.isArray(data.nodes) && Array.isArray(data.edges)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onLoadWorkflow?.(data.nodes as any, data.edges as any);
          toast.success("Workflow imported");
        } else {
          toast.error("Invalid workflow file — missing nodes or edges");
        }
      } catch {
        toast.error("Could not parse file — must be valid JSON");
      }
    };
    reader.readAsText(file);
    // reset so same file can be re-imported
    e.target.value = "";
  };

  const handleToggleDeploy = async () => {
    setIsPublishing(true);
    try {
      await onCreateNodesEdges(
        workflowId,
        JSON.stringify(nodes),
        JSON.stringify(edges),
        JSON.stringify(flowPath)
      );
      const msg = await onFlowPublish(workflowId, !isPublished);
      if (msg?.startsWith("Cannot") || msg === "Unauthorized") {
        toast.error(msg);
      } else {
        setIsPublished((v) => !v);
        toast.success(msg ?? (isPublished ? "Unpublished" : "Deployed"));
      }
    } catch {
      toast.error("Failed to deploy");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="h-12 border-b border-border flex items-center gap-1 px-3 bg-background/95 backdrop-blur-sm shrink-0 select-none">

      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-muted-foreground hover:text-foreground px-2 text-xs"
        onClick={() => router.push("/workflows")}
      >
        <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Workflows</span>
      </Button>

      <div className="w-px h-4 bg-border mx-1" />

      {/* Workflow name + live badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1 lg:flex-none">
        <span className="text-sm font-medium text-foreground truncate max-w-[120px] sm:max-w-[160px] lg:max-w-[180px]">
          {workflowName || "Untitled"}
        </span>
        {isPublished && (
          <span className="hidden sm:flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 items-center gap-1 shrink-0">
            <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
            Live
          </span>
        )}
      </div>

      <div className="hidden lg:block flex-1" />

      {/* Mobile: open node library */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={onToggleLibrary}
        title="Node library"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>

      {/* Desktop: undo / redo */}
      <div className="hidden sm:flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => dispatch({ type: "UNDO" })}
          title="Undo"
        >
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => dispatch({ type: "REDO" })}
          title="Redo"
        >
          <Redo2 className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
      </div>

      {/* Export / Import */}
      <div className="hidden sm:flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={handleExport}
          title="Export workflow JSON"
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
        <label title="Import workflow JSON">
          <input
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleImport}
          />
          <span className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5" />
          </span>
        </label>
        <div className="w-px h-4 bg-border mx-1" />
      </div>

      {/* Test Run */}
      <TestRunDialog workflowId={workflowId} isPublished={isPublished} />

      {/* AI Workflow Builder */}
      {onLoadWorkflow && (
        <AiWorkflowBuilder onLoad={onLoadWorkflow} />
      )}

      {/* Save */}
      <Button
        variant="outline"
        size="sm"
        className="h-7 gap-1.5 text-xs"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Save className="h-3 w-3" />
        }
        <span className="hidden sm:inline">Save</span>
      </Button>

      {/* Deploy */}
      <Button
        size="sm"
        className={cn(
          "h-7 gap-1.5 text-xs",
          isPublished
            ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
        onClick={handleToggleDeploy}
        disabled={isPublishing}
      >
        {isPublishing
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : isPublished
          ? <ZapOff className="h-3 w-3" />
          : <Zap className="h-3 w-3" />
        }
        <span className="hidden sm:inline">{isPublished ? "Unpublish" : "Deploy"}</span>
      </Button>
    </div>
  );
}

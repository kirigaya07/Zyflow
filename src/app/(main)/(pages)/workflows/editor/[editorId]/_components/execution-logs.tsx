"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getWorkflowRuns } from "../../../_actions/workflow-connections";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type NodeRun = {
  id: string;
  nodeId: string;
  nodeType: string;
  status: string;
  inputData: unknown;
  outputData: unknown;
  error: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
};

type WorkflowRun = {
  id: string;
  status: string;
  trigger: unknown;
  error: string | null;
  startedAt: Date;
  completedAt: Date | null;
  nodeRuns: NodeRun[];
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  running:   "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  failed:    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  paused:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  success:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  skipped:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  pending:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function timeAgo(date: Date | string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function duration(start: Date | string | null, end: Date | string | null): string | null {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function NodeRunRow({ nr }: { nr: NodeRun }) {
  const [open, setOpen] = useState(false);
  const dur = duration(nr.startedAt, nr.completedAt);

  return (
    <div className="border rounded-md text-xs">
      <button
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
          <span className="font-medium">{nr.nodeType}</span>
        </div>
        <div className="flex items-center gap-2">
          {dur && <span className="text-muted-foreground">{dur}</span>}
          <Badge className={`text-xs px-2 py-0.5 rounded-full border-0 ${STATUS_STYLES[nr.status] ?? STATUS_STYLES.skipped}`}>
            {nr.status}
          </Badge>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2 border-t pt-2">
          {nr.error && (
            <p className="text-red-500 dark:text-red-400 break-all">{nr.error}</p>
          )}
          {nr.outputData !== null && nr.outputData !== undefined && (
            <div>
              <p className="text-muted-foreground mb-1">Output</p>
              <pre className="bg-muted rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap break-all text-xs">
                {JSON.stringify(nr.outputData, null, 2)}
              </pre>
            </div>
          )}
          {nr.inputData !== null && nr.inputData !== undefined && (
            <div>
              <p className="text-muted-foreground mb-1">Input</p>
              <pre className="bg-muted rounded p-2 overflow-auto max-h-24 whitespace-pre-wrap break-all text-xs">
                {JSON.stringify(nr.inputData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WorkflowRunRow({ run }: { run: WorkflowRun }) {
  const [open, setOpen] = useState(false);
  const dur = duration(run.startedAt, run.completedAt);
  const trigger = run.trigger as Record<string, unknown> | null;

  return (
    <div className="border rounded-md">
      <button
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/40 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2 text-sm">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
          <span className="font-medium capitalize">{(trigger?.source as string) ?? "trigger"}</span>
          <span className="text-muted-foreground text-xs">{timeAgo(run.startedAt)}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {dur && <span className="text-xs text-muted-foreground">{dur}</span>}
          <Badge className={`text-xs px-2 py-0.5 rounded-full border-0 ${STATUS_STYLES[run.status] ?? STATUS_STYLES.skipped}`}>
            {run.status}
          </Badge>
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 border-t pt-2 flex flex-col gap-1.5">
          {run.error && (
            <p className="text-xs text-red-500 break-all">{run.error}</p>
          )}
          {run.nodeRuns.map((nr) => (
            <NodeRunRow key={nr.id} nr={nr} />
          ))}
          {run.nodeRuns.length === 0 && (
            <p className="text-xs text-muted-foreground">No node executions recorded</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExecutionLogs() {
  const pathname = usePathname();
  const workflowId = pathname.split("/").pop()!;
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRuns = async () => {
    setLoading(true);
    const data = await getWorkflowRuns(workflowId);
    if (data && "runs" in data) {
      setRuns((data.runs as WorkflowRun[]) ?? []);
      setIsPublished(data.isPublished);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRuns();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading runs…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">Last 20 runs</span>
        <Button variant="ghost" size="sm" onClick={fetchRuns} className="h-7 px-2">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {runs.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-10">
          {isPublished
            ? "No executions yet. Trigger your workflow to see runs here."
            : "No executions yet. Publish your workflow and trigger it."}
        </div>
      ) : (
        runs.map((run) => <WorkflowRunRow key={run.id} run={run} />)
      )}
    </div>
  );
}

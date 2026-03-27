import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, XCircle, Clock, Loader2, SkipForward } from "lucide-react";
import { getWorkflowRuns } from "../../_actions/workflow-connections";
import { getWorkflowMeta } from "../../editor/[editorId]/_actions/workflow-connections";
import { Badge } from "@/components/ui/badge";

type PageProps = { params: Promise<{ id: string }> };

function timeAgo(date: Date): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function durationMs(start: Date | null, end: Date | null): string {
  if (!start || !end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const RUN_STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900",
  },
  failed: {
    label: "Failed",
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
  },
  running: {
    label: "Running",
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900",
  },
  paused: {
    label: "Paused",
    icon: <Clock className="h-3.5 w-3.5" />,
    className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  },
};

const NODE_STATUS_CONFIG: Record<string, { icon: React.ReactNode; className: string }> = {
  completed: { icon: <CheckCircle2 className="h-3 w-3" />, className: "text-emerald-500" },
  failed:    { icon: <XCircle className="h-3 w-3" />,     className: "text-red-500" },
  skipped:   { icon: <SkipForward className="h-3 w-3" />, className: "text-muted-foreground" },
  running:   { icon: <Loader2 className="h-3 w-3 animate-spin" />, className: "text-blue-500" },
  pending:   { icon: <Clock className="h-3 w-3" />,       className: "text-muted-foreground" },
};

export default async function RunsPage({ params }: PageProps) {
  const { id } = await params;

  const [result, meta] = await Promise.all([
    getWorkflowRuns(id),
    getWorkflowMeta(id),
  ]);

  if (!result) notFound();

  const { runs } = result;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href={`/workflows/editor/${id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{meta?.name ?? "Workflow"}</span>
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-sm font-medium text-foreground">Run History</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Runs",    value: runs.length },
            { label: "Completed",     value: runs.filter((r) => r.status === "completed").length },
            { label: "Failed",        value: runs.filter((r) => r.status === "failed").length },
            { label: "Success Rate",  value: runs.length
                ? `${Math.round((runs.filter((r) => r.status === "completed").length / runs.length) * 100)}%`
                : "—" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Runs list */}
        {runs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No runs yet</p>
            <p className="text-xs mt-1 opacity-60">
              Trigger your workflow to see execution history here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {runs.map((run) => {
              const cfg = RUN_STATUS_CONFIG[run.status] ?? RUN_STATUS_CONFIG.running;
              return (
                <details
                  key={run.id}
                  className="group rounded-xl border border-border bg-card overflow-hidden"
                >
                  <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none list-none hover:bg-muted/30 transition-colors">
                    {/* Status badge */}
                    <span
                      className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </span>

                    {/* Run ID + time */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {run.id}
                      </p>
                    </div>

                    {/* Duration + time ago */}
                    <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0">
                      <span className="text-xs text-foreground">
                        {durationMs(run.startedAt, run.completedAt)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {timeAgo(run.startedAt)}
                      </span>
                    </div>

                    {/* Node count */}
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {run.nodeRuns.length} nodes
                    </Badge>
                  </summary>

                  {/* Node runs detail */}
                  <div className="border-t border-border bg-muted/20 divide-y divide-border">
                    {run.nodeRuns.map((nr) => {
                      const nc = NODE_STATUS_CONFIG[nr.status] ?? NODE_STATUS_CONFIG.pending;
                      return (
                        <div key={nr.id} className="px-4 py-3 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className={nc.className}>{nc.icon}</span>
                            <span className="text-xs font-medium text-foreground">{nr.nodeType}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{nr.nodeId.slice(0, 8)}</span>
                            <span className="ml-auto text-[11px] text-muted-foreground">
                              {durationMs(nr.startedAt, nr.completedAt)}
                            </span>
                          </div>

                          {nr.error && (
                            <pre className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded p-2 overflow-auto max-h-24 whitespace-pre-wrap break-all">
                              {nr.error}
                            </pre>
                          )}

                          {nr.outputData && (
                            <pre className="text-[11px] text-muted-foreground bg-muted rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap break-all">
                              {JSON.stringify(nr.outputData, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

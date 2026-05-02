import React from "react";
import { getAllExecutionLogs, getLogStats } from "./_actions/log-actions";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { CheckCircle2, XCircle, MinusCircle, Activity } from "lucide-react";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    dot: "bg-emerald-500",
    label: "Success",
    text: "text-emerald-600 dark:text-emerald-400",
  },
  failed: {
    icon: XCircle,
    dot: "bg-red-500",
    label: "Failed",
    text: "text-red-600 dark:text-red-400",
  },
  skipped: {
    icon: MinusCircle,
    dot: "bg-zinc-400",
    label: "Skipped",
    text: "text-muted-foreground",
  },
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const { userId } = await auth();
  const resolvedParams = await searchParams;

  const workflows = userId
    ? await db.workflows.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const selectedStatus = resolvedParams?.status;
  const selectedWorkflow = resolvedParams?.workflow;
  const page = parseInt(resolvedParams?.page ?? "1");
  const pageSize = 25;

  const [{ logs, total }, stats] = await Promise.all([
    getAllExecutionLogs({
      status: selectedStatus,
      workflowId: selectedWorkflow,
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    getLogStats(),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">

      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Execution Logs</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Track every step your workflows have executed.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Runs",    value: stats.total,       icon: Activity,      color: "text-muted-foreground" },
          { label: "Successful",    value: stats.success,     icon: CheckCircle2,  color: "text-emerald-500" },
          { label: "Failed",        value: stats.failed,      icon: XCircle,       color: "text-red-500" },
          { label: "Success Rate",  value: `${stats.successRate}%`, icon: Activity, color: "text-muted-foreground" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <Icon className={`h-3.5 w-3.5 ${color}`} />
            </div>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {["all", "success", "failed", "skipped"].map((s) => {
          const isActive = s === "all" ? !selectedStatus : selectedStatus === s;
          const params = new URLSearchParams(resolvedParams as Record<string, string>);
          if (s === "all") params.delete("status");
          else params.set("status", s);
          params.delete("page");
          return (
            <a
              key={s}
              href={`?${params.toString()}`}
              className={`h-7 px-3 rounded-md text-xs font-medium border transition-colors inline-flex items-center ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </a>
          );
        })}

        {workflows.length > 0 && (
          <div className="w-px h-7 bg-border self-center mx-1" />
        )}

        {workflows.length > 0 &&
          [{ id: "", name: "All Workflows" }, ...workflows].map((w) => {
            const isActive = w.id === "" ? !selectedWorkflow : selectedWorkflow === w.id;
            const params = new URLSearchParams(resolvedParams as Record<string, string>);
            if (w.id === "") params.delete("workflow");
            else params.set("workflow", w.id);
            params.delete("page");
            return (
              <a
                key={w.id}
                href={`?${params.toString()}`}
                className={`h-7 px-3 rounded-md text-xs font-medium border transition-colors inline-flex items-center truncate max-w-[180px] ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
                title={w.name}
              >
                {w.name}
              </a>
            );
          })}
      </div>

      {/* Logs */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No execution logs yet</p>
          <p className="text-xs text-muted-foreground/60">Logs will appear here when your workflows run</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Workflow</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Step</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Message</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const cfg = statusConfig[log.status as keyof typeof statusConfig] ?? statusConfig.skipped;
                return (
                  <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[160px] truncate">
                      <a
                        href={`/workflows/editor/${log.workflowId}`}
                        className="hover:underline text-primary text-xs"
                        title={log.workflowName}
                      >
                        {log.workflowName}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{log.step}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-[280px] truncate">
                      {log.message ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(log.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(resolvedParams as Record<string, string>);
            params.set("page", String(p));
            return (
              <a
                key={p}
                href={`?${params.toString()}`}
                className={`h-7 w-7 rounded-md text-xs font-medium border transition-colors inline-flex items-center justify-center ${
                  p === page
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

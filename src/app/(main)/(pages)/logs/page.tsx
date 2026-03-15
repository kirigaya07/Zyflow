import React from "react";
import { getAllExecutionLogs, getLogStats } from "./_actions/log-actions";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, MinusCircle, Activity } from "lucide-react";

type SearchParams = { [key: string]: string | undefined };

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
    className: "bg-green-500/10 text-green-400 border-green-500/20",
    label: "Success",
  },
  failed: {
    icon: XCircle,
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    label: "Failed",
  },
  skipped: {
    icon: MinusCircle,
    className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    label: "Skipped",
  },
};

export default async function LogsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { userId } = await auth();

  // Get user's workflows for filter dropdown
  const workflows = userId
    ? await db.workflows.findMany({
        where: { userId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const selectedStatus = searchParams?.status;
  const selectedWorkflow = searchParams?.workflow;
  const page = parseInt(searchParams?.page ?? "1");
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
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="sticky top-0 z-[10] flex items-center justify-between border-b bg-background/50 pb-4 backdrop-blur-lg">
        <h1 className="text-4xl font-bold">Execution Logs</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Runs
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.success}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {stats.failed}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Status filter */}
        <div className="flex gap-2">
          {["all", "success", "failed", "skipped"].map((s) => {
            const isActive =
              s === "all" ? !selectedStatus : selectedStatus === s;
            const params = new URLSearchParams(searchParams as Record<string, string>);
            if (s === "all") params.delete("status");
            else params.set("status", s);
            params.delete("page");
            return (
              <a
                key={s}
                href={`?${params.toString()}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </a>
            );
          })}
        </div>

        {/* Workflow filter */}
        {workflows.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {[{ id: "", name: "All Workflows" }, ...workflows].map((w) => {
              const isActive =
                w.id === "" ? !selectedWorkflow : selectedWorkflow === w.id;
              const params = new URLSearchParams(searchParams as Record<string, string>);
              if (w.id === "") params.delete("workflow");
              else params.set("workflow", w.id);
              params.delete("page");
              return (
                <a
                  key={w.id}
                  href={`?${params.toString()}`}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors truncate max-w-[200px] ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                  title={w.name}
                >
                  {w.name}
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Logs table */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-20 text-muted-foreground gap-3">
          <Activity className="h-12 w-12 opacity-30" />
          <p className="text-lg font-medium">No execution logs yet</p>
          <p className="text-sm">
            Logs will appear here when your workflows run
          </p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Workflow
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Step
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">
                  Message
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => {
                const cfg =
                  statusConfig[log.status as keyof typeof statusConfig] ??
                  statusConfig.skipped;
                const Icon = cfg.icon;
                return (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium max-w-[180px] truncate">
                      <a
                        href={`/workflows/editor/${log.workflowId}`}
                        className="hover:underline text-primary"
                        title={log.workflowName}
                      >
                        {log.workflowName}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {log.step}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={`flex items-center gap-1 w-fit text-xs ${cfg.className}`}
                      >
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell max-w-[300px] truncate">
                      {log.message ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-xs whitespace-nowrap">
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
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(searchParams as Record<string, string>);
            params.set("page", String(p));
            return (
              <a
                key={p}
                href={`?${params.toString()}`}
                className={`px-3 py-1.5 rounded-md text-sm border transition-colors ${
                  p === page
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
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

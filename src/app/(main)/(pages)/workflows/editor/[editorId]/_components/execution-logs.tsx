"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getWorkflowExecutionLogs } from "../../../_actions/workflow-connections";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type LogEntry = {
  id: string;
  workflowId: string;
  step: string;
  status: string;
  message: string | null;
  createdAt: Date;
};

const STATUS_STYLES: Record<string, string> = {
  success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  skipped: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function ExecutionLogs() {
  const pathname = usePathname();
  const workflowId = pathname.split("/").pop()!;
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getWorkflowExecutionLogs(workflowId);
    setLogs((data as LogEntry[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [workflowId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        Loading logs…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">Last 50 runs</span>
        <Button variant="ghost" size="sm" onClick={fetchLogs} className="h-7 px-2">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-10">
          No executions yet. Publish your workflow and trigger it.
        </div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className="flex flex-col gap-1 rounded-md border px-3 py-2 text-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">{log.step}</span>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 ${STATUS_STYLES[log.status] ?? STATUS_STYLES.skipped}`}
                >
                  {log.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            </div>
            {log.message && log.status === "failed" && (
              <p className="text-xs text-red-500 dark:text-red-400 break-all">
                {log.message}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  );
}

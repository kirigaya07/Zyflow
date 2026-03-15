"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export type LogEntry = {
  id: string;
  workflowId: string;
  workflowName: string;
  step: string;
  status: string;
  message: string | null;
  createdAt: Date;
};

export async function getAllExecutionLogs(opts?: {
  status?: string;
  workflowId?: string;
  take?: number;
  skip?: number;
}): Promise<{ logs: LogEntry[]; total: number }> {
  const { userId } = await auth();
  if (!userId) return { logs: [], total: 0 };

  // Get user's workflow IDs
  const workflows = await db.workflows.findMany({
    where: { userId },
    select: { id: true, name: true },
  });

  const workflowMap = new Map(workflows.map((w) => [w.id, w.name]));
  const workflowIds = workflows.map((w) => w.id);

  if (!workflowIds.length) return { logs: [], total: 0 };

  const where = {
    workflowId: {
      in: opts?.workflowId ? [opts.workflowId] : workflowIds,
    },
    ...(opts?.status ? { status: opts.status } : {}),
  };

  const [rows, total] = await Promise.all([
    db.executionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: opts?.take ?? 50,
      skip: opts?.skip ?? 0,
    }),
    db.executionLog.count({ where }),
  ]);

  return {
    logs: rows.map((r) => ({
      ...r,
      workflowName: workflowMap.get(r.workflowId) ?? "Unknown Workflow",
    })),
    total,
  };
}

export async function getLogStats(): Promise<{
  total: number;
  success: number;
  failed: number;
  skipped: number;
  successRate: number;
}> {
  const { userId } = await auth();
  if (!userId)
    return { total: 0, success: 0, failed: 0, skipped: 0, successRate: 0 };

  const workflows = await db.workflows.findMany({
    where: { userId },
    select: { id: true },
  });
  const workflowIds = workflows.map((w) => w.id);
  if (!workflowIds.length)
    return { total: 0, success: 0, failed: 0, skipped: 0, successRate: 0 };

  const [success, failed, skipped] = await Promise.all([
    db.executionLog.count({ where: { workflowId: { in: workflowIds }, status: "success" } }),
    db.executionLog.count({ where: { workflowId: { in: workflowIds }, status: "failed" } }),
    db.executionLog.count({ where: { workflowId: { in: workflowIds }, status: "skipped" } }),
  ]);

  const total = success + failed + skipped;
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

  return { total, success, failed, skipped, successRate };
}

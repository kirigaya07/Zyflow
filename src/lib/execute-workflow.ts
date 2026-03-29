/**
 * Direct workflow executor — runs the workflow inline without Inngest Cloud.
 *
 * Used by the webhook handler so workflows execute immediately, even in local dev.
 * Produces the same WorkflowRun / NodeRun records as the Inngest engine.
 *
 * Differences from the Inngest engine:
 *  - No durable retries (each executor call runs once)
 *  - Wait nodes are skipped (no serverless-safe sleep in a regular request)
 *  - Execution is synchronous within the request lifecycle
 */

import { db } from "@/lib/db";
import { executorRegistry, SPECIAL_NODES } from "@/inngest/executor-registry";
import { interpolateObject } from "@/inngest/expressions";
import type { EditorNodeType } from "@/lib/types";
import type { ExecutionContext, Item } from "@/inngest/types";

const toJson = (items: Item[]) => JSON.parse(JSON.stringify(items));

export type DirectRunResult =
  | { success: true; runId: string }
  | { success: false; error: string; runId?: string };

export async function executeWorkflowDirect(
  workflowId: string,
  payload: Record<string, unknown>
): Promise<DirectRunResult> {
  // ── Load & validate ────────────────────────────────────────────────────────
  const wf = await db.workflows.findUnique({ where: { id: workflowId } });
  if (!wf) return { success: false, error: "Workflow not found" };
  if (!wf.publish) return { success: false, error: "Workflow is not published" };

  const user = await db.user.findUnique({
    where: { clerkId: wf.userId },
    select: { credits: true },
  });
  if (!user) return { success: false, error: "User not found" };
  if (user.credits !== "Unlimited" && parseInt(user.credits ?? "0") <= 0) {
    return { success: false, error: "Insufficient credits" };
  }

  // ── Parse canvas data ──────────────────────────────────────────────────────
  let nodes: EditorNodeType[] = [];
  let path: string[] = [];
  try { nodes = wf.nodes ? JSON.parse(wf.nodes) : []; } catch {}
  try { path = wf.flowPath ? JSON.parse(wf.flowPath) : []; } catch {}

  if (!path.length) {
    return { success: false, error: "No execution path configured — save the workflow first." };
  }

  const nodeMap: Record<string, EditorNodeType> = {};
  for (const n of nodes) nodeMap[n.id] = n;

  // ── Create run record ──────────────────────────────────────────────────────
  const run = await db.workflowRun.create({
    data: {
      workflowId,
      status: "running",
      trigger: { source: "webhook", payload },
    },
  });

  const ctx: ExecutionContext = {
    workflowId,
    runId: run.id,
    userId: wf.userId,
    triggerPayload: payload,
    nodeOutputs: new Map(),
    workflow: {
      discordTemplate: wf.discordTemplate,
      slackTemplate: wf.slackTemplate,
      slackAccessToken: wf.slackAccessToken,
      slackChannels: wf.slackChannels,
      notionTemplate: wf.notionTemplate,
      notionAccessToken: wf.notionAccessToken,
      notionDbId: wf.notionDbId,
      emailTemplate: wf.emailTemplate,
      emailRecipients: wf.emailRecipients,
      emailSubject: wf.emailSubject,
    },
  };

  let currentItems: Item[] = [{ json: payload }];

  // ── Execute each node in flow order ───────────────────────────────────────
  for (const nodeId of path) {
    let node = nodeMap[nodeId];

    // Legacy fallback: flowPath may contain type strings from old saves
    if (!node) {
      const found = Object.values(nodeMap).find(
        (n) => (n.type ?? n.data?.type) === nodeId
      );
      if (!found) continue;
      node = found;
    }

    const nodeType = node.type ?? node.data?.type;

    // Wait nodes can't be executed synchronously — skip them
    if (nodeType === "Wait") continue;

    // Trigger / Drive nodes are not action nodes
    if (SPECIAL_NODES.has(nodeType) && nodeType !== "Condition") continue;

    const executor = executorRegistry[nodeType];
    if (!executor) continue;

    const rawMetadata = (node.data?.metadata ?? {}) as Record<string, unknown>;
    const resolvedMetadata = interpolateObject(rawMetadata, ctx.nodeOutputs, ctx.triggerPayload);
    const nodeConfig = { nodeId, nodeType, metadata: resolvedMetadata };

    const nodeRun = await db.nodeRun.create({
      data: {
        runId: run.id,
        nodeId,
        nodeType,
        status: "running",
        inputData: toJson(currentItems),
        startedAt: new Date(),
      },
    });

    try {
      const output = await executor.execute(currentItems, nodeConfig, ctx);

      await db.nodeRun.update({
        where: { id: nodeRun.id },
        data: {
          status: "completed",
          outputData: toJson(output),
          completedAt: new Date(),
        },
      });

      // Condition: keep only the true-branch items
      if (nodeType === "Condition") {
        currentItems = output
          .filter((item) => (item.json as Record<string, unknown>)._branch === "true")
          .map(({ json }) => {
            const { _branch, ...rest } = json as Record<string, unknown>;
            return { json: rest };
          });
      } else {
        currentItems = output;
      }

      ctx.nodeOutputs.set(nodeId, output);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await db.nodeRun.update({
        where: { id: nodeRun.id },
        data: { status: "failed", error: message, completedAt: new Date() },
      });
      await db.workflowRun.update({
        where: { id: run.id },
        data: { status: "failed", completedAt: new Date(), error: message },
      });

      return { success: false, runId: run.id, error: message };
    }
  }

  // ── Finalise ───────────────────────────────────────────────────────────────
  if (user.credits !== "Unlimited") {
    await db.user.update({
      where: { clerkId: wf.userId },
      data: { credits: String(Math.max(0, parseInt(user.credits ?? "0") - 1)) },
    });
  }

  await db.workflowRun.update({
    where: { id: run.id },
    data: { status: "completed", completedAt: new Date() },
  });

  return { success: true, runId: run.id };
}

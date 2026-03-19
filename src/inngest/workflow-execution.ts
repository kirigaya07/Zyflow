import { inngest } from "./client";
import { db } from "@/lib/db";
import { executorRegistry, SPECIAL_NODES } from "./executor-registry";
import { interpolateObject } from "./expressions";
import type { EditorNodeType } from "@/lib/types";
import type { ExecutionContext, Item } from "./types";

/** Serialize Item[] to a plain JSON-compatible value for Prisma */
const toJson = (items: Item[]) => JSON.parse(JSON.stringify(items));

/**
 * Zyflow workflow execution engine — built on Inngest for durability.
 *
 * Architecture:
 *  - flowPath stores ordered node IDs (not type strings)
 *  - Each node receives Item[] from the previous node
 *  - Node config comes from node.data.metadata on the canvas
 *  - Expressions ({{ nodeId.field }}) are resolved before each executor runs
 *  - WorkflowRun + NodeRun records provide full execution history
 */
export const executeWorkflow = inngest.createFunction(
  {
    id: "execute-workflow",
    name: "Execute Workflow",
    retries: 3,
    concurrency: { limit: 10 },
  },
  { event: "workflow/trigger" },
  async ({ event, step }) => {
    const { workflowId, source, payload = {} } = event.data;

    // ── Step 1: Load and validate workflow ──────────────────────────────────
    const workflow = await step.run("load-workflow", async () => {
      const wf = await db.workflows.findUnique({ where: { id: workflowId } });
      if (!wf) throw new Error(`Workflow ${workflowId} not found`);
      if (!wf.publish) throw new Error(`Workflow ${workflowId} is not published`);
      return wf;
    });

    // ── Step 2: Check credits ───────────────────────────────────────────────
    const user = await step.run("check-credits", async () => {
      const u = await db.user.findUnique({
        where: { clerkId: workflow.userId },
        select: { credits: true },
      });
      if (!u) throw new Error("User not found");
      if (u.credits !== "Unlimited" && parseInt(u.credits ?? "0") <= 0) {
        throw new Error("Insufficient credits");
      }
      return u;
    });

    // ── Step 3: Parse nodes and flow path ───────────────────────────────────
    const { nodeMap, flowPath } = await step.run("parse-workflow", async () => {
      let nodes: EditorNodeType[] = [];
      let path: string[] = [];

      try { nodes = workflow.nodes ? JSON.parse(workflow.nodes) : []; } catch {}
      try { path = workflow.flowPath ? JSON.parse(workflow.flowPath) : []; } catch {}

      if (!path.length) throw new Error("No execution path configured");

      const map: Record<string, EditorNodeType> = {};
      for (const n of nodes) map[n.id] = n;

      return { nodeMap: map, flowPath: path };
    });

    // ── Step 4: Create WorkflowRun record ───────────────────────────────────
    const run = await step.run("create-run", async () => {
      return db.workflowRun.create({
        data: {
          workflowId,
          status: "running",
          trigger: { source, payload },
        },
      });
    });

    const ctx: ExecutionContext = {
      workflowId,
      runId: run.id,
      userId: workflow.userId,
      triggerPayload: payload as Record<string, unknown>,
      nodeOutputs: new Map(),
      workflow: {
        discordTemplate: workflow.discordTemplate,
        slackTemplate: workflow.slackTemplate,
        slackAccessToken: workflow.slackAccessToken,
        slackChannels: workflow.slackChannels,
        notionTemplate: workflow.notionTemplate,
        notionAccessToken: workflow.notionAccessToken,
        notionDbId: workflow.notionDbId,
        emailTemplate: workflow.emailTemplate,
        emailRecipients: workflow.emailRecipients,
        emailSubject: workflow.emailSubject,
      },
    };

    // ── Step 5: Log trigger ─────────────────────────────────────────────────
    await step.run("log-trigger", async () => {
      await db.executionLog.create({
        data: {
          workflowId,
          step: "Trigger",
          status: "success",
          message: `Triggered by ${source}`,
        },
      });
    });

    // ── Step 6: Execute nodes ───────────────────────────────────────────────
    let currentItems: Item[] = [{ json: payload as Record<string, unknown> }];

    for (const nodeId of flowPath) {
      let node = nodeMap[nodeId];

      // Legacy fallback: flowPath may contain type strings (e.g. "Discord") from
      // workflows saved before the node-ID format was introduced. Find the first
      // canvas node whose type matches.
      if (!node) {
        const found = Object.values(nodeMap).find(
          (n) => (n.type ?? n.data?.type) === nodeId
        );
        if (!found) continue;
        node = found;
      }

      const nodeType = node.type ?? node.data?.type;

      // Special node: Wait — must use step.sleep at the top level
      if (nodeType === "Wait") {
        const duration = (node.data?.metadata?.duration as string) || "1h";
        await step.sleep(`wait-${nodeId}`, duration);
        await step.run(`log-wait-${nodeId}`, async () => {
          await db.nodeRun.create({
            data: {
              runId: run.id,
              nodeId,
              nodeType: "Wait",
              status: "completed",
              inputData: toJson(currentItems),
              outputData: toJson(currentItems),
              startedAt: new Date(),
              completedAt: new Date(),
            },
          });
          await db.executionLog.create({
            data: { workflowId, step: "Wait", status: "success", message: `Slept ${duration}` },
          });
        });
        continue;
      }

      // Skip non-executable nodes (triggers, etc.)
      if (SPECIAL_NODES.has(nodeType) && nodeType !== "Condition") {
        continue;
      }

      const executor = executorRegistry[nodeType];
      if (!executor) {
        continue;
      }

      // Resolve expressions in metadata before executing
      const rawMetadata = (node.data?.metadata ?? {}) as Record<string, unknown>;
      const resolvedMetadata = interpolateObject(rawMetadata, ctx.nodeOutputs, ctx.triggerPayload);

      const nodeConfig = { nodeId, nodeType, metadata: resolvedMetadata };

      // Execute inside an Inngest step for durability + per-step retries
      currentItems = await step.run(`node-${nodeId}`, async () => {
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

          await db.executionLog.create({
            data: { workflowId, step: nodeType, status: "success" },
          });

          return output;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          await db.nodeRun.update({
            where: { id: nodeRun.id },
            data: { status: "failed", error: message, completedAt: new Date() },
          });
          await db.executionLog.create({
            data: { workflowId, step: nodeType, status: "failed", message },
          });
          throw err;
        }
      });

      // For Condition nodes: filter to only true-branch items and strip _branch tag
      if (nodeType === "Condition") {
        currentItems = currentItems
          .filter((item) => (item.json as Record<string, unknown>)._branch === "true")
          .map((item) => {
            const { _branch, ...rest } = item.json as Record<string, unknown>;
            return { json: rest };
          });
      }

      // Store output for expression resolution in subsequent nodes
      ctx.nodeOutputs.set(nodeId, currentItems);
    }

    // ── Step 7: Deduct credit ───────────────────────────────────────────────
    await step.run("deduct-credit", async () => {
      if (user.credits !== "Unlimited") {
        await db.user.update({
          where: { clerkId: workflow.userId },
          data: { credits: String(Math.max(0, parseInt(user.credits ?? "0") - 1)) },
        });
      }
      await db.workflowRun.update({
        where: { id: run.id },
        data: { status: "completed", completedAt: new Date() },
      });
    });

    return { message: "Workflow completed", workflowId, runId: run.id };
  }
);

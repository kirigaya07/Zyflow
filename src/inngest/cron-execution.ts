import { inngest } from "./client";
import { db } from "@/lib/db";
import { executeWorkflowDirect } from "@/lib/execute-workflow";
import type { EditorNodeType } from "@/lib/types";

/**
 * Scheduled Inngest function that fires every hour and fans out
 * `workflow/trigger` events for every published workflow that contains
 * a "Cron Trigger" node whose saved cron expression matches the current hour.
 *
 * Because Inngest does not yet support user-defined per-workflow cron
 * schedules at runtime, we use a single "poll every hour" approach and
 * evaluate each workflow's configured schedule inside the function body.
 *
 * Schedule matching table (UTC):
 *   every_hour          → always fire
 *   every_day_9am       → fire when hour === 9
 *   every_day_midnight  → fire when hour === 0
 *   every_monday        → fire when weekday === 1 && hour === 9
 *   every_weekday       → fire when weekday 1-5  && hour === 9
 *   every_sunday        → fire when weekday === 0 && hour === 0
 */
export const scheduledWorkflowCheck = inngest.createFunction(
  {
    id: "scheduled-workflow-check",
    name: "Scheduled Workflow Check",
  },
  { cron: "0 * * * *" }, // runs at the top of every UTC hour
  async ({ step }) => {
    // ── 1. Load all published workflows ──────────────────────────────────
    const publishedWorkflows = await step.run("load-published-workflows", async () => {
      return db.workflows.findMany({
        where: { publish: true },
        select: { id: true, userId: true, nodes: true },
      });
    });

    // ── 2. Determine current UTC time ─────────────────────────────────────
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcWeekday = now.getUTCDay(); // 0 = Sunday, 1 = Monday, …

    // ── 3. Filter workflows that have a Cron Trigger node matching now ────
    const workflowsToFire: string[] = [];

    for (const wf of publishedWorkflows) {
      let nodes: EditorNodeType[] = [];
      try {
        nodes = JSON.parse((wf.nodes as string) ?? "[]");
      } catch {
        continue;
      }

      const cronNode = nodes.find((n) => n.data.type === "Cron Trigger");
      if (!cronNode) continue;

      const schedule = (cronNode.data.metadata?.schedule as string) || "every_day_9am";

      const shouldFire = matchesSchedule(schedule, utcHour, utcWeekday);
      if (shouldFire) {
        workflowsToFire.push(wf.id);
      }
    }

    // ── 4. Fan-out: execute each matching workflow directly ────────────────
    if (workflowsToFire.length > 0) {
      await step.run("execute-cron-workflows", async () => {
        const payload = { firedAt: now.toISOString(), utcHour, utcWeekday };
        await Promise.all(
          workflowsToFire.map((workflowId) =>
            executeWorkflowDirect(workflowId, payload)
          )
        );
      });
    }

    return {
      checked: publishedWorkflows.length,
      fired: workflowsToFire.length,
      workflowIds: workflowsToFire,
    };
  }
);

/** Returns true when the given schedule key fires at this UTC hour/weekday. */
function matchesSchedule(schedule: string, utcHour: number, utcWeekday: number): boolean {
  switch (schedule) {
    case "every_hour":
      return true;
    case "every_day_9am":
      return utcHour === 9;
    case "every_day_midnight":
      return utcHour === 0;
    case "every_monday":
      return utcWeekday === 1 && utcHour === 9;
    case "every_weekday":
      return utcWeekday >= 1 && utcWeekday <= 5 && utcHour === 9;
    case "every_sunday":
      return utcWeekday === 0 && utcHour === 0;
    default:
      return false;
  }
}

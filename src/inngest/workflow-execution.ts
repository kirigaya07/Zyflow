import { inngest } from "./client";
import { db } from "@/lib/db";
import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { sendEmailToMultipleRecipientsViaGmail } from "@/app/(main)/(pages)/connections/_actions/email-connection";
import { safeDecrypt } from "@/lib/encryption";

/**
 * Inngest durable workflow execution function.
 *
 * Key advantages over the old /api/flow cron approach:
 * - Each step is isolated: a failure in Slack doesn't abort Discord
 * - Built-in per-step retries with exponential backoff (no manual withRetry)
 * - `step.sleep()` replaces the fragile cron-job.org Wait node
 * - Full execution timeline visible in the Inngest dashboard
 * - Survives serverless cold starts and mid-execution restarts
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
    const { workflowId, source } = event.data;

    // Step 1: Load and validate workflow
    const workflow = await step.run("load-workflow", async () => {
      const wf = await db.workflows.findUnique({ where: { id: workflowId } });
      if (!wf) throw new Error(`Workflow ${workflowId} not found`);
      if (!wf.publish) throw new Error(`Workflow ${workflowId} is not published`);
      return wf;
    });

    // Step 2: Check credits
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

    // Step 3: Parse flow path
    let flowPath: string[] = [];
    try {
      flowPath = workflow.flowPath ? JSON.parse(workflow.flowPath) : [];
    } catch {
      flowPath = [];
    }

    if (!flowPath.length) {
      return { message: "No execution path configured" };
    }

    // Log the trigger
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

    // Step 4: Execute each node
    for (const node of flowPath) {
      if (node === "Discord") {
        await step.run("step-discord", async () => {
          const hook = await db.discordWebhook.findFirst({
            where: { userId: workflow.userId },
            select: { url: true },
          });
          if (!hook || !workflow.discordTemplate) {
            await db.executionLog.create({
              data: { workflowId, step: "Discord", status: "skipped", message: "No webhook or template" },
            });
            return;
          }
          const result = await postContentToWebHook(workflow.discordTemplate, hook.url);
          await db.executionLog.create({
            data: {
              workflowId,
              step: "Discord",
              status: result.message === "success" ? "success" : "failed",
              message: result.message,
            },
          });
        });
      }

      if (node === "Slack") {
        await step.run("step-slack", async () => {
          if (!workflow.slackAccessToken || !workflow.slackChannels?.length || !workflow.slackTemplate) {
            await db.executionLog.create({
              data: { workflowId, step: "Slack", status: "skipped", message: "Incomplete configuration" },
            });
            return;
          }
          const channels = workflow.slackChannels.map((ch) => ({ label: "", value: ch }));
          const result = await postMessageToSlack(
            safeDecrypt(workflow.slackAccessToken),
            channels,
            workflow.slackTemplate
          );
          await db.executionLog.create({
            data: {
              workflowId,
              step: "Slack",
              status: result.message === "Success" ? "success" : "failed",
              message: result.message,
            },
          });
        });
      }

      if (node === "Notion") {
        await step.run("step-notion", async () => {
          if (!workflow.notionTemplate || !workflow.notionDbId || !workflow.notionAccessToken) {
            await db.executionLog.create({
              data: { workflowId, step: "Notion", status: "skipped", message: "Incomplete configuration" },
            });
            return;
          }
          let fileName = "New Entry";
          try {
            const parsed = JSON.parse(workflow.notionTemplate);
            fileName = typeof parsed === "string" ? parsed : parsed.name ?? "New Entry";
          } catch {
            fileName = workflow.notionTemplate;
          }
          await onCreateNewPageInDatabase(
            workflow.notionDbId,
            safeDecrypt(workflow.notionAccessToken),
            fileName
          );
          await db.executionLog.create({
            data: { workflowId, step: "Notion", status: "success" },
          });
        });
      }

      if (node === "Email") {
        await step.run("step-email", async () => {
          if (!workflow.emailRecipients?.length) {
            await db.executionLog.create({
              data: { workflowId, step: "Email", status: "skipped", message: "No recipients" },
            });
            return;
          }
          await sendEmailToMultipleRecipientsViaGmail(
            workflow.emailRecipients,
            workflow.emailSubject ?? "Workflow Notification",
            workflow.emailTemplate ?? "A workflow event occurred.",
            workflow.userId
          );
          await db.executionLog.create({
            data: { workflowId, step: "Email", status: "success" },
          });
        });
      }

      if (node === "Wait") {
        // Durable sleep — survives serverless restarts
        await step.sleep("wait-step", "1 hour");
        await db.executionLog.create({
          data: { workflowId, step: "Wait", status: "success", message: "Slept 1 hour" },
        });
      }
    }

    // Step 5: Deduct credit
    await step.run("deduct-credit", async () => {
      if (user.credits !== "Unlimited") {
        await db.user.update({
          where: { clerkId: workflow.userId },
          data: { credits: String(Math.max(0, parseInt(user.credits ?? "0") - 1)) },
        });
      }
    });

    return { message: "Workflow completed", workflowId, steps: flowPath.length };
  }
);

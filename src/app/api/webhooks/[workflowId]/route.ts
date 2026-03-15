/**
 * Per-Workflow Webhook Trigger
 *
 * POST /api/webhooks/:workflowId
 *
 * Any external service can POST to this URL to trigger a published workflow.
 * Optionally accepts a JSON body — the payload is available to the workflow
 * (logged and stored for future conditional/AI nodes).
 *
 * Security: workflows can require a webhook secret via the `X-Webhook-Secret`
 * header matched against the workflow's `webhookSecret` field (future).
 * For now the route is public — only published workflows will execute.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { sendEmailToMultipleRecipientsViaGmail } from "@/app/(main)/(pages)/connections/_actions/email-connection";
import { safeDecrypt } from "@/lib/encryption";
import { withRetry } from "@/lib/retry";

async function logStep(
  workflowId: string,
  step: string,
  status: "success" | "failed" | "skipped",
  message?: string
) {
  try {
    await db.executionLog.create({ data: { workflowId, step, status, message } });
  } catch {
    // never let logging break execution
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;

  // Deduplicate: use request ID header if present
  const requestId = req.headers.get("x-request-id") ?? `webhook-${Date.now()}`;
  const messageId = `webhook-${workflowId}-${requestId}`;

  try {
    await db.webhookEvent.create({ data: { messageId, source: "webhook" } });
  } catch {
    return NextResponse.json({ message: "duplicate skipped" }, { status: 200 });
  }

  const workflow = await db.workflows.findUnique({ where: { id: workflowId } });

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  if (!workflow.publish) {
    return NextResponse.json(
      { error: "Workflow is not published" },
      { status: 403 }
    );
  }

  // Check user credits
  const user = await db.user.findUnique({
    where: { clerkId: workflow.userId },
    select: { credits: true },
  });

  if (!user || (user.credits !== "Unlimited" && parseInt(user.credits ?? "0") <= 0)) {
    return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
  }

  // Parse flow path
  let flowPath: string[] = [];
  try {
    flowPath = workflow.flowPath ? JSON.parse(workflow.flowPath) : [];
  } catch {
    flowPath = [];
  }

  if (!flowPath.length) {
    return NextResponse.json(
      { error: "Workflow has no execution path configured" },
      { status: 400 }
    );
  }

  // Parse incoming payload (available for future conditional/AI nodes)
  let payload: unknown = null;
  try {
    payload = await req.json();
  } catch {
    // body may be empty — that's fine
  }

  // Log the trigger
  await logStep(workflowId, "Webhook Trigger", "success", JSON.stringify(payload).slice(0, 200));

  // Execute each step
  for (const step of flowPath) {
    if (step === "Discord") {
      const hook = await db.discordWebhook.findFirst({
        where: { userId: workflow.userId },
        select: { url: true },
      });
      if (hook && workflow.discordTemplate) {
        try {
          await withRetry(() => postContentToWebHook(workflow.discordTemplate!, hook.url), {
            label: "Discord",
          });
          await logStep(workflowId, "Discord", "success");
        } catch (e) {
          await logStep(workflowId, "Discord", "failed", String(e));
        }
      } else {
        await logStep(workflowId, "Discord", "skipped", "No webhook or template");
      }
    }

    if (step === "Slack") {
      if (workflow.slackAccessToken && workflow.slackChannels?.length && workflow.slackTemplate) {
        const channels = workflow.slackChannels.map((ch) => ({ label: "", value: ch }));
        try {
          await withRetry(
            () =>
              postMessageToSlack(
                safeDecrypt(workflow.slackAccessToken!),
                channels,
                workflow.slackTemplate!
              ),
            { label: "Slack" }
          );
          await logStep(workflowId, "Slack", "success");
        } catch (e) {
          await logStep(workflowId, "Slack", "failed", String(e));
        }
      } else {
        await logStep(workflowId, "Slack", "skipped", "Incomplete configuration");
      }
    }

    if (step === "Notion") {
      if (workflow.notionTemplate && workflow.notionDbId && workflow.notionAccessToken) {
        try {
          const notionData = JSON.parse(workflow.notionTemplate);
          const fileName =
            typeof notionData === "string" ? notionData : notionData.name ?? "Webhook Event";
          await withRetry(
            () =>
              onCreateNewPageInDatabase(
                workflow.notionDbId!,
                safeDecrypt(workflow.notionAccessToken!),
                fileName
              ),
            { label: "Notion" }
          );
          await logStep(workflowId, "Notion", "success");
        } catch (e) {
          await logStep(workflowId, "Notion", "failed", String(e));
        }
      } else {
        await logStep(workflowId, "Notion", "skipped", "Incomplete configuration");
      }
    }

    if (step === "Email") {
      if (workflow.emailRecipients?.length) {
        try {
          await withRetry(
            () =>
              sendEmailToMultipleRecipientsViaGmail(
                workflow.emailRecipients,
                workflow.emailSubject ?? "Webhook Notification",
                workflow.emailTemplate ?? "A webhook event was received.",
                workflow.userId
              ),
            { label: "Email" }
          );
          await logStep(workflowId, "Email", "success");
        } catch (e) {
          await logStep(workflowId, "Email", "failed", String(e));
        }
      } else {
        await logStep(workflowId, "Email", "skipped", "No recipients configured");
      }
    }

    // Wait steps are skipped for webhook-triggered runs (no cron scheduling here)
    if (step === "Wait") {
      await logStep(workflowId, "Wait", "skipped", "Wait steps are skipped for webhook triggers");
    }
  }

  // Deduct credit
  if (user.credits !== "Unlimited") {
    await db.user.update({
      where: { clerkId: workflow.userId },
      data: { credits: String(parseInt(user.credits ?? "0") - 1) },
    });
  }

  return NextResponse.json({ message: "Workflow executed", workflowId });
}

// Also support GET for easy testing via browser
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;
  const workflow = await db.workflows.findUnique({
    where: { id: workflowId },
    select: { id: true, name: true, publish: true },
  });

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json({
    workflowId: workflow.id,
    name: workflow.name,
    published: workflow.publish,
    triggerUrl: `/api/webhooks/${workflow.id}`,
    method: "POST",
  });
}

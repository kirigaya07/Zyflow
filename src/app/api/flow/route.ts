import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { sendEmailToMultipleRecipientsViaGmail } from "@/app/(main)/(pages)/connections/_actions/email-connection";
import axios from "axios";

/**
 * Flow Route Handler
 * 
 * This endpoint is called by cron jobs to continue workflow execution
 * after a "Wait" step. It processes the remaining workflow steps from
 * the cronPath stored in the database.
 * 
 * Query Parameters:
 * - flow_id: The workflow ID to continue executing
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const flowId = searchParams.get("flow_id");

    if (!flowId) {
      return NextResponse.json(
        { error: "flow_id parameter is required" },
        { status: 400 }
      );
    }

    console.log(`🔄 Continuing workflow execution for flow_id: ${flowId}`);

    // Get the workflow from database
    const workflow = await db.workflows.findUnique({
      where: { id: flowId },
    });

    if (!workflow) {
      console.error(`Workflow not found: ${flowId}`);
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (!workflow.publish) {
      console.log(`Workflow ${flowId} is not published, skipping`);
      return NextResponse.json(
        { message: "Workflow is not published" },
        { status: 200 }
      );
    }

    // Get user to check credits
    const user = await db.user.findUnique({
      where: { clerkId: workflow.userId },
      select: { credits: true },
    });

    if (!user) {
      console.error(`User not found for workflow: ${flowId}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!(user.credits === "Unlimited" || parseInt(user.credits!) > 0)) {
      console.warn(
        `Insufficient credits for workflow ${flowId}, user: ${workflow.userId}`
      );
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    // Get the remaining workflow path from cronPath
    let flowPath: string[] = [];
    if (workflow.cronPath) {
      flowPath = JSON.parse(workflow.cronPath);
    } else if (workflow.flowPath) {
      flowPath = JSON.parse(workflow.flowPath);
    } else {
      console.log(`No flow path found for workflow: ${flowId}`);
      return NextResponse.json(
        { message: "No flow path to execute" },
        { status: 200 }
      );
    }

    console.log(`Executing ${flowPath.length} remaining steps for workflow: ${flowId}`);

    // Execute remaining workflow steps
    let current = 0;
    while (current < flowPath.length) {
      const step = flowPath[current];
      console.log(`Executing step ${current + 1}/${flowPath.length}: ${step}`);

      if (step === "Discord") {
        console.log("Executing Discord action");
        const discordMessage = await db.discordWebhook.findFirst({
          where: { userId: workflow.userId },
          select: { url: true },
        });
        if (discordMessage && workflow.discordTemplate) {
          await postContentToWebHook(
            workflow.discordTemplate,
            discordMessage.url
          );
          console.log("Discord message sent successfully");
        } else {
          console.log("No Discord webhook or template found");
        }
        flowPath.splice(current, 1);
        continue;
      }

      if (step === "Slack") {
        console.log("Executing Slack action");
        if (
          workflow.slackAccessToken &&
          workflow.slackChannels &&
          workflow.slackChannels.length > 0 &&
          workflow.slackTemplate
        ) {
          const channels = workflow.slackChannels.map((channel: string) => ({
            label: "",
            value: channel,
          }));
          await postMessageToSlack(
            workflow.slackAccessToken,
            channels,
            workflow.slackTemplate
          );
          console.log("Slack message sent successfully");
        } else {
          console.log("Slack configuration incomplete");
        }
        flowPath.splice(current, 1);
        continue;
      }

      if (step === "Notion") {
        console.log("Executing Notion action");
        if (workflow.notionTemplate && workflow.notionDbId && workflow.notionAccessToken) {
          const notionData = JSON.parse(workflow.notionTemplate);
          const fileName =
            typeof notionData === "string"
              ? notionData
              : notionData.name || "New Drive File";

          await onCreateNewPageInDatabase(
            workflow.notionDbId,
            workflow.notionAccessToken,
            fileName
          );
          console.log("Notion page created successfully");
        } else {
          console.log("Notion configuration incomplete");
        }
        flowPath.splice(current, 1);
        continue;
      }

      if (step === "Email") {
        console.log("Executing Email action");
        if (workflow.emailRecipients && workflow.emailRecipients.length > 0) {
          await sendEmailToMultipleRecipientsViaGmail(
            workflow.emailRecipients,
            workflow.emailSubject || "Drive Notification",
            workflow.emailTemplate ||
              "A new file has been uploaded to Google Drive.",
            workflow.userId
          );
          console.log("Email sent successfully");
        } else {
          console.log("No email recipients configured");
        }
        flowPath.splice(current, 1);
        continue;
      }

      if (step === "Wait") {
        // If we encounter another Wait step, create a new cron job
        try {
          const res = await axios.put(
            "https://api.cron-job.org/jobs",
            {
              job: {
                url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NGROK_URI}/api/flow?flow_id=${workflow.id}`,
                enabled: "true",
                schedule: {
                  timezone: "Europe/Istanbul",
                  expiresAt: 0,
                  hours: [-1],
                  mdays: [-1],
                  minutes: ["*****"],
                  months: [-1],
                  wdays: [-1],
                },
              },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.CRON_JOB_KEY!}`,
                "Content-Type": "application/json",
              },
            }
          );
          if (res) {
            flowPath.splice(current, 1);
            await db.workflows.update({
              where: { id: workflow.id },
              data: { cronPath: JSON.stringify(flowPath) },
            });
            console.log("New cron job created for Wait step");
            break;
          }
        } catch (err) {
          console.error("Failed to create cron wait job", err);
        }
        break;
      }

      current++;
    }

    // Update the workflow with remaining steps
    if (flowPath.length > 0) {
      await db.workflows.update({
        where: { id: workflow.id },
        data: { cronPath: JSON.stringify(flowPath) },
      });
    } else {
      // Clear cronPath if workflow is complete
      await db.workflows.update({
        where: { id: workflow.id },
        data: { cronPath: null },
      });
      console.log(`✅ Workflow ${flowId} completed`);
    }

    // Deduct credit
    if (user.credits !== "Unlimited") {
      await db.user.update({
        where: { clerkId: workflow.userId },
        data: { credits: `${parseInt(user.credits!) - 1}` },
      });
    }

    return NextResponse.json({
      message: "Workflow execution continued",
      remainingSteps: flowPath.length,
    });
  } catch (error) {
    console.error("Error continuing workflow:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


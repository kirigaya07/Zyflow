import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { db } from "@/lib/db";
import axios from "axios";
import { headers } from "next/headers";

export async function POST() {
  const headersList = await headers();
  // Log all relevant Google headers to verify delivery/validation
  const headerSnapshot: Record<string, string> = {};
  headersList.forEach((value, key) => {
    if (key.startsWith("x-goog-")) headerSnapshot[key] = value;
  });
  console.log("Drive webhook received", headerSnapshot);

  let channelResourceId: string | undefined;
  if (headerSnapshot["x-goog-resource-id"]) {
    channelResourceId = headerSnapshot["x-goog-resource-id"];
  }

  // Immediately ack to avoid Google retries/timeouts
  const ack = Response.json({ ok: true }, { status: 200 });

  // Process asynchronously (fire-and-forget)
  (async () => {
    try {
      if (!channelResourceId) return;
      const user = await db.user.findFirst({
        where: { googleResourceId: channelResourceId },
        select: { clerkId: true, credits: true },
      });
      if (!user) {
        console.warn("No user found for resource id", channelResourceId);
        return;
      }
      if (!(user.credits === "Unlimited" || parseInt(user.credits!) > 0)) {
        console.warn(
          "Insufficient credits; skipping workflows for",
          user.clerkId
        );
        return;
      }

      const workflow = await db.workflows.findMany({
        where: { userId: user.clerkId },
      });
      console.log("Found workflows:", workflow.length);
      workflow.forEach((w) => {
        console.log(`Workflow ${w.id}:`, {
          name: w.name,
          flowPath: w.flowPath,
          slackTemplate: w.slackTemplate,
          slackAccessToken: w.slackAccessToken ? "SET" : "MISSING",
          slackChannels: w.slackChannels,
          publish: w.publish,
        });
      });
      if (!workflow || workflow.length === 0) return;

      await Promise.all(
        workflow.map(async (flow) => {
          if (!flow.flowPath) {
            console.log("No flowPath defined for workflow:", flow.id);
            return;
          }

          const flowPath: string[] = JSON.parse(flow.flowPath);
          let current = 0;
          while (current < flowPath.length) {
            if (flowPath[current] === "Discord") {
              const discordMessage = await db.discordWebhook.findFirst({
                where: { userId: flow.userId },
                select: { url: true },
              });
              if (discordMessage) {
                await postContentToWebHook(
                  flow.discordTemplate!,
                  discordMessage.url
                );
                flowPath.splice(current, 1);
                continue;
              }
            }

            if (flowPath[current] === "Slack") {
              console.log("Executing Slack action for workflow:", flow.id);
              console.log("Slack config:", {
                hasAccessToken: !!flow.slackAccessToken,
                channels: flow.slackChannels,
                template: flow.slackTemplate,
              });

              const channels = flow.slackChannels.map((channel: string) => ({
                label: "",
                value: channel,
              }));
              await postMessageToSlack(
                flow.slackAccessToken!,
                channels,
                flow.slackTemplate!
              );
              console.log("Slack message sent successfully");
              flowPath.splice(current, 1);
              continue;
            }

            if (flowPath[current] === "Notion") {
              await onCreateNewPageInDatabase(
                flow.notionDbId!,
                flow.notionAccessToken!,
                JSON.parse(flow.notionTemplate!)
              );
              flowPath.splice(current, 1);
              continue;
            }

            if (flowPath[current] === "Wait") {
              try {
                const res = await axios.put(
                  "https://api.cron-job.org/jobs",
                  {
                    job: {
                      url: `${process.env.NGROK_URI}?flow_id=${flow.id}`,
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
                  const cronPath = await db.workflows.update({
                    where: { id: flow.id },
                    data: { cronPath: JSON.stringify(flowPath) },
                  });
                  if (cronPath) break;
                }
              } catch (err) {
                console.error("Failed to create cron wait job", err);
              }
              break;
            }

            current++;
          }

          await db.user.update({
            where: { clerkId: user.clerkId },
            data: { credits: `${parseInt(user.credits!) - 1}` },
          });
        })
      );
    } catch (err) {
      console.error("Drive notification processing failed", err);
    }
  })();

  return ack;
}

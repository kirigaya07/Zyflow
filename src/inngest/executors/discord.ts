import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { db } from "@/lib/db";
import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

export class DiscordExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    // Prefer metadata config, fall back to workflow-level columns
    const template = (metadata.template as string) || ctx.workflow.discordTemplate || null;

    let url = (metadata.webhookUrl as string) || null;
    if (!url) {
      const hook = await db.discordWebhook.findFirst({
        where: { userId: ctx.userId },
        select: { url: true },
      });
      url = hook?.url ?? null;
    }

    if (!url || !template) {
      return [{ json: { skipped: true, reason: "No webhook URL or template configured" } }];
    }

    const result = await postContentToWebHook(template, url);

    return [
      {
        json: {
          success: result.message === "success",
          message: result.message,
        },
      },
    ];
  }
}

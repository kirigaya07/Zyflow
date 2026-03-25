import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { safeDecrypt } from "@/lib/encryption";
import { interpolate } from "../expressions";
import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

export class SlackExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    // Prefer metadata config, fall back to workflow-level columns
    const rawToken = (metadata.slackAccessToken as string) || ctx.workflow.slackAccessToken;
    const template = (metadata.template as string) || ctx.workflow.slackTemplate;

    const metaChannels = metadata.channels as { label: string; value: string }[] | undefined;
    const fallbackChannels = ctx.workflow.slackChannels.map((ch) => ({ label: ch, value: ch }));
    const channels = metaChannels?.length ? metaChannels : fallbackChannels;

    if (!rawToken || !channels.length || !template) {
      return [{ json: { skipped: true, reason: "Incomplete Slack configuration" } }];
    }

    const message = interpolate(template, ctx.nodeOutputs, ctx.triggerPayload);
    const result = await postMessageToSlack(safeDecrypt(rawToken), channels, message);

    return [
      {
        json: {
          success: result.message === "Success",
          message: result.message,
        },
      },
    ];
  }
}

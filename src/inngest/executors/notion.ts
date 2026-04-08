import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { safeDecrypt } from "@/lib/encryption";
import { interpolate } from "../expressions";
import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

export class NotionExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    const rawToken = (metadata.accessToken as string) || ctx.workflow.notionAccessToken;
    const databaseId = (metadata.databaseId as string) || ctx.workflow.notionDbId || undefined;

    const content = interpolate(
      (metadata.content as string) || ctx.workflow.notionTemplate || "New Entry",
      ctx.nodeOutputs,
      ctx.triggerPayload
    );

    if (!rawToken) {
      return [{ json: { skipped: true, reason: "No Notion access token configured" } }];
    }

    const page = await onCreateNewPageInDatabase(safeDecrypt(rawToken), content, databaseId || undefined);

    return [{ json: { success: true, content, pageId: page?.id } }];
  }
}

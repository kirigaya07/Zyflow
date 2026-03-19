import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { safeDecrypt } from "@/lib/encryption";
import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

export class NotionExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    // Prefer metadata config, fall back to workflow-level columns
    const rawToken = (metadata.accessToken as string) || ctx.workflow.notionAccessToken;
    const databaseId = (metadata.databaseId as string) || ctx.workflow.notionDbId;

    let pageTitle = (metadata.pageTitle as string) || null;
    if (!pageTitle && ctx.workflow.notionTemplate) {
      try {
        const parsed = JSON.parse(ctx.workflow.notionTemplate);
        pageTitle = typeof parsed === "string" ? parsed : parsed.name ?? "New Entry";
      } catch {
        pageTitle = ctx.workflow.notionTemplate;
      }
    }
    pageTitle = pageTitle || "New Entry";

    if (!rawToken || !databaseId) {
      return [{ json: { skipped: true, reason: "Incomplete Notion configuration" } }];
    }

    await onCreateNewPageInDatabase(databaseId, safeDecrypt(rawToken), pageTitle);

    return [{ json: { success: true, databaseId, pageTitle } }];
  }
}

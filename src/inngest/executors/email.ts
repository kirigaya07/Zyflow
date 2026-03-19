import { sendEmailToMultipleRecipientsViaGmail } from "@/app/(main)/(pages)/connections/_actions/email-connection";
import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

export class EmailExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    // Prefer metadata config, fall back to workflow-level columns
    const recipients =
      (metadata.recipients as string[]) ||
      (ctx.workflow.emailRecipients.length ? ctx.workflow.emailRecipients : null);
    const subject =
      (metadata.subject as string) || ctx.workflow.emailSubject || "Workflow Notification";
    const body =
      (metadata.body as string) || ctx.workflow.emailTemplate || "A workflow event occurred.";

    if (!recipients?.length) {
      return [{ json: { skipped: true, reason: "No recipients configured" } }];
    }

    await sendEmailToMultipleRecipientsViaGmail(recipients, subject, body, ctx.userId);

    return [{ json: { success: true, recipients, subject } }];
  }
}

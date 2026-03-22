import { sendEmailToMultipleRecipientsViaGmail } from "@/app/(main)/(pages)/connections/_actions/email-connection";
import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";
import { interpolate } from "../expressions";

export class EmailExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    const rawRecipients =
      (metadata.recipients as string[]) ||
      (ctx.workflow.emailRecipients.length ? ctx.workflow.emailRecipients : null);

    const recipients = rawRecipients?.map((r) =>
      interpolate(r, ctx.nodeOutputs, ctx.triggerPayload)
    );

    const subject = interpolate(
      (metadata.subject as string) || ctx.workflow.emailSubject || "Workflow Notification",
      ctx.nodeOutputs,
      ctx.triggerPayload
    );
    const body = interpolate(
      (metadata.body as string) || ctx.workflow.emailTemplate || "A workflow event occurred.",
      ctx.nodeOutputs,
      ctx.triggerPayload
    );

    if (!recipients?.length) {
      return [{ json: { skipped: true, reason: "No recipients configured" } }];
    }

    await sendEmailToMultipleRecipientsViaGmail(recipients, subject, body, ctx.userId);

    return [{ json: { success: true, recipients, subject } }];
  }
}

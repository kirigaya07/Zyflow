export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { executeWorkflowDirect } from "@/lib/execute-workflow";

/** Max allowed POST body size: 1 MB */
const MAX_PAYLOAD_BYTES = 1 * 1024 * 1024;

/** UUID v4 shape */
const uuidSchema = z.string().uuid("workflowId must be a valid UUID");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  try {
    const { workflowId: rawWorkflowId } = await params;

    // Validate workflowId format
    const parsedId = uuidSchema.safeParse(rawWorkflowId);
    if (!parsedId.success) {
      return NextResponse.json(
        { error: "Invalid workflowId: must be a valid UUID" },
        { status: 400 }
      );
    }
    const workflowId = parsedId.data;

    // Enforce max payload size using Content-Length header as a fast-path check
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large (max 1 MB)" },
        { status: 413 }
      );
    }

    const workflow = await db.workflows.findUnique({
      where: { id: workflowId },
      select: { id: true, publish: true },
    });

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    if (!workflow.publish) {
      return NextResponse.json({ error: "Workflow is not published" }, { status: 400 });
    }

    // Read raw body and enforce size limit precisely
    const bodyText = await req.text().catch(() => "");
    if (Buffer.byteLength(bodyText, "utf8") > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload too large (max 1 MB)" },
        { status: 413 }
      );
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = bodyText ? JSON.parse(bodyText) : {};
    } catch {
      if (bodyText) payload = { raw: bodyText };
    }

    const result = await executeWorkflowDirect(workflowId, payload);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, runId: result.runId },
        { status: 422 }
      );
    }

    return NextResponse.json({ received: true, workflowId, runId: result.runId });
  } catch (err) {
    // Log full detail server-side, but don't leak internals to the caller.
    console.error("[webhook] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId: rawWorkflowId } = await params;

  const parsedId = uuidSchema.safeParse(rawWorkflowId);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Invalid workflowId: must be a valid UUID" },
      { status: 400 }
    );
  }
  const workflowId = parsedId.data;

  const workflow = await db.workflows.findUnique({
    where: { id: workflowId },
    select: { id: true, publish: true, name: true },
  });

  if (!workflow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    workflowId,
    name: workflow.name,
    published: workflow.publish,
    webhookUrl: `/api/webhooks/${workflowId}`,
  });
}

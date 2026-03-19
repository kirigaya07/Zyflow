export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;

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

  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    const text = await req.text().catch(() => "");
    if (text) payload = { raw: text };
  }

  await inngest.send({
    name: "workflow/trigger",
    data: { workflowId, source: "webhook", payload },
  });

  return NextResponse.json({ received: true, workflowId });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await params;
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

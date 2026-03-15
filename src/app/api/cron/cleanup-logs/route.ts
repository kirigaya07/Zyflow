import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const webhookCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const logCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [webhookResult, logResult] = await Promise.all([
    db.webhookEvent.deleteMany({ where: { processedAt: { lt: webhookCutoff } } }),
    db.executionLog.deleteMany({ where: { createdAt: { lt: logCutoff } } }),
  ]);

  return NextResponse.json({
    webhookEventsDeleted: webhookResult.count,
    executionLogsDeleted: logResult.count,
  });
}

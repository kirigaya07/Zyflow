export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";

export async function POST(req: Request) {
  // ── Verify Svix signature ────────────────────────────────────────────────
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new NextResponse("Webhook secret not configured", { status: 500 });
  }

  const headersList = await headers();
  const svixId        = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse("Missing svix headers", { status: 400 });
  }

  const payload = await req.text();

  const wh = new Webhook(WEBHOOK_SECRET);
  let body: Record<string, unknown>;
  try {
    body = wh.verify(payload, {
      "svix-id":        svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as Record<string, unknown>;
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new NextResponse("Invalid signature", { status: 401 });
  }

  // ── Process event ────────────────────────────────────────────────────────
  const eventType = body.type as string;

  if (eventType === "user.created" || eventType === "user.updated") {
    const data = body.data as Record<string, unknown>;

    const id = data.id as string;
    const emailAddresses = data.email_addresses as { email_address: string }[];
    const email = emailAddresses?.[0]?.email_address;

    if (!id || !email) {
      return new NextResponse("Missing user id or email", { status: 400 });
    }

    const firstName  = (data.first_name  as string) || "";
    const lastName   = (data.last_name   as string) || "";
    const fullName   = [firstName, lastName].filter(Boolean).join(" ");
    const profileImage =
      (data.profile_image_url as string) ||
      (data.image_url         as string) || "";

    try {
      const user = await db.user.upsert({
        where:  { clerkId: id },
        update: { email, name: fullName, profileImage },
        create: {
          clerkId: id,
          email,
          name: fullName,
          profileImage,
          tier:    "Free",
          credits: "10",
        },
      });
      console.log(`User ${eventType === "user.created" ? "created" : "updated"}:`, user.id);
    } catch (err) {
      console.error("DB error:", err);
      return new NextResponse("Database error", { status: 500 });
    }
  }

  return new NextResponse("OK", { status: 200 });
}

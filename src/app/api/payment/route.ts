export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";

// Stripe payments are temporarily disabled
export async function GET(_req: NextRequest) {
  return NextResponse.json([]);
}

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { error: "Payments are not available yet" },
    { status: 503 }
  );
}

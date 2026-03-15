export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";

// Stripe payments are temporarily disabled
export async function GET(req: NextRequest) {
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "Payments are not available yet" },
    { status: 503 }
  );
}

/**
 * GET /api/mcp/token
 *
 * Returns the MCP API key for the currently authenticated Clerk user.
 * This key is used as the Bearer token when connecting to /api/mcp.
 */

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { deriveApiKey } from "../route";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = deriveApiKey(userId);
  const serverUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/mcp`;

  return NextResponse.json({
    apiKey,
    serverUrl,
    claudeConfig: {
      mcpServers: {
        zyflow: {
          url: serverUrl,
          headers: { Authorization: `Bearer ${apiKey}` },
        },
      },
    },
  });
}

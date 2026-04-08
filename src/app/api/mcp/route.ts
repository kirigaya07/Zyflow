/**
 * Zyflow MCP Server — exposes every published workflow as a callable tool.
 *
 * Protocol: JSON-RPC 2.0 over HTTP POST (MCP Streamable HTTP transport)
 *
 * Authentication
 *   Pass your API key in the Authorization header:
 *     Authorization: Bearer <apiKey>
 *   Get your key at GET /api/mcp/token (requires Clerk session).
 *
 * Claude Desktop config (~/.claude/claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "zyflow": {
 *         "url": "https://your-domain.com/api/mcp",
 *         "headers": { "Authorization": "Bearer <apiKey>" }
 *       }
 *     }
 *   }
 *
 * Supported MCP methods:
 *   initialize            — handshake (no auth required)
 *   notifications/*       — ignored gracefully
 *   tools/list            — list all published workflows as tools
 *   tools/call            — trigger a workflow by its ID
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { executeWorkflowDirect } from "@/lib/execute-workflow";

/* ── Key derivation ───────────────────────────────────────────────────────── */

/**
 * Derives a self-contained API key that embeds the userId.
 * Format: base64url( userId + ":" + HMAC-SHA256(userId) )
 * This allows O(1) verification without scanning all users.
 */
export function deriveApiKey(userId: string): string {
  const secret = process.env.ENCRYPTION_KEY ?? "fallback-secret";
  const hmac = createHmac("sha256", secret).update(userId).digest("hex");
  return Buffer.from(`${userId}:${hmac}`).toString("base64url");
}

/* ── Auth ─────────────────────────────────────────────────────────────────── */

async function authenticate(req: NextRequest): Promise<string | null> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const colonIdx = decoded.indexOf(":");
    if (colonIdx === -1) return null;

    const userId = decoded.slice(0, colonIdx);
    const providedHmac = decoded.slice(colonIdx + 1);
    const expectedHmac = createHmac(
      "sha256",
      process.env.ENCRYPTION_KEY ?? "fallback-secret"
    ).update(userId).digest("hex");

    if (providedHmac !== expectedHmac) return null;

    // Confirm user still exists in DB
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { clerkId: true },
    });
    return user?.clerkId ?? null;
  } catch {
    return null;
  }
}

/* ── JSON-RPC helpers ─────────────────────────────────────────────────────── */

type JsonRpcId = string | number | null;

function ok(id: JsonRpcId, result: unknown) {
  return NextResponse.json(
    { jsonrpc: "2.0", id, result },
    { headers: { "Content-Type": "application/json" } }
  );
}

function err(id: JsonRpcId, code: number, message: string) {
  return NextResponse.json(
    { jsonrpc: "2.0", id, error: { code, message } },
    { headers: { "Content-Type": "application/json" } }
  );
}

/* ── Request handler ─────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err(null, -32700, "Parse error");
  }

  const { method, params, id = null } = body as {
    method: string;
    params?: Record<string, unknown>;
    id?: JsonRpcId;
  };

  /* ── initialize — no auth needed ──────────────────────────────────────── */
  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      serverInfo: { name: "zyflow", version: "1.0.0" },
      capabilities: { tools: {} },
    });
  }

  /* ── notifications — fire-and-forget, always 200 ──────────────────────── */
  if (method.startsWith("notifications/")) {
    return new NextResponse(null, { status: 202 });
  }

  /* ── All other methods require auth ────────────────────────────────────── */
  const userId = await authenticate(req);
  if (!userId) return err(id, -32001, "Unauthorized — provide a valid Bearer token");

  /* ── tools/list ────────────────────────────────────────────────────────── */
  if (method === "tools/list") {
    const workflows = await db.workflows.findMany({
      where: { userId, publish: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });

    return ok(id, {
      tools: workflows.map((wf) => ({
        name: wf.id,
        description: `${wf.name}${wf.description ? ` — ${wf.description}` : ""}`,
        inputSchema: {
          type: "object",
          properties: {
            payload: {
              type: "object",
              description:
                "JSON data passed to the workflow trigger. Access fields via {{ trigger.fieldName }} in node config.",
              additionalProperties: true,
            },
          },
        },
      })),
    });
  }

  /* ── tools/call ────────────────────────────────────────────────────────── */
  if (method === "tools/call") {
    const toolName = (params?.name as string) ?? "";
    const args = (params?.arguments as Record<string, unknown>) ?? {};
    const payload = (args.payload as Record<string, unknown>) ?? args;

    const workflow = await db.workflows.findUnique({
      where: { id: toolName, userId, publish: true },
      select: { id: true, name: true },
    });

    if (!workflow) {
      return ok(id, {
        content: [{ type: "text", text: `Error: workflow "${toolName}" not found or not published.` }],
        isError: true,
      });
    }

    const result = await executeWorkflowDirect(workflow.id, payload);

    return ok(id, {
      content: [
        {
          type: "text",
          text: result.success
            ? `✓ Workflow "${workflow.name}" completed. Run ID: ${result.runId}`
            : `✗ Workflow "${workflow.name}" failed: ${result.error}`,
        },
      ],
      isError: !result.success,
    });
  }

  return err(id, -32601, `Method not found: ${method}`);
}

/* ── OPTIONS — CORS preflight ─────────────────────────────────────────────── */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

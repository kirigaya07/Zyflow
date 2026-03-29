/**
 * MCP Client executor — calls a tool on any HTTP-based MCP server.
 *
 * Config (node metadata):
 *   serverUrl  — full URL of the MCP server  (e.g. https://example.com/api/mcp)
 *   apiKey     — Bearer token for auth (optional)
 *   toolName   — name of the tool to call
 *   toolInput  — JSON string or object passed as tool arguments
 */

import { interpolate, interpolateObject } from "../expressions";
import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

export class McpClientExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    const serverUrl = interpolate(
      (metadata.serverUrl as string) || "",
      ctx.nodeOutputs,
      ctx.triggerPayload
    ).trim();

    const toolName = interpolate(
      (metadata.toolName as string) || "",
      ctx.nodeOutputs,
      ctx.triggerPayload
    ).trim();

    if (!serverUrl || !toolName) {
      return [{ json: { skipped: true, reason: "MCP server URL and tool name are required" } }];
    }

    // Parse toolInput — accepts a JSON string or uses the raw metadata object
    let toolArguments: Record<string, unknown> = {};
    const rawInput = metadata.toolInput as string | Record<string, unknown> | undefined;
    if (typeof rawInput === "string" && rawInput.trim()) {
      const interpolated = interpolate(rawInput, ctx.nodeOutputs, ctx.triggerPayload);
      try {
        toolArguments = JSON.parse(interpolated);
      } catch {
        toolArguments = { input: interpolated };
      }
    } else if (rawInput && typeof rawInput === "object") {
      toolArguments = interpolateObject(
        rawInput as Record<string, unknown>,
        ctx.nodeOutputs,
        ctx.triggerPayload
      );
    }

    const apiKey = (metadata.apiKey as string) || "";

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    // Step 1 — initialize (required by the MCP protocol)
    const initRes = await fetch(serverUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          clientInfo: { name: "zyflow-workflow", version: "1.0.0" },
          capabilities: {},
        },
      }),
    });

    if (!initRes.ok) {
      return [{ json: { success: false, error: `MCP server returned ${initRes.status}` } }];
    }

    // Step 2 — call the tool
    const callRes = await fetch(serverUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: toolName, arguments: toolArguments },
      }),
    });

    const data = await callRes.json() as {
      result?: { content?: { type: string; text: string }[]; isError?: boolean };
      error?: { message: string };
    };

    if (data.error) {
      return [{ json: { success: false, error: data.error.message } }];
    }

    const content = data.result?.content ?? [];
    const isError = data.result?.isError ?? false;
    const text = content.map((c) => c.text).join("\n");

    return [{
      json: {
        success: !isError,
        output: text,
        content,
        toolName,
        serverUrl,
      },
    }];
  }
}

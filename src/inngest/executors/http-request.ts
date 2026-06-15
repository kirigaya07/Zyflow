import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";
import { assertSafeUrl } from "@/lib/ssrf";

/**
 * HTTP Request executor — call any external API.
 * This is the most powerful node: it unlocks any service that has an HTTP API.
 *
 * Metadata fields:
 *   url      - required, the endpoint to call
 *   method   - GET | POST | PUT | PATCH | DELETE (default: GET)
 *   headers  - key/value pairs
 *   body     - JSON body for POST/PUT/PATCH
 *   auth     - { type: "bearer" | "basic", token: "..." }
 */
export class HttpRequestExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    const url = metadata.url as string | undefined;
    if (!url) {
      return [{ json: { skipped: true, reason: "No URL configured" } }];
    }

    // Guard against SSRF — reject internal/private targets before fetching.
    const safeUrl = await assertSafeUrl(url);

    const method = ((metadata.method as string) || "GET").toUpperCase();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(metadata.headers as Record<string, string> | undefined),
    };

    // Auth
    const auth = metadata.auth as { type: string; token: string } | undefined;
    if (auth?.type === "bearer" && auth.token) {
      headers["Authorization"] = `Bearer ${auth.token}`;
    } else if (auth?.type === "basic" && auth.token) {
      headers["Authorization"] = `Basic ${Buffer.from(auth.token).toString("base64")}`;
    }

    const bodyAllowed = ["POST", "PUT", "PATCH"].includes(method);
    const body = bodyAllowed && metadata.body
      ? JSON.stringify(metadata.body)
      : undefined;

    const response = await fetch(safeUrl, { method, headers, body });

    let responseData: unknown;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status} ${response.statusText}: ${JSON.stringify(responseData)}`
      );
    }

    return [
      {
        json: {
          statusCode: response.status,
          data: responseData,
          headers: Object.fromEntries(response.headers.entries()),
        },
      },
    ];
  }
}

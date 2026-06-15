import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";
import vm from "node:vm";

/**
 * Code executor — run user-supplied JavaScript to transform data.
 *
 * The user's code receives `$input` (Item[]), `$trigger` (trigger payload) and
 * `$nodeOutputs`, and must `return` a value which becomes the output Item[].
 *
 * Example code:
 *   return $input.map(item => ({
 *     json: { ...item.json, uppercased: item.json.name?.toUpperCase() }
 *   }));
 *
 * ── Security note ──────────────────────────────────────────────────────────
 * Node's `vm` module is NOT a hardened security boundary. The well-known way
 * to break out is to reach the host realm's `Function` constructor through a
 * leaked host object, e.g. `({}).constructor.constructor("return process")()`.
 * To close that vector we pass NOTHING but primitive strings across the
 * boundary: inputs go in as JSON and are parsed *inside* the context, and the
 * result/logs come back out as JSON. As a result every object the user code
 * touches belongs to the sandbox realm, where `process`, `require`, etc. are
 * undefined. A `timeout` bounds CPU time.
 *
 * This is defense-in-depth, not a perfect jail. For untrusted multi-tenant
 * code, run this executor in an isolated worker/process or `isolated-vm`.
 */
export class CodeExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;
    const code = metadata.code as string | undefined;

    if (!code?.trim()) {
      return [{ json: { skipped: true, reason: "No code provided" } }];
    }

    // Serialise everything to primitive strings — never hand a host object or
    // function to the sandbox, or its prototype chain becomes an escape hatch.
    const safeStringify = (value: unknown): string => {
      try {
        return JSON.stringify(value ?? null) ?? "null";
      } catch {
        return "null";
      }
    };

    const sandbox: {
      __inputJson: string;
      __triggerJson: string;
      __nodeOutputsJson: string;
      __resultJson: string;
      __logsJson: string;
    } = {
      __inputJson: safeStringify(input),
      __triggerJson: safeStringify(ctx.triggerPayload),
      __nodeOutputsJson: safeStringify(Object.fromEntries(ctx.nodeOutputs)),
      __resultJson: "null",
      __logsJson: "[]",
    };

    // The user code body is wrapped so that:
    //  - inputs are reconstructed from JSON inside the sandbox realm
    //  - console buffers into an in-sandbox array (no host function passed in)
    //  - the return value and logs are handed back as JSON strings only
    const wrappedCode = `
      "use strict";
      const $input = JSON.parse(__inputJson);
      const $trigger = JSON.parse(__triggerJson);
      const $nodeOutputs = JSON.parse(__nodeOutputsJson);
      const __logs = [];
      const console = {
        log: (...args) => { __logs.push(args.map(a => typeof a === "string" ? a : JSON.stringify(a)).join(" ")); },
        error: (...args) => { __logs.push(args.map(a => typeof a === "string" ? a : JSON.stringify(a)).join(" ")); },
      };
      const __userFn = function () { ${code} };
      const __ret = __userFn();
      __resultJson = JSON.stringify(__ret === undefined ? null : __ret);
      __logsJson = JSON.stringify(__logs);
    `;

    const context = vm.createContext(sandbox, {
      codeGeneration: { strings: true, wasm: false },
    });
    vm.runInContext(wrappedCode, context, {
      timeout: 5000, // 5 second CPU limit
      filename: `code-node-${config.nodeId}.js`,
    });

    // Surface buffered logs on the host side.
    try {
      const logs = JSON.parse(sandbox.__logsJson) as string[];
      for (const line of logs) console.log("[Code node]", line);
    } catch {
      // ignore malformed log buffer
    }

    let rawResult: unknown;
    try {
      rawResult = JSON.parse(sandbox.__resultJson);
    } catch {
      rawResult = null;
    }

    // Normalize output to Item[]
    if (Array.isArray(rawResult)) {
      return rawResult.map((r) =>
        r && typeof r === "object" && "json" in r
          ? (r as Item)
          : { json: r as Record<string, unknown> }
      );
    }

    if (rawResult && typeof rawResult === "object") {
      return [{ json: rawResult as Record<string, unknown> }];
    }

    return [{ json: { output: rawResult } }];
  }
}

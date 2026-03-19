import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";
import vm from "node:vm";

/**
 * Code executor — run sandboxed JavaScript to transform data.
 *
 * The user's code receives `$input` (Item[]) and `$trigger` (trigger payload)
 * and must return a value which becomes the output Item[].
 *
 * Example code:
 *   return $input.map(item => ({
 *     json: { ...item.json, uppercased: item.json.name?.toUpperCase() }
 *   }));
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

    const sandbox = {
      $input: input,
      $trigger: ctx.triggerPayload,
      $nodeOutputs: Object.fromEntries(ctx.nodeOutputs),
      console: {
        log: (...args: unknown[]) => console.log("[Code node]", ...args),
        error: (...args: unknown[]) => console.error("[Code node]", ...args),
      },
      result: undefined as unknown,
    };

    // Wrap user code so they can `return` at the top level
    const wrappedCode = `result = (function() { ${code} })();`;

    const context = vm.createContext(sandbox);
    vm.runInContext(wrappedCode, context, {
      timeout: 5000, // 5 second limit
      filename: `code-node-${config.nodeId}.js`,
    });

    const rawResult = sandbox.result;

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

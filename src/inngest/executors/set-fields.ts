import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

type FieldMapping = {
  /** Output field name */
  field: string;
  /** Value — may contain {{ expression }} syntax (already resolved by the time we run) */
  value: string;
};

/**
 * Set Fields executor — adds, overwrites, or replaces fields on each item.
 *
 * metadata.mode:     "merge"   (default) — keeps existing fields, sets/overwrites specified ones
 *                    "replace" — discards all incoming fields, outputs only the specified ones
 * metadata.mappings: FieldMapping[] — list of { field, value } pairs
 */
export class SetFieldsExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    _ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;
    const mode = (metadata.mode as string) || "merge";
    const mappings = (metadata.mappings as FieldMapping[]) || [];

    if (!mappings.length) {
      // Nothing to set — pass items through unchanged
      return input;
    }

    return input.map((item) => {
      const base = mode === "replace" ? {} : { ...item.json };

      for (const { field, value } of mappings) {
        if (!field.trim()) continue;

        // Try to parse numeric / boolean literals; otherwise keep as string
        let parsed: unknown = value;
        if (value === "true") parsed = true;
        else if (value === "false") parsed = false;
        else if (value !== "" && !isNaN(Number(value))) parsed = Number(value);

        // Support dot-notation for nested fields (e.g. "user.name")
        const parts = field.trim().split(".");
        if (parts.length === 1) {
          (base as Record<string, unknown>)[field.trim()] = parsed;
        } else {
          let cursor: Record<string, unknown> = base as Record<string, unknown>;
          for (let i = 0; i < parts.length - 1; i++) {
            const key = parts[i];
            if (typeof cursor[key] !== "object" || cursor[key] === null) {
              cursor[key] = {};
            }
            cursor = cursor[key] as Record<string, unknown>;
          }
          cursor[parts[parts.length - 1]] = parsed;
        }
      }

      return { json: base as Record<string, unknown> };
    });
  }
}

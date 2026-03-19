import type { Item } from "./types";

/**
 * Expression system — Phase 3.
 *
 * Syntax: {{ nodeId.fieldPath }} or {{ trigger.fieldPath }}
 *
 * Examples:
 *   "Hello {{ trigger.fileName }}"
 *   "AI said: {{ ai_node_abc.output }}"
 *   "Status: {{ http_node_xyz.data.status }}"
 */
export function interpolate(
  template: string,
  nodeOutputs: Map<string, Item[]>,
  triggerPayload: Record<string, unknown>
): string {
  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expr: string) => {
    const parts = expr.trim().split(".");
    const [source, ...path] = parts;

    let root: unknown;
    if (source === "trigger") {
      root = triggerPayload;
    } else {
      const items = nodeOutputs.get(source);
      root = items?.[0]?.json;
    }

    if (root === undefined || root === null) return match;

    const value = path.reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object") {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, root);

    return value !== undefined && value !== null ? String(value) : match;
  });
}

/**
 * Recursively interpolate all string values in an object.
 */
export function interpolateObject(
  obj: Record<string, unknown>,
  nodeOutputs: Map<string, Item[]>,
  triggerPayload: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === "string") {
      result[key] = interpolate(val, nodeOutputs, triggerPayload);
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      result[key] = interpolateObject(
        val as Record<string, unknown>,
        nodeOutputs,
        triggerPayload
      );
    } else {
      result[key] = val;
    }
  }
  return result;
}

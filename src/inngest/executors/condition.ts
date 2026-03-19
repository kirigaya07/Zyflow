import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";

/**
 * Condition executor — evaluates a simple expression against input data.
 * Returns items tagged with which branch matched (true/false).
 * The workflow engine uses the "branch" field to decide which path to follow.
 */
export class ConditionExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    const field = metadata.field as string | undefined;
    const operator = (metadata.operator as string) || "equals";
    const value = metadata.value;

    if (!field) {
      return input.map((item) => ({ json: { ...item.json, _branch: "true" } }));
    }

    return input.map((item) => {
      const fieldValue = getNestedValue(item.json, field);
      const matches = evaluate(fieldValue, operator, value);
      return { json: { ...item.json, _branch: matches ? "true" : "false" } };
    });
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function evaluate(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case "equals":       return actual === expected;
    case "not_equals":   return actual !== expected;
    case "contains":     return String(actual).includes(String(expected));
    case "starts_with":  return String(actual).startsWith(String(expected));
    case "ends_with":    return String(actual).endsWith(String(expected));
    case "greater_than": return Number(actual) > Number(expected);
    case "less_than":    return Number(actual) < Number(expected);
    case "exists":       return actual !== undefined && actual !== null;
    default:             return false;
  }
}

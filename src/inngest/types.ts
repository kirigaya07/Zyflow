/**
 * Core types for the Zyflow workflow execution engine.
 *
 * Every node receives an array of Items from the previous node and
 * produces an array of Items for the next node — same model as n8n.
 */

/** The fundamental data unit flowing between nodes */
export type Item = {
  json: Record<string, unknown>;
};

/** Per-node configuration extracted from the canvas node's metadata */
export type NodeConfig = {
  nodeId: string;
  nodeType: string;
  metadata: Record<string, unknown>;
};

/**
 * Workflow column data passed to executors as a fallback when node.data.metadata
 * doesn't have the config yet (backwards compatibility with existing workflows).
 */
export type WorkflowFallbackData = {
  discordTemplate: string | null;
  slackTemplate: string | null;
  slackAccessToken: string | null;
  slackChannels: string[];
  notionTemplate: string | null;
  notionAccessToken: string | null;
  notionDbId: string | null;
  emailTemplate: string | null;
  emailRecipients: string[];
  emailSubject: string | null;
};

/** Execution context shared across all nodes in a single run */
export type ExecutionContext = {
  workflowId: string;
  runId: string;
  userId: string;
  triggerPayload: Record<string, unknown>;
  /** Accumulated outputs keyed by nodeId — used by expression system */
  nodeOutputs: Map<string, Item[]>;
  /** Workflow-level column values for backwards-compatible fallback in executors */
  workflow: WorkflowFallbackData;
};

/** Every node executor implements this interface */
export interface NodeExecutor {
  execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]>;
}

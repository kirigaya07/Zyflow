import type { NodeExecutor } from "./types";
import { DiscordExecutor } from "./executors/discord";
import { SlackExecutor } from "./executors/slack";
import { NotionExecutor } from "./executors/notion";
import { EmailExecutor } from "./executors/email";
import { AIExecutor } from "./executors/ai";
import { ConditionExecutor } from "./executors/condition";
import { HttpRequestExecutor } from "./executors/http-request";
import { CodeExecutor } from "./executors/code";
import { SetFieldsExecutor } from "./executors/set-fields";
import { GoogleSheetsExecutor } from "./executors/google-sheets";
import { McpClientExecutor } from "./executors/mcp-client";

/**
 * Registry mapping canvas node types to their executors.
 * Adding a new node type = add an entry here.
 */
export const executorRegistry: Record<string, NodeExecutor> = {
  Discord:          new DiscordExecutor(),
  Slack:            new SlackExecutor(),
  Notion:           new NotionExecutor(),
  Email:            new EmailExecutor(),
  AI:               new AIExecutor(),
  Condition:        new ConditionExecutor(),
  "HTTP Request":   new HttpRequestExecutor(),
  Code:             new CodeExecutor(),
  "Set Fields":     new SetFieldsExecutor(),
  "Google Sheets":  new GoogleSheetsExecutor(),
  MCP:              new McpClientExecutor(),
};

/** Node types that are handled specially by the engine (not via executorRegistry) */
export const SPECIAL_NODES = new Set(["Wait", "Google Drive", "Trigger", "Webhook Trigger", "Cron Trigger"]);

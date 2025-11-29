/**
 * Type Definitions and Validation Schemas
 *
 * This module contains all TypeScript type definitions and Zod validation schemas
 * used throughout the Zyflow application. Includes editor types, connection types,
 * and form validation schemas.
 */

import { ConnectionProviderProps } from "@/providers/connections-provider";
import { z } from "zod";

/**
 * Zod validation schema for user profile editing form.
 * Ensures email format validation and required name field.
 */
export const EditUserProfileSchema = z.object({
  email: z.string().email("Required"),
  name: z.string().min(1, "Required"),
});

/**
 * Zod validation schema for workflow creation and editing form.
 * Validates workflow name and description requirements.
 */
export const WorkflowFormSchema = z.object({
  name: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
});

/**
 * Union type for all supported connection/integration types.
 * Defines the available third-party services that can be integrated.
 */
export type ConnectionTypes =
  | "Google Drive"
  | "Notion"
  | "Slack"
  | "Discord"
  | "Email"
  | "Zoom";

/**
 * Connection configuration interface for service integrations.
 * Defines the structure for each available connection type.
 */
export type Connection = {
  /** Display title of the connection service */
  title: ConnectionTypes;
  /** Brief description of what the connection does */
  description: string;
  /** Path to the service icon/logo image */
  image: string;
  /** Key reference for the connection in the provider state */
  connectionKey: keyof ConnectionProviderProps;
  /** Optional token field name for authentication */
  accessTokenKey?: string;
  /** Whether the connection is always considered active */
  alwaysTrue?: boolean;
  /** Special handling flag for Slack-specific features */
  slackSpecial?: boolean;
};

/**
 * Union type for all available editor canvas node types.
 * Defines the different kinds of workflow nodes that can be placed in the editor.
 */
export type EditorCanvasTypes =
  | "Email"
  | "Zoom"
  | "Condition"
  | "AI"
  | "Slack"
  | "Google Drive"
  | "Notion"
  | "Custom Webhook"
  | "Google Calendar"
  | "Trigger"
  | "Action"
  | "Wait";

/**
 * Interface for editor canvas card/node configuration.
 * Represents the data structure for individual workflow nodes in the editor.
 */
export type EditorCanvasCardType = {
  /** Display title of the node */
  title: string;
  /** Description of what the node does */
  description: string;
  /** Whether the node configuration is complete */
  completed: boolean;
  /** Whether the node is currently being executed */
  current: boolean;
  /** Additional metadata and configuration data for the node */
  metadata: any;
  /** The type/category of the node */
  type: EditorCanvasTypes;
};

/**
 * Interface for editor workflow nodes with positioning and data.
 * Extends the canvas card type with spatial and identification information.
 */
export type EditorNodeType = {
  /** Unique identifier for the node */
  id: string;
  /** Type of the node, matching canvas card types */
  type: EditorCanvasCardType["type"];
  /** Spatial position of the node in the editor canvas */
  position: {
    x: number;
    y: number;
  };
  /** Node configuration and state data */
  data: EditorCanvasCardType;
};

/**
 * Type alias for EditorNodeType for backward compatibility.
 */
export type EditorNode = EditorNodeType;

/**
 * Union type for all possible editor actions in the reducer.
 * Defines the available operations that can be performed on the editor state.
 */
export type EditorActions =
  | {
      /** Load workflow data into the editor */
      type: "LOAD_DATA";
      payload: {
        elements: EditorNode[];
        edges: {
          id: string;
          source: string;
          target: string;
        }[];
      };
    }
  | {
      /** Update existing nodes in the editor */
      type: "UPDATE_NODE";
      payload: {
        elements: EditorNode[];
      };
    }
  | { /** Redo the last undone action */ type: "REDO" }
  | { /** Undo the last action */ type: "UNDO" }
  | {
      /** Select a specific element in the editor */
      type: "SELECTED_ELEMENT";
      payload: {
        element: EditorNode;
      };
    };

/**
 * Mapping object for node types to their corresponding state keys.
 * Used to dynamically access the correct connection state based on node type.
 */
export const nodeMapper: Record<string, string> = {
  Notion: "notionNode",
  Slack: "slackNode",
  Discord: "discordNode",
  "Google Drive": "googleNode",
  Email: "emailNode",
  Zoom: "zoomNode",
};

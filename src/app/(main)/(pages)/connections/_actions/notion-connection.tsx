"use server";

/**
 * Notion Connection Actions Module
 *
 * This module handles Notion workspace integration functionality:
 * - OAuth callback processing for Notion connections
 * - Database and workspace management
 * - Page creation in Notion databases
 * - Connection status retrieval
 *
 * Features:
 * - Workspace and database connection setup
 * - Automatic page creation in databases
 * - Connection validation and management
 * - Error handling for Notion API operations
 */

import { db } from "@/lib/db";
import { encrypt, safeDecrypt } from "@/lib/encryption";
import { currentUser } from "@clerk/nextjs/server";
import { Client } from "@notionhq/client";

/**
 * Processes Notion OAuth callback and creates workspace connection.
 *
 * This function:
 * - Validates Notion access token from OAuth
 * - Prevents duplicate connections for the same workspace
 * - Creates database records for workspace and connection
 * - Stores workspace metadata (icon, name, database ID)
 *
 * @param access_token - Notion API access token from OAuth
 * @param workspace_id - Notion workspace identifier
 * @param workspace_icon - Workspace icon URL or emoji
 * @param workspace_name - Display name of the workspace
 * @param database_id - Target database ID for content creation
 * @param id - User ID from Clerk authentication
 */
export const onNotionConnect = async (
  access_token: string,
  workspace_id: string,
  workspace_icon: string,
  workspace_name: string,
  id: string
) => {
  "use server";
  if (access_token && workspace_id && workspace_name) {
    //check if notion is connected (query by userId + workspaceId, not by token)
    const notion_connected = await db.notion.findFirst({
      where: { userId: id, workspaceId: workspace_id },
    });

    if (!notion_connected) {
      await db.notion.create({
        data: {
          userId: id,
          workspaceIcon: workspace_icon || "",
          accessToken: encrypt(access_token),
          workspaceId: workspace_id,
          workspaceName: workspace_name,
          databaseId: "",
          connections: {
            connectOrCreate: {
              where: { userId_type: { userId: id, type: "Notion" } },
              create: { userId: id, type: "Notion" },
            },
          },
        },
      });
    } else {
      await db.notion.update({
        where: { id: notion_connected.id },
        data: {
          workspaceIcon: workspace_icon || "",
          accessToken: encrypt(access_token),
          workspaceName: workspace_name,
        },
      });
    }
  }
};
/**
 * Retrieves the Notion connection details for the current user.
 *
 * @returns Notion connection data (tokens, workspace info) or null if not found
 */
/**
 * Removes the Notion connection for the current user.
 */
export const disconnectNotion = async () => {
  const user = await currentUser();
  if (!user) return { error: "Not authenticated" };

  await db.notion.deleteMany({ where: { userId: user.id } });
  await db.connections.deleteMany({ where: { userId: user.id, type: "Notion" } });
  return { success: true };
};

export const getNotionConnection = async () => {
  const user = await currentUser();
  if (user) {
    const connection = await db.notion.findFirst({
      where: { userId: user.id },
    });
    if (!connection) return null;
    return {
      ...connection,
      accessToken: safeDecrypt(connection.accessToken),
    };
  }
  return null;
};

/**
 * Retrieves database schema and metadata from Notion.
 *
 * @param databaseId - Notion database ID to query
 * @param accessToken - Notion API access token
 * @returns Database metadata including properties and schema
 */
export const getNotionDatabase = async (
  databaseId: string,
  accessToken: string
) => {
  const notion = new Client({
    auth: accessToken,
  });
  const response = await notion.databases.retrieve({ database_id: databaseId });
  return response;
};

/**
 * Creates a new page in a Notion database with the specified content.
 *
 * This function:
 * - Creates Notion API client with access token
 * - Formats content for database entry
 * - Creates new page in the specified database
 * - Returns created page data
 *
 * @param databaseId - Target Notion database ID
 * @param accessToken - Notion API access token
 * @param content - Content to add to the new page
 * @returns Created page data from Notion API
 */
export const onCreateNewPageInDatabase = async (
  accessToken: string,
  content: string,
  databaseId?: string
) => {
  const notion = new Client({ auth: accessToken });

  const parent = databaseId
    ? { type: "database_id" as const, database_id: databaseId }
    : { type: "page_id" as const, page_id: "" };

  const response = await notion.pages.create({
    parent: databaseId
      ? { type: "database_id", database_id: databaseId }
      : { type: "workspace", workspace: true },
    properties: {
      title: {
        title: [{ text: { content } }],
      },
    },
  } as Parameters<typeof notion.pages.create>[0]);

  return response ?? null;
};

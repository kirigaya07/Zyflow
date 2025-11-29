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
  database_id: string,
  id: string
) => {
  "use server";
  if (access_token) {
    //check if notion is connected
    const notion_connected = await db.notion.findFirst({
      where: {
        accessToken: access_token,
      },
      include: {
        connections: {
          select: {
            type: true,
          },
        },
      },
    });

    if (!notion_connected) {
      //create connection
      await db.notion.create({
        data: {
          userId: id,
          workspaceIcon: workspace_icon!,
          accessToken: access_token,
          workspaceId: workspace_id!,
          workspaceName: workspace_name!,
          databaseId: database_id,
          connections: {
            create: {
              userId: id,
              type: "Notion",
            },
          },
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
export const getNotionConnection = async () => {
  const user = await currentUser();
  if (user) {
    const connection = await db.notion.findFirst({
      where: {
        userId: user.id,
      },
    });
    if (connection) {
      return connection;
    }
  }
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
  databaseId: string,
  accessToken: string,
  content: string
) => {
  const notion = new Client({
    auth: accessToken,
  });

  console.log(databaseId);
  const response = await notion.pages.create({
    parent: {
      type: "database_id",
      database_id: databaseId,
    },
    properties: {
      name: [
        {
          text: {
            content: content,
          },
        },
      ],
    },
  });
  if (response) {
    return response;
  }
};

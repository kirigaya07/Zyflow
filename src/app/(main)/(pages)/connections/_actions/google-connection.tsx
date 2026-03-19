"use server";

/**
 * Google Drive Connection Actions Module
 *
 * This module handles Google Drive integration functionality:
 * - OAuth token management with Clerk
 * - Google Drive API authentication
 * - File metadata retrieval and listing
 * - Drive API client configuration
 *
 * Features:
 * - Automatic OAuth token retrieval from Clerk
 * - Google Drive API v3 integration
 * - Error handling for authentication failures
 * - File listing and metadata access
 */

import { auth, clerkClient } from "@clerk/nextjs/server";
import { google } from "googleapis";

/**
 * Retrieves file metadata from user's Google Drive.
 *
 * This function:
 * - Authenticates user via Clerk OAuth tokens
 * - Creates Google Drive API client
 * - Fetches file list from user's Drive
 * - Returns file metadata for workflow integration
 *
 * @returns File metadata from Google Drive or error message
 *
 * @example
 * ```typescript
 * const files = await getFileMetaData();
 * if (files && !files.message) {
 *   console.log('Drive files:', files.files);
 * }
 * ```
 */
export const getFileMetaData = async () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.OAUTH2_REDIRECT_URI
  );

  const { userId } = await auth();

  if (!userId) {
    return { message: "User not found" };
  }

  const clerkResponse = await (
    await clerkClient()
  ).users.getUserOauthAccessToken(userId, "google");

  if (!clerkResponse || clerkResponse.data.length === 0) {
    return { message: "Google account not connected" };
  }

  const accessToken = clerkResponse.data[0].token;

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const response = await drive.files.list();

  if (response) {
    return response.data;
  }
};

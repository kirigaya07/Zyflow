"use server";

/**
 * Email Connection Actions Module
 *
 * This module handles Gmail integration for automated email sending:
 * - Single recipient email sending via Gmail API
 * - Multiple recipient email broadcasting
 * - OAuth token management with Clerk
 * - HTML email content support
 * - Error handling and validation
 *
 * Features:
 * - Uses user's Gmail account for sending (no SMTP required)
 * - Supports HTML formatted emails
 * - Automatic base64 encoding for Gmail API
 * - Comprehensive error reporting
 */

import { google } from "googleapis";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Sends an email to a single recipient using Gmail API.
 *
 * This function:
 * - Authenticates with user's Google account via Clerk
 * - Creates Gmail API client with OAuth credentials
 * - Formats email message with proper headers
 * - Encodes message for Gmail API transmission
 * - Provides detailed success/error feedback
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param content - Email body content (supports HTML)
 * @param userId - Clerk user ID for OAuth token retrieval
 * @returns Response object with success status and message ID or error details
 */
export const sendEmailViaGmail = async (
  to: string,
  subject: string,
  content: string,
  userId: string
) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    // Get user's Google OAuth token from Clerk
    const clerkResponse = await (
      await clerkClient()
    ).users.getUserOauthAccessToken(userId, "google");

    if (!clerkResponse || clerkResponse.data.length === 0) {
      return { message: "failed", error: "Google account not connected" };
    }

    const accessToken = clerkResponse.data[0].token;
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    // Create Gmail API instance
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Create email message
    const message = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      content,
    ].join("\n");

    // Encode message in base64
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send email
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log("Email sent successfully via Gmail API:", result.data.id);
    return { message: "success", messageId: result.data.id };
  } catch (error) {
    console.error("Error sending email via Gmail API:", error);
    return {
      message: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Sends an email to multiple recipients using Gmail API.
 *
 * This function:
 * - Handles bulk email sending to multiple addresses
 * - Uses comma-separated recipient list in email headers
 * - Maintains single email thread for all recipients
 * - Provides consolidated error handling
 *
 * @param recipients - Array of recipient email addresses
 * @param subject - Email subject line
 * @param content - Email body content (supports HTML)
 * @param userId - Clerk user ID for OAuth token retrieval
 * @returns Response object with success status and message ID or error details
 */
export const sendEmailToMultipleRecipientsViaGmail = async (
  recipients: string[],
  subject: string,
  content: string,
  userId: string
) => {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    // Get user's Google OAuth token from Clerk
    const clerkResponse = await (
      await clerkClient()
    ).users.getUserOauthAccessToken(userId, "google");

    if (!clerkResponse || clerkResponse.data.length === 0) {
      return { message: "failed", error: "Google account not connected" };
    }

    const accessToken = clerkResponse.data[0].token;
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    // Create Gmail API instance
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Create email message with multiple recipients
    const message = [
      `To: ${recipients.join(", ")}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      content,
    ].join("\n");

    // Encode message in base64
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send email
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(
      "Email sent to multiple recipients via Gmail API:",
      result.data.id
    );
    return { message: "success", messageId: result.data.id };
  } catch (error) {
    console.error(
      "Error sending email to multiple recipients via Gmail API:",
      error
    );
    return {
      message: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

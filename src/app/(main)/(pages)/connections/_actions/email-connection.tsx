"use server";

import { google } from "googleapis";
import { auth, clerkClient } from "@clerk/nextjs/server";

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

import { google } from "googleapis";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log("🔄 Auto-refreshing Drive listener...");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    // Get user's Google OAuth token
    const clerkResponse = await (
      await clerkClient()
    ).users.getUserOauthAccessToken(userId, "google");

    if (!clerkResponse || clerkResponse.data.length === 0) {
      return NextResponse.json(
        {
          message:
            "Google account not connected. Please connect your Google Drive first.",
        },
        { status: 400 }
      );
    }

    const accessToken = clerkResponse.data[0].token;
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Stop existing listener if it exists
    const existingUser = await db.user.findFirst({
      where: { clerkId: userId },
      select: { googleResourceId: true },
    });

    if (existingUser?.googleResourceId) {
      try {
        await drive.channels.stop({
          requestBody: {
            id: existingUser.googleResourceId,
            resourceId: existingUser.googleResourceId,
          },
        });
        console.log(
          "🛑 Stopped existing listener:",
          existingUser.googleResourceId
        );
      } catch (error) {
        console.log(
          "⚠️ Could not stop existing listener (may have expired):",
          error
        );
      }
    }

    // Create new listener
    const channelId = uuidv4();
    const startPageTokenRes = await drive.changes.getStartPageToken({});
    const startPageToken = startPageTokenRes.data.startPageToken;

    if (startPageToken == null) {
      throw new Error("startPageToken is unexpectedly null");
    }

    const webhookAddress = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NGROK_URI}/api/drive-activity/notification`;

    const listener = await drive.changes.watch({
      pageToken: startPageToken,
      supportsAllDrives: true,
      supportsTeamDrives: true,
      requestBody: {
        id: channelId,
        type: "web_hook",
        address: webhookAddress,
        kind: "api#channel",
      },
    });

    if (listener.status == 200) {
      // Store the new listener in database
      await db.user.updateMany({
        where: {
          clerkId: userId,
        },
        data: {
          googleResourceId: listener.data.resourceId,
        },
      });

      console.log("✅ Drive listener refreshed successfully:", {
        resourceId: listener.data.resourceId,
        expiration: listener.data.expiration,
      });

      return NextResponse.json({
        message: "Drive listener refreshed successfully",
        resourceId: listener.data.resourceId,
        expiration: listener.data.expiration,
      });
    }

    return NextResponse.json(
      { message: "Failed to refresh listener" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error refreshing Drive listener:", error);
    return NextResponse.json(
      {
        message: "Failed to refresh listener",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

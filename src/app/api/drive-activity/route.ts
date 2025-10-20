import { google } from "googleapis";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db";

export async function GET() {
  try {
    console.log("🔍 Starting Drive listener creation...");
    console.log("Environment check:", {
      hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasOAuth2RedirectUri: !!process.env.OAUTH2_REDIRECT_URI,
      hasNgrokUri: !!process.env.NGROK_URI,
      ngrokUri: process.env.NGROK_URI,
    });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    // Check if user already has a listener
    const existingUser = await db.user.findFirst({
      where: { clerkId: userId },
      select: { googleResourceId: true },
    });

    if (existingUser?.googleResourceId) {
      console.log(
        "⚠️ User already has a Drive listener:",
        existingUser.googleResourceId
      );
      console.log("🔄 Creating a new listener anyway to refresh it...");
      // Don't return early - create a new listener
    } else {
      console.log("🔄 No existing listener found, creating new one...");
    }

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

    const channelId = uuidv4();

    const startPageTokenRes = await drive.changes.getStartPageToken({});
    const startPageToken = startPageTokenRes.data.startPageToken;
    if (startPageToken == null) {
      throw new Error("startPageToken is unexpectedly null");
    }

    const webhookAddress = `${process.env.NGROK_URI}/api/drive-activity/notification`;
    console.log("Creating Drive changes watch:", {
      supportsAllDrives: true,
      supportsTeamDrives: true,
      webhookAddress,
      startPageToken,
      channelId,
    });

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
      //if listener created store its channel id in db
      const channelStored = await db.user.updateMany({
        where: {
          clerkId: userId,
        },
        data: {
          googleResourceId: listener.data.resourceId,
        },
      });

      console.log("Drive watch created", {
        httpStatus: listener.status,
        resourceId: listener.data.resourceId,
        channelId,
        address: webhookAddress,
        expiration: listener.data.expiration,
      });

      if (channelStored) return new NextResponse("Listening to changes...");
    }

    return new NextResponse("Oops! something went wrong, try again");
  } catch (error) {
    console.error("Error creating Google Drive listener:", error);
    return NextResponse.json(
      {
        message: "Failed to create listener",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

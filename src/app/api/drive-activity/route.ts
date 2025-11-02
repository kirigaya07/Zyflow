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

    // Validate required environment variables
    if (
      !process.env.GOOGLE_CLIENT_ID ||
      !process.env.GOOGLE_CLIENT_SECRET ||
      !process.env.OAUTH2_REDIRECT_URI ||
      !process.env.NGROK_URI
    ) {
      return NextResponse.json(
        {
          message: "Missing required environment variables",
          missing: {
            GOOGLE_CLIENT_ID: !process.env.GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET: !process.env.GOOGLE_CLIENT_SECRET,
            OAUTH2_REDIRECT_URI: !process.env.OAUTH2_REDIRECT_URI,
            NGROK_URI: !process.env.NGROK_URI,
          },
        },
        { status: 500 }
      );
    }

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
          action:
            "Please go to connections page and reconnect your Google account with proper Drive permissions.",
        },
        { status: 400 }
      );
    }

    const accessToken = clerkResponse.data[0].token;
    console.log("🔑 OAuth token obtained, length:", accessToken?.length || 0);

    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Test Drive API access before creating listener
    try {
      console.log("🧪 Testing Drive API access...");
      const testResponse = await drive.files.list({ pageSize: 1 });
      console.log("✅ Drive API access confirmed");
    } catch (testError) {
      console.error("❌ Drive API test failed:", testError);
      return NextResponse.json(
        {
          message: "Google Drive API access denied",
          error:
            testError instanceof Error ? testError.message : "Unknown error",
          action:
            "Please reconnect your Google account with Drive permissions.",
        },
        { status: 403 }
      );
    }

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

    console.log("📡 Drive changes.watch response:", {
      status: listener.status,
      statusText: listener.statusText,
      resourceId: listener.data.resourceId,
      expiration: listener.data.expiration,
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
    console.error("❌ Error creating Google Drive listener:", error);

    // Provide more specific error messages based on the error type
    let errorMessage = "Failed to create listener";
    let statusCode = 500;
    let actionAdvice = "";

    if (error instanceof Error) {
      if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        errorMessage = "Domain not verified for webhooks";
        statusCode = 403;
        actionAdvice =
          "The ngrok domain needs to be verified in Google Cloud Console. Add 'bangled-trickly-buddy.ngrok-free.dev' to your verified domains.";
      } else if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        errorMessage = "OAuth token expired or insufficient permissions";
        statusCode = 401;
        actionAdvice =
          "Please reconnect your Google account with proper Drive permissions.";
      } else if (
        error.message.includes("400") ||
        error.message.includes("Bad Request")
      ) {
        errorMessage = "Invalid webhook configuration";
        statusCode = 400;
        actionAdvice =
          "Check that the webhook URL is accessible and properly formatted.";
      }
    }

    return NextResponse.json(
      {
        message: errorMessage,
        error: error instanceof Error ? error.message : "Unknown error",
        action: actionAdvice,
        debug: {
          webhookUrl: `${process.env.NGROK_URI}/api/drive-activity/notification`,
          timestamp: new Date().toISOString(),
        },
      },
      { status: statusCode }
    );
  }
}

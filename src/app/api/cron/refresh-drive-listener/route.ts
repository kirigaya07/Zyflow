import { NextResponse } from "next/server";
import { google } from "googleapis";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

/**
 * Cron Job Endpoint: Refresh Google Drive Listeners
 * 
 * This endpoint should be called periodically (recommended: every 6 days)
 * to refresh Google Drive webhook subscriptions before they expire.
 * 
 * Google Drive webhooks expire after 7 days, so refreshing every 6 days
 * ensures continuous monitoring without interruption.
 * 
 * This endpoint:
 * 1. Finds all users with active Google Drive listeners
 * 2. Refreshes their webhook subscriptions
 * 3. Updates the database with new resource IDs
 * 
 * Security: This endpoint should be protected by a secret token
 * passed as a query parameter or header to prevent unauthorized access.
 */
export async function GET(req: Request) {
  try {
    // Optional: Add security check
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret");
    
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔄 Starting scheduled Drive listener refresh...");

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    // Find all users with Google Drive listeners
    const usersWithListeners = await db.user.findMany({
      where: {
        googleResourceId: { not: null },
      },
      select: {
        id: true,
        clerkId: true,
        googleResourceId: true,
      },
    });

    console.log(`Found ${usersWithListeners.length} users with Drive listeners`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithListeners) {
      try {
        // Get user's Google OAuth token
        const clerkResponse = await (
          await clerkClient()
        ).users.getUserOauthAccessToken(user.clerkId, "google");

        if (!clerkResponse || clerkResponse.data.length === 0) {
          console.log(
            `⚠️ No Google OAuth token for user ${user.clerkId}, skipping`
          );
          errorCount++;
          continue;
        }

        const accessToken = clerkResponse.data[0].token;
        oauth2Client.setCredentials({
          access_token: accessToken,
        });

        const drive = google.drive({
          version: "v3",
          auth: oauth2Client,
        });

        // Stop existing listener
        if (user.googleResourceId) {
          try {
            await drive.channels.stop({
              requestBody: {
                id: user.googleResourceId,
                resourceId: user.googleResourceId,
              },
            });
            console.log(
              `🛑 Stopped existing listener for user ${user.clerkId}`
            );
          } catch (error) {
            console.log(
              `⚠️ Could not stop existing listener (may have expired):`,
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
          // Update the user's listener in database
          await db.user.update({
            where: { id: user.id },
            data: {
              googleResourceId: listener.data.resourceId,
            },
          });

          console.log(
            `✅ Refreshed Drive listener for user ${user.clerkId}:`,
            listener.data.resourceId
          );
          successCount++;
        } else {
          console.error(
            `❌ Failed to refresh listener for user ${user.clerkId}`
          );
          errorCount++;
        }
      } catch (error) {
        console.error(
          `❌ Error refreshing listener for user ${user.clerkId}:`,
          error
        );
        errorCount++;
      }
    }

    return NextResponse.json({
      message: "Drive listener refresh completed",
      total: usersWithListeners.length,
      success: successCount,
      errors: errorCount,
    });
  } catch (error) {
    console.error("Error in scheduled Drive listener refresh:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


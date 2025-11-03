import { NextResponse } from "next/server";
import { google } from "googleapis";
import { clerkClient } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { meetingId, topic, meetingTimestamp, delayMinutes, recordingFiles } =
      await req.json();

    console.log(
      `🔍 [${
        delayMinutes || "Manual"
      }min] Checking for Zoom files in Drive - Meeting: ${topic} (${meetingId})`
    );
    if (meetingTimestamp) {
      console.log(`⏰ Original meeting timestamp: ${meetingTimestamp}`);
    }
    if (recordingFiles?.length) {
      console.log(`📁 Expected recording files: ${recordingFiles.length}`);
    }

    // Get authentication for the first available user
    // Note: In production, you might want to associate meetings with specific users
    const users = await db.user.findMany({
      where: { googleResourceId: { not: null } },
      take: 1,
    });

    if (!users.length) {
      return NextResponse.json(
        { message: "No authenticated users found" },
        { status: 400 }
      );
    }

    const user = users[0];

    // Get Google OAuth token
    const clerkResponse = await (
      await clerkClient()
    ).users.getUserOauthAccessToken(user.clerkId, "google");

    if (!clerkResponse || clerkResponse.data.length === 0) {
      return NextResponse.json(
        { message: "Google account not connected" },
        { status: 400 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    oauth2Client.setCredentials({ access_token: clerkResponse.data[0].token });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Find the specific Zoom backup folder structure
    const backupFolders = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='crimsomemoon7@gmail.com_zBackup'",
      fields: "files(id,name)",
      pageSize: 1,
    });

    if (!backupFolders.data.files || backupFolders.data.files.length === 0) {
      return NextResponse.json({
        message: "Zoom backup folder not found",
        suggestion: "Files may not be uploaded yet, will retry later",
      });
    }

    const zoomBackupFolder = backupFolders.data.files[0].id;

    // Find the email folder inside it
    const emailFolders = await drive.files.list({
      q: `'${zoomBackupFolder}' in parents and mimeType='application/vnd.google-apps.folder' and name='crimsomemoon7@gmail.com'`,
      fields: "files(id,name)",
      pageSize: 1,
    });

    const zoomFolder = emailFolders.data.files?.[0];
    if (!zoomFolder) {
      return NextResponse.json({
        message: "Email folder not found inside backup folder",
        suggestion: "Files may not be uploaded yet, will retry later",
      });
    }

    // Search for files related to this meeting
    const searchTerms = [
      topic
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(" ")
        .filter((word: string) => word.length > 2),
      meetingId.toString(),
      new Date().toISOString().split("T")[0], // today's date
    ].flat();

    console.log(`🔍 Searching for files with terms: ${searchTerms.join(", ")}`);

    // Look for recently added files in Zoom folder
    const recentTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // Last 30 minutes

    const filesQuery = await drive.files.list({
      q: `'${zoomFolder.id}' in parents and modifiedTime > '${recentTime}'`,
      pageSize: 20,
      orderBy: "modifiedTime desc",
      fields: "files(id, name, mimeType, size, modifiedTime, webViewLink)",
    });

    const recentFiles = filesQuery.data.files || [];
    console.log(`📂 Found ${recentFiles.length} recent files in Zoom folder`);

    // Filter for audio/video files
    const mediaFiles = recentFiles.filter(
      (file) =>
        file.mimeType?.includes("audio") ||
        file.mimeType?.includes("video") ||
        file.name?.toLowerCase().includes(".m4a") ||
        file.name?.toLowerCase().includes(".mp4")
    );

    if (mediaFiles.length === 0) {
      return NextResponse.json({
        message: "No media files found yet",
        filesFound: recentFiles.length,
        suggestion: "Files may still be uploading, will retry later",
      });
    }

    console.log(`🎵 Found ${mediaFiles.length} media files, processing...`);

    // Process each media file
    const results = [];
    for (const file of mediaFiles) {
      try {
        // Trigger the same processing that the Drive webhook would do
        console.log(`🎯 Processing file: ${file.name}`);

        // Here you would call the same processing logic from your notification route
        // For now, just log that we found the files
        results.push({
          fileId: file.id,
          fileName: file.name,
          mimeType: file.mimeType,
          size: file.size,
          status: "found",
        });
      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error);
        results.push({
          fileId: file.id,
          fileName: file.name,
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      message: "Zoom files check completed",
      meetingId,
      topic,
      totalFiles: recentFiles.length,
      mediaFiles: results,
      zoomFolderId: zoomFolder.id,
    });
  } catch (error) {
    console.error("❌ Error checking Zoom files:", error);
    return NextResponse.json(
      {
        message: "Error checking Zoom files",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

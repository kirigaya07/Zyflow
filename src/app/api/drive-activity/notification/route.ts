import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { sendEmailToMultipleRecipientsViaGmail } from "@/app/(main)/(pages)/connections/_actions/email-connection";
import { db } from "@/lib/db";
import { clerkClient } from "@clerk/nextjs/server";
import axios from "axios";
import { headers } from "next/headers";
import { google } from "googleapis";
import OpenAI from "openai";

// In-memory deduplication store
const processedMessages = new Set<string>();
const recentActivity = new Set<string>();
const processedFiles = new Set<string>(); // Track processed files to prevent duplicates

// Clean up old entries periodically to prevent memory leaks
setInterval(() => {
  if (processedFiles.size > 1000) {
    processedFiles.clear();
    console.log("🧹 Cleared processed files cache");
  }
}, 60000); // Clean every minute

export async function POST() {
  const headersList = await headers();
  // Log all relevant Google headers to verify delivery/validation
  const headerSnapshot: Record<string, string> = {};
  headersList.forEach((value, key) => {
    if (key.startsWith("x-goog-")) headerSnapshot[key] = value;
  });

  // Create unique message identifier
  const messageId = `${headerSnapshot["x-goog-resource-id"]}-${headerSnapshot["x-goog-message-number"]}`;
  const resourceId = headerSnapshot["x-goog-resource-id"];

  console.log("🔍 Processing webhook:", {
    messageId,
    resourceState: headerSnapshot["x-goog-resource-state"],
    messageNumber: headerSnapshot["x-goog-message-number"],
  });

  // Skip sync messages (initial setup)
  if (headerSnapshot["x-goog-resource-state"] === "sync") {
    console.log("⏭️ Skipping sync message:", messageId);
    return Response.json({ message: "sync skipped" }, { status: 200 });
  }

  // Skip if already processed
  if (processedMessages.has(messageId)) {
    console.log("⏭️ Skipping duplicate message:", messageId);
    return Response.json({ message: "duplicate skipped" }, { status: 200 });
  }

  // Skip if we've processed this resource recently (within 5 seconds)
  if (recentActivity.has(resourceId)) {
    console.log("⏭️ Skipping recent activity for resource:", resourceId);
    return Response.json(
      { message: "recent activity skipped" },
      { status: 200 }
    );
  }

  // Mark as processed
  processedMessages.add(messageId);
  recentActivity.add(resourceId);

  // Clear recent activity after 5 seconds
  setTimeout(() => {
    recentActivity.delete(resourceId);
  }, 5000);

  // Google Drive webhook received

  let channelResourceId: string | undefined;
  if (headerSnapshot["x-goog-resource-id"]) {
    channelResourceId = headerSnapshot["x-goog-resource-id"];
  }

  // Immediately ack to avoid Google retries/timeouts
  const ack = Response.json({ ok: true }, { status: 200 });

  // Process asynchronously (fire-and-forget)
  (async () => {
    try {
      if (!channelResourceId) return;
      const user = await db.user.findFirst({
        where: { googleResourceId: channelResourceId },
        select: { clerkId: true, credits: true },
      });
      if (!user) {
        console.warn("No user found for resource id", channelResourceId);
        return;
      }
      if (!(user.credits === "Unlimited" || parseInt(user.credits!) > 0)) {
        console.warn(
          "Insufficient credits; skipping workflows for",
          user.clerkId
        );
        return;
      }

      // Check for Zoom audio files and process them
      const processingResult = await processZoomAudioFiles(user.clerkId);

      // Only trigger workflows if new files were actually processed
      if (!processingResult.newFilesProcessed) {
        console.log("⏭️ No new files processed - skipping workflow triggers");
        return;
      }

      console.log(
        `🚀 ${processingResult.filesProcessed} new files processed - triggering workflows`
      );

      const workflow = await db.workflows.findMany({
        where: {
          userId: user.clerkId,
          publish: true, // Only process published workflows
        },
      });
      console.log("Found published workflows:", workflow.length);
      workflow.forEach((w) => {
        console.log(`Workflow ${w.id}:`, {
          name: w.name,
          flowPath: w.flowPath,
          slackTemplate: w.slackTemplate,
          slackAccessToken: w.slackAccessToken ? "SET" : "MISSING",
          slackChannels: w.slackChannels,
          discordTemplate: w.discordTemplate,
          publish: w.publish,
        });
      });
      if (!workflow || workflow.length === 0) return;

      await Promise.all(
        workflow.map(async (flow) => {
          if (!flow.flowPath) {
            console.log("No flowPath defined for workflow:", flow.id);
            return;
          }

          const flowPath: string[] = JSON.parse(flow.flowPath);
          let current = 0;
          while (current < flowPath.length) {
            if (flowPath[current] === "Discord") {
              console.log("Executing Discord action for workflow:", flow.id);
              console.log("Discord config:", {
                hasTemplate: !!flow.discordTemplate,
                template: flow.discordTemplate,
              });

              const discordMessage = await db.discordWebhook.findFirst({
                where: { userId: flow.userId },
                select: { url: true },
              });
              if (discordMessage) {
                await postContentToWebHook(
                  flow.discordTemplate!,
                  discordMessage.url
                );
                console.log("Discord message sent successfully");
                flowPath.splice(current, 1);
                continue;
              } else {
                console.log("No Discord webhook found for user");
              }
            }

            if (flowPath[current] === "Slack") {
              console.log("Executing Slack action for workflow:", flow.id);
              console.log("Slack config:", {
                hasAccessToken: !!flow.slackAccessToken,
                channels: flow.slackChannels,
                template: flow.slackTemplate,
              });

              const channels = flow.slackChannels.map((channel: string) => ({
                label: "",
                value: channel,
              }));
              await postMessageToSlack(
                flow.slackAccessToken!,
                channels,
                flow.slackTemplate!
              );
              console.log("Slack message sent successfully");
              flowPath.splice(current, 1);
              continue;
            }

            if (flowPath[current] === "Notion") {
              const notionData = JSON.parse(flow.notionTemplate!);
              // Extract just the file name from the complex object
              const fileName =
                typeof notionData === "string"
                  ? notionData
                  : notionData.name || "New Drive File";

              await onCreateNewPageInDatabase(
                flow.notionDbId!,
                flow.notionAccessToken!,
                fileName
              );
              flowPath.splice(current, 1);
              continue;
            }

            if (flowPath[current] === "Email") {
              console.log("Executing Email action for workflow:", flow.id);
              console.log("Email config:", {
                hasTemplate: !!flow.emailTemplate,
                hasSubject: !!flow.emailSubject,
                recipients: flow.emailRecipients,
                template: flow.emailTemplate,
                subject: flow.emailSubject,
              });

              if (flow.emailRecipients && flow.emailRecipients.length > 0) {
                await sendEmailToMultipleRecipientsViaGmail(
                  flow.emailRecipients,
                  flow.emailSubject || "Drive Notification",
                  flow.emailTemplate ||
                    "A new file has been uploaded to Google Drive.",
                  user.clerkId
                );
                console.log("Email sent successfully via Gmail API");
              } else {
                console.log(
                  "❌ No email recipients selected - skipping Email action"
                );
              }
              flowPath.splice(current, 1);
              continue;
            }

            if (flowPath[current] === "Wait") {
              try {
                const res = await axios.put(
                  "https://api.cron-job.org/jobs",
                  {
                    job: {
                      url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.NGROK_URI}/api/flow?flow_id=${flow.id}`,
                      enabled: "true",
                      schedule: {
                        timezone: "Europe/Istanbul",
                        expiresAt: 0,
                        hours: [-1],
                        mdays: [-1],
                        minutes: ["*****"],
                        months: [-1],
                        wdays: [-1],
                      },
                    },
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${process.env.CRON_JOB_KEY!}`,
                      "Content-Type": "application/json",
                    },
                  }
                );
                if (res) {
                  flowPath.splice(current, 1);
                  const cronPath = await db.workflows.update({
                    where: { id: flow.id },
                    data: { cronPath: JSON.stringify(flowPath) },
                  });
                  if (cronPath) break;
                }
              } catch (err) {
                console.error("Failed to create cron wait job", err);
              }
              break;
            }

            current++;
          }

          await db.user.update({
            where: { clerkId: user.clerkId },
            data: { credits: `${parseInt(user.credits!) - 1}` },
          });
        })
      );
    } catch (err) {
      console.error("Drive notification processing failed", err);
    }
  })();

  return ack;
}

/**
 * Process Zoom audio files: Detect → Download → OpenAI → Upload summary
 */
async function processZoomAudioFiles(
  userId: string
): Promise<{ newFilesProcessed: boolean; filesProcessed: number }> {
  try {
    console.log("🎙️ Checking for Zoom audio files...");

    let filesProcessed = 0;

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get user's Google OAuth token from Clerk
    const clerkResponse = await (
      await clerkClient()
    ).users.getUserOauthAccessToken(userId, "google");

    if (!clerkResponse || clerkResponse.data.length === 0) {
      console.log("No Google account connected");
      return { newFilesProcessed: false, filesProcessed: 0 };
    }

    const accessToken = clerkResponse.data[0].token;
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Find the specific Zoom backup folder structure
    // Path: crimsomemoon7@gmail.com_zBackup > crimsomemoon7@gmail.com
    let zoomBackupFolder: string | null = null;
    let userEmailFolder: string | null = null;

    // First, find the crimsomemoon7@gmail.com_zBackup folder
    const backupFolders = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='crimsomemoon7@gmail.com_zBackup'",
      fields: "files(id,name)",
      pageSize: 1,
    });

    if (backupFolders.data.files && backupFolders.data.files.length > 0) {
      zoomBackupFolder = backupFolders.data.files[0].id || null;
      console.log("📁 Found Zoom backup folder:", zoomBackupFolder);

      // Now find the crimsomemoon7@gmail.com folder inside it
      const emailFolders = await drive.files.list({
        q: `'${zoomBackupFolder}' in parents and mimeType='application/vnd.google-apps.folder' and name='crimsomemoon7@gmail.com'`,
        fields: "files(id,name)",
        pageSize: 1,
      });

      if (emailFolders.data.files && emailFolders.data.files.length > 0) {
        userEmailFolder = emailFolders.data.files[0].id || null;
        console.log("📁 Found user email folder:", userEmailFolder);
      }
    }

    if (!userEmailFolder) {
      console.log("⚠️ Zoom backup folder structure not found");
      return { newFilesProcessed: false, filesProcessed: 0 };
    }

    // Find all meeting subfolders in the email folder
    const meetingFolders = await drive.files.list({
      q: `'${userEmailFolder}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: "files(id,name,modifiedTime)",
      orderBy: "modifiedTime desc",
      pageSize: 10,
    });

    console.log(
      `📂 Found ${meetingFolders.data.files?.length || 0} meeting folders`
    );

    // Get the most recent meeting folder
    const mostRecentMeeting = meetingFolders.data.files?.[0];

    if (!mostRecentMeeting || !mostRecentMeeting.id) {
      console.log("No meeting folders found");
      return { newFilesProcessed: false, filesProcessed: 0 };
    }

    console.log(`🔍 Monitoring meeting folder: ${mostRecentMeeting.name}`);

    // Poll for new audio files up to 10 times with 30 second intervals
    let attempts = 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let files: any = null;

    while (attempts < 10) {
      const recentThreshold = new Date(
        Date.now() - 2 * 60 * 1000
      ).toISOString();

      const result = await drive.files.list({
        q: `'${mostRecentMeeting.id}' in parents and modifiedTime > '${recentThreshold}'`,
        fields:
          "files(id,name,mimeType,webContentLink,createdTime,modifiedTime,parents,size)",
        orderBy: "modifiedTime desc",
        pageSize: 10,
      });

      if (result.data.files && result.data.files.length > 0) {
        files = result;
        console.log(
          `📄 Found ${files.data.files.length} files on attempt ${attempts + 1}`
        );

        // Debug: Log all found files
        files.data.files.forEach(
          (file: { name?: string; mimeType?: string; size?: string }) => {
            console.log(
              `🔍 File found: "${file.name}" | Type: ${file.mimeType} | Size: ${file.size}`
            );
          }
        );

        // Check if files are still changing (not fully uploaded yet)
        // Wait 30 seconds, then check again if file sizes are stable
        await new Promise((resolve) => setTimeout(resolve, 30000));

        let filesStillChanging = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const file of files.data.files as any[]) {
          try {
            const fileDetails = await drive.files.get({
              fileId: file.id,
              fields: "size,modifiedTime",
            });
            // If size changed, file is still uploading
            if (fileDetails.data.size !== file.size) {
              filesStillChanging = true;
              break;
            }
          } catch (error) {
            console.warn("Could not check file status:", error);
          }
        }

        const allFilesStable = !filesStillChanging;

        if (allFilesStable) {
          console.log("✅ All files appear to be fully uploaded");
          break;
        } else {
          console.log("⏳ Files still uploading, continuing to monitor...");
        }
      }

      attempts++;
      if (attempts < 10) {
        await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds
      }
    }

    if (!files || !files.data.files || files.data.files.length === 0) {
      console.log("No audio files found after monitoring");
      return { newFilesProcessed: false, filesProcessed: 0 };
    }

    console.log(
      `📂 Found ${files.data.files.length} total files in meeting folder`
    );

    // Process each audio file (only M4A files)
    const m4aFiles = files.data.files.filter(
      (file: { name?: string; mimeType?: string }) => {
        const isM4A =
          file.name?.toLowerCase().endsWith(".m4a") ||
          file.mimeType?.includes("audio");
        const isAudioOnly =
          file.name?.toLowerCase().includes("audio") ||
          file.name?.toLowerCase().includes("audio_only");
        console.log(
          `🎵 Checking file: ${file.name} | isM4A: ${isM4A} | isAudioOnly: ${isAudioOnly}`
        );
        return isM4A && isAudioOnly;
      }
    );

    console.log(`🎵 Found ${m4aFiles.length} M4A audio files to process`);

    for (const file of m4aFiles) {
      console.log(`📁 Processing M4A file: ${file.name}`);

      // Create unique identifier for this file
      const fileIdentifier = `${file.id}-${file.name}`;

      // Check if we've already processed this exact file recently
      if (processedFiles.has(fileIdentifier)) {
        console.log(
          `⏭️ File already processed recently: ${file.name} - skipping`
        );
        continue;
      }

      // Add to processed files immediately to prevent concurrent processing
      processedFiles.add(fileIdentifier);
      console.log(`🔄 Processing file: ${file.name} (first time processing)`);

      // Check if summary already exists
      const summaryName = file.name?.replace(/\.(m4a|mp4)$/, "_summary.txt");

      // Download the audio file with improved error handling
      let audioBlob: Blob;
      try {
        console.log(`🔄 Downloading audio file: ${file.name} (ID: ${file.id})`);

        // Use direct download URL with proper headers
        const downloadUrl = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
        const audioResponse = await fetch(downloadUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/octet-stream",
            "User-Agent": "Zyflow/1.0",
          },
        });

        if (!audioResponse.ok) {
          throw new Error(
            `HTTP ${audioResponse.status}: ${audioResponse.statusText}`
          );
        }

        // Check response headers
        const contentType = audioResponse.headers.get("content-type");
        const contentLength = audioResponse.headers.get("content-length");

        console.log(
          `📄 Response headers: Content-Type: ${contentType}, Content-Length: ${contentLength}`
        );

        // Get the blob with proper content type
        audioBlob = await audioResponse.blob();

        // Verify download completed successfully
        if (audioBlob.size === 0) {
          throw new Error("Downloaded file is empty");
        }

        console.log(
          `✅ Successfully downloaded: ${file.name}, size: ${audioBlob.size} bytes`
        );
      } catch (downloadError) {
        console.error(
          `❌ Failed to download audio file ${file.name}:`,
          downloadError
        );
        continue;
      }
      console.log(
        `✅ Downloaded audio: ${file.name}, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`
      );

      // Validate file size (OpenAI has a 25MB limit)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (audioBlob.size > maxSize) {
        console.error(
          `❌ Audio file too large: ${audioBlob.size} bytes (max: ${maxSize})`
        );
        continue;
      }

      if (audioBlob.size === 0) {
        console.error(`❌ Audio file is empty: ${file.name}`);
        continue;
      }

      // Determine correct MIME type based on file extension
      let mimeType = audioBlob.type;
      const fileName = file.name || "audio.mp4";

      if (!mimeType || mimeType === "application/octet-stream") {
        if (fileName.endsWith(".m4a")) {
          mimeType = "audio/mp4";
        } else if (fileName.endsWith(".mp3")) {
          mimeType = "audio/mpeg";
        } else if (fileName.endsWith(".wav")) {
          mimeType = "audio/wav";
        } else if (fileName.endsWith(".mp4")) {
          mimeType = "audio/mp4";
        } else {
          mimeType = "audio/mp4"; // default
        }
      }

      // Convert blob to File for OpenAI SDK with proper MIME type
      const audioFile = new File([audioBlob], fileName, {
        type: mimeType,
      });

      console.log(
        `🎵 Preparing file for Whisper: ${fileName}, type: ${mimeType}, size: ${audioBlob.size}`
      );

      // Add file content verification
      if (audioBlob.size < 1000) {
        console.warn(
          `⚠️ File seems very small (${audioBlob.size} bytes), might be corrupted`
        );
      }

      // Send to OpenAI Whisper for transcription using SDK
      let transcript: string;
      try {
        console.log(`🤖 Sending to OpenAI Whisper: ${fileName}`);
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-1",
          language: "en",
          temperature: 0.0, // More deterministic results
          response_format: "text",
          prompt:
            "This is a Zoom meeting recording with business discussion, technical terms, and proper names.",
        });
        transcript = transcription;
        console.log(`✅ Transcript generated: ${transcript.length} characters`);
      } catch (error) {
        console.error(`❌ Whisper transcription failed for ${file.name}:`);

        if (error instanceof Error) {
          console.error(`Error message: ${error.message}`);

          // Check if it's a file format issue
          if (
            error.message.includes("Invalid file format") ||
            error.message.includes("400")
          ) {
            console.error(`💡 Try converting ${fileName} to MP3 or WAV format`);
            console.error(
              `File details: size=${audioBlob.size}, type=${mimeType}`
            );

            // Try with a different approach - force MP3 MIME type
            try {
              console.log(`🔄 Retrying with MP3 MIME type...`);
              const mp3File = new File(
                [audioBlob],
                fileName.replace(/\.[^.]+$/, ".mp3"),
                {
                  type: "audio/mpeg",
                }
              );

              const retryTranscription =
                await openai.audio.transcriptions.create({
                  file: mp3File,
                  model: "whisper-1",
                  language: "en",
                  temperature: 0.0,
                  response_format: "text",
                  prompt:
                    "This is a Zoom meeting recording with business discussion, technical terms, and proper names.",
                });

              transcript = retryTranscription;
              console.log(
                `✅ Retry successful: ${transcript.length} characters`
              );
            } catch (retryError) {
              console.error(
                `❌ Retry also failed:`,
                retryError instanceof Error ? retryError.message : retryError
              );
              continue;
            }
          } else {
            console.error(`Full error:`, error);
            continue;
          }
        } else {
          console.error(`Unknown error type:`, error);
          continue;
        }
      }

      // Generate AI summary using SDK
      let summary: string;
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content:
                "You are a meeting summarizer. Create a concise, actionable summary.",
            },
            {
              role: "user",
              content: `Summarize this Zoom meeting transcript:\n\n${transcript}`,
            },
          ],
        });
        summary = completion.choices[0]?.message?.content || "";
      } catch (error) {
        console.error(`❌ Summary generation failed:`, error);
        continue;
      }

      // Create or find summary folder with the same name as the meeting folder
      console.log(
        `📄 Generated summary for ${file.name}: ${summary.length} characters`
      );

      const meetingFolderName = mostRecentMeeting.name;
      const summaryFolderName = `summary`;

      // Check if summary folder already exists in userEmailFolder
      let summaryFolderId: string | null = null;
      const existingSummaryFolders = await drive.files.list({
        q: `'${userEmailFolder}' in parents and mimeType='application/vnd.google-apps.folder' and name='${summaryFolderName}'`,
        fields: "files(id,name)",
        pageSize: 1,
      });

      if (
        existingSummaryFolders.data.files &&
        existingSummaryFolders.data.files.length > 0
      ) {
        summaryFolderId = existingSummaryFolders.data.files[0].id || null;
        console.log(`📁 Found existing summary folder: ${summaryFolderId}`);
      } else {
        // Create summary folder
        const summaryFolderMetadata = {
          name: summaryFolderName,
          parents: [userEmailFolder],
          mimeType: "application/vnd.google-apps.folder",
        };

        const createFolderResponse = await fetch(
          "https://www.googleapis.com/drive/v3/files",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(summaryFolderMetadata),
          }
        );

        if (createFolderResponse.ok) {
          const folderResult = await createFolderResponse.json();
          summaryFolderId = folderResult.id;
          console.log(`✅ Created summary folder: ${summaryFolderId}`);
        } else {
          console.error(`❌ Failed to create summary folder`);
          summaryFolderId = userEmailFolder; // Fallback to user email folder
        }
      }

      // Now check if meeting-specific summary folder exists inside summary folder
      let meetingSummaryFolderId: string | null = null;
      // Escape single quotes in meeting folder name for Google Drive API query
      const escapedMeetingFolderName =
        meetingFolderName?.replace(/'/g, "\\'") || meetingFolderName;
      const existingMeetingFolders = await drive.files.list({
        q: `'${summaryFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and name='${escapedMeetingFolderName}'`,
        fields: "files(id,name)",
        pageSize: 1,
      });

      if (
        existingMeetingFolders.data.files &&
        existingMeetingFolders.data.files.length > 0
      ) {
        meetingSummaryFolderId =
          existingMeetingFolders.data.files[0].id || null;
        console.log(
          `📁 Found existing meeting summary folder: ${meetingSummaryFolderId}`
        );
      } else {
        // Create meeting-specific summary folder
        const meetingFolderMetadata = {
          name: meetingFolderName,
          parents: [summaryFolderId],
          mimeType: "application/vnd.google-apps.folder",
        };

        const createMeetingFolderResponse = await fetch(
          "https://www.googleapis.com/drive/v3/files",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(meetingFolderMetadata),
          }
        );

        if (createMeetingFolderResponse.ok) {
          const meetingFolderResult = await createMeetingFolderResponse.json();
          meetingSummaryFolderId = meetingFolderResult.id;
          console.log(
            `✅ Created meeting summary folder: ${meetingSummaryFolderId}`
          );
        } else {
          console.error(`❌ Failed to create meeting summary folder`);
          meetingSummaryFolderId = summaryFolderId; // Fallback to summary folder
        }
      }

      console.log(`📁 Upload metadata:`, {
        name: summaryName,
        parents: [meetingSummaryFolderId],
      });

      // Create text file with explicit content type
      const summaryBlob = new Blob([summary], {
        type: "text/plain; charset=utf-8",
      });
      const metadata = {
        name: summaryName || `${file.name}_summary.txt`,
        parents: [meetingSummaryFolderId],
        mimeType: "text/plain",
      };

      const formData2 = new FormData();
      formData2.append(
        "metadata",
        new Blob([JSON.stringify(metadata)], {
          type: "application/json",
        })
      );
      formData2.append(
        "file",
        summaryBlob,
        summaryName || `${file.name}_summary.txt`
      );

      const uploadResponse = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData2,
        }
      );

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        console.log(
          `✅ Summary uploaded to Drive: ${summaryName}`,
          uploadResult
        );
        console.log(
          `📍 Summary stored at: https://drive.google.com/file/d/${uploadResult.id}/view`
        );
        console.log(
          `📂 Path: crimsomemoon7@gmail.com_zBackup > crimsomemoon7@gmail.com > summary > ${meetingFolderName} > ${summaryName}`
        );
        filesProcessed++;
      } else {
        const errorText = await uploadResponse.text();
        console.error(`❌ Failed to upload summary for ${file.name}`, {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
          error: errorText,
        });
      }
    }

    console.log(
      `🎯 Processing complete: ${filesProcessed} new files processed`
    );
    return { newFilesProcessed: filesProcessed > 0, filesProcessed };
  } catch (error) {
    console.error("Error processing Zoom audio files:", error);
    return { newFilesProcessed: false, filesProcessed: 0 };
  }
}

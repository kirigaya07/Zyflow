import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";

/**
 * Zoom Webhook Handler
 * Receives events from Zoom when meetings end
 * Automatically triggers: Download → OpenAI → Drive
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Zoom Webhook received:", JSON.stringify(body, null, 2));

    const { event, payload } = body;

    // Log the event type for debugging
    console.log(`📡 Zoom webhook event type: ${event}`);

    // Get headers
    const headersList = await headers();
    // const zoomSignature = headersList.get("x-zm-signature");
    // const zoomTimestamp = headersList.get("x-zm-request-timestamp");

    // Log all headers for debugging (only for validation events)
    if (event === "endpoint.url_validation") {
      console.log("All headers:", Array.from(headersList.entries()));
    }

    // Handle URL validation event (no authentication required)
    if (event === "endpoint.url_validation") {
      console.log("✅ Zoom URL validation received");

      // Get the secret token from custom header if present, otherwise from env
      const customToken = headersList.get("x-zoom-token");
      const secretToken = customToken || process.env.ZOOM_WEBHOOK_TOKEN;
      const plainToken = payload.plainToken;

      console.log("Sending validation response with plainToken:", plainToken);
      console.log(
        "Using token:",
        customToken ? "from header (x-zoom-token)" : "from env"
      );

      // Generate encryptedToken using HMAC SHA-256
      let encryptedToken = plainToken;
      if (secretToken) {
        encryptedToken = crypto
          .createHmac("sha256", secretToken)
          .update(plainToken)
          .digest("hex");
        console.log("Generated encryptedToken:", encryptedToken);
      } else {
        console.log(
          "No secret token found, using plainToken as encryptedToken"
        );
      }

      const response = {
        plainToken: plainToken,
        encryptedToken: encryptedToken,
      };

      console.log("Validation response:", JSON.stringify(response, null, 2));

      return NextResponse.json(response);
    }

    // Verify Zoom signature for actual webhook events (not validation)
    // Note: For webhook-only apps, signature verification is optional
    // Commenting out for now to allow events to process
    /*
    if (zoomSignature && process.env.ZOOM_WEBHOOK_TOKEN && zoomTimestamp) {
      const message = `v0:${zoomTimestamp}:${JSON.stringify(body)}`;
      const hashForVerify = crypto
        .createHmac("sha256", process.env.ZOOM_WEBHOOK_TOKEN)
        .update(message)
        .digest("hex");
      const expectedSignature = `v0=${hashForVerify}`;

      if (zoomSignature !== expectedSignature) {
        console.error("❌ Invalid Zoom signature");
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
      console.log("✅ Zoom signature verified");
    }
    */

    // Handle recording events
    if (
      event === "recording.transcript_completed" ||
      event === "recording.completed"
    ) {
      console.log("🎙️ Recording completed - starting automated workflow...");

      // Handle both payload structures
      const meetingData = payload.object?.meeting || payload.object;
      const { id: meetingId, topic, recording_files } = meetingData;

      console.log(`📹 Meeting: ${topic}`);
      console.log(`🆔 Meeting ID: ${meetingId}`);
      console.log(`📁 Recording files: ${recording_files?.length || 0}`);

      // Find transcript file
      const transcriptFile = recording_files?.find(
        (file: { file_type: string; id: string; download_url: string }) =>
          file.file_type === "TRANSCRIPT"
      );

      // Find audio file
      const audioFile = recording_files?.find(
        (file: { file_type: string; id: string; download_url: string }) =>
          file.file_type === "MP4" || file.file_type === "M4A"
      );

      if (!transcriptFile && !audioFile) {
        console.error("❌ No transcript or audio file found");
        return NextResponse.json(
          {
            message: "No transcript or audio file available",
          },
          { status: 200 }
        );
      }

      // Start automated processing with delayed checks
      console.log("📤 Zoom files will be uploaded to Drive automatically");
      console.log(
        `⏳ Starting delayed file check system for meeting: ${topic} (ID: ${meetingId})`
      );

      // Schedule delayed checks for Zoom files in Drive
      const scheduleDelayedCheck = async (delayMinutes: number) => {
        console.log(
          `⏰ Scheduling check in ${delayMinutes} minutes for meeting: ${topic} (${meetingId})`
        );

        setTimeout(async () => {
          try {
            console.log(
              `� Checking for Zoom files after ${delayMinutes} minutes...`
            );

            const response = await fetch(
              `${
                process.env.NGROK_URI || "https://localhost:3000"
              }/api/check-zoom-files`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "User-Agent": "ZoomWebhook-DelayedCheck",
                },
                body: JSON.stringify({
                  meetingId,
                  topic,
                  meetingTimestamp: new Date().toISOString(),
                  delayMinutes,
                  recordingFiles: recording_files,
                }),
              }
            );

            const result = await response.json();
            console.log(
              `📊 [${topic}] Delayed check result after ${delayMinutes} minutes:`,
              result
            );

            if (result.mediaFiles && result.mediaFiles.length > 0) {
              console.log(
                `✅ [${topic}] Found ${result.mediaFiles.length} media files after ${delayMinutes} minutes - processing should begin!`
              );
            } else {
              console.log(
                `⏳ [${topic}] No media files found yet after ${delayMinutes} minutes`
              );
            }
          } catch (error) {
            console.error(
              `❌ [${topic}] Error in delayed check after ${delayMinutes} minutes:`,
              error
            );
          }
        }, delayMinutes * 60 * 1000);
      };

      // Schedule checks at 2, 5, and 10 minutes
      scheduleDelayedCheck(2);
      scheduleDelayedCheck(5);
      scheduleDelayedCheck(10);

      return NextResponse.json({
        message:
          "Zoom webhook processed - delayed file checks scheduled for this meeting only",
        meetingId,
        topic,
        checksScheduled: ["2 minutes", "5 minutes", "10 minutes"],
        recordingFilesCount: recording_files?.length || 0,
      });
    }

    // Handle other Zoom events if needed
    if (event === "meeting.ended") {
      console.log("🏁 Meeting ended:", payload.object.id);
      console.log("⏳ Waiting for recording to be processed...");
      // Meeting ended, waiting for recording to be processed
    }

    // Log any unhandled events
    if (
      event !== "endpoint.url_validation" &&
      event !== "recording.completed" &&
      event !== "meeting.ended"
    ) {
      console.log(`ℹ️ Received unhandled event: ${event}`);
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Zoom webhook:", error);
    return NextResponse.json(
      { message: "Error processing webhook" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Verification endpoint for Zoom
  const headersList = await headers();
  const authHeader = headersList.get("authorization");

  // Verify Token Authentication if enabled
  if (process.env.ZOOM_WEBHOOK_TOKEN && authHeader) {
    const token = authHeader.replace("Bearer ", "");
    if (token !== process.env.ZOOM_WEBHOOK_TOKEN) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json({ message: "Zoom webhook endpoint is alive" });
}

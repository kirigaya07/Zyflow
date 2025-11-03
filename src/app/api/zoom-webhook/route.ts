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

      // Find audio file (prioritize M4A over MP4)
      const audioFile =
        recording_files?.find(
          (file: { file_type: string; id: string; download_url: string }) =>
            file.file_type === "M4A"
        ) ||
        recording_files?.find(
          (file: { file_type: string; id: string; download_url: string }) =>
            file.file_type === "MP4"
        );

      if (!audioFile) {
        console.error("❌ No audio file found for processing");
        return NextResponse.json(
          {
            message: "No audio file available for processing",
          },
          { status: 200 }
        );
      }

      console.log(
        `🎵 Found audio file: ${audioFile.file_type} (${audioFile.file_size} bytes)`
      );

      // Since your Zoom marketplace app automatically uploads files to Drive,
      // we just wait for the Drive webhook to process the files
      console.log("📤 Zoom files will be uploaded to Drive automatically");
      console.log("⏳ Waiting for Drive webhook to process audio files...");

      return NextResponse.json({
        message: "Zoom webhook processed - waiting for automatic Drive upload",
        meetingId,
        topic,
        audioFile: {
          type: audioFile.file_type,
          size: audioFile.file_size,
        },
        note: "Files will be processed automatically when they appear in Drive",
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

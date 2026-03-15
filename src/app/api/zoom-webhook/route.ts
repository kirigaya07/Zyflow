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
    const secretToken = process.env.ZOOM_WEBHOOK_TOKEN;

    // Handle URL validation event — Zoom sends this to register the endpoint, no signature yet
    if (event === "endpoint.url_validation") {
      console.log("✅ Zoom URL validation received");
      const plainToken = payload.plainToken;
      let encryptedToken = plainToken;
      if (secretToken) {
        encryptedToken = crypto
          .createHmac("sha256", secretToken)
          .update(plainToken)
          .digest("hex");
      }
      return NextResponse.json({ plainToken, encryptedToken });
    }

    // Validate HMAC-SHA256 signature for all other events
    const zoomSignature = headersList.get("x-zm-signature");
    const zoomTimestamp = headersList.get("x-zm-request-timestamp");

    if (!secretToken) {
      console.error("❌ ZOOM_WEBHOOK_TOKEN not configured");
      return NextResponse.json({ message: "Webhook not configured" }, { status: 500 });
    }

    if (!zoomSignature || !zoomTimestamp) {
      console.warn("❌ Missing Zoom signature headers");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Reject requests older than 5 minutes to prevent replay attacks
    const timestampAge = Math.abs(Date.now() / 1000 - parseInt(zoomTimestamp));
    if (timestampAge > 300) {
      console.warn("❌ Zoom webhook timestamp too old:", timestampAge, "seconds");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const rawBody = JSON.stringify(body);
    const expectedSignature =
      "v0=" +
      crypto
        .createHmac("sha256", secretToken)
        .update(`v0:${zoomTimestamp}:${rawBody}`)
        .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(zoomSignature),
        Buffer.from(expectedSignature)
      )
    ) {
      console.warn("❌ Invalid Zoom webhook signature");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Zoom signature verified");

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

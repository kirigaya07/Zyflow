"use server";

import { google } from "googleapis";
import { auth, clerkClient } from "@clerk/nextjs/server";

export const getZoomMeetingRecordings = async (userId: string) => {
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

    // Create Drive API instance
    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Search for recent Zoom recordings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const timeFilter = sevenDaysAgo.toISOString();

    const recordings = await drive.files.list({
      q: `(name contains 'zoom' or name contains 'Zoom') and (mimeType contains 'video' or mimeType contains 'text') and modifiedTime > '${timeFilter}'`,
      fields: "files(id,name,mimeType,webContentLink,createdTime,modifiedTime)",
      orderBy: "modifiedTime desc",
      pageSize: 10,
    });

    if (!recordings.data.files || recordings.data.files.length === 0) {
      return {
        message: "failed",
        error:
          "No recent Zoom recordings found. Make sure Zoom recordings are saved to Drive.",
      };
    }

    // Extract meeting IDs from filenames
    const meetings = recordings.data.files
      .map((file) => {
        // Extract meeting ID from filename (e.g., "Zoom Meeting abc-def-ghi-transcript.txt")
        const meetingIdMatch = file.name?.match(
          /([a-z]{3}-[a-z]{3}-[a-z]{3})/i
        );
        const meetingId = meetingIdMatch ? meetingIdMatch[1] : null;

        return {
          fileId: file.id,
          fileName: file.name,
          meetingId: meetingId,
          createdTime: file.createdTime,
          modifiedTime: file.modifiedTime,
          webContentLink: file.webContentLink,
          mimeType: file.mimeType,
        };
      })
      .filter((meeting) => meeting.meetingId); // Only include files with valid meeting IDs

    return {
      message: "success",
      meetings: meetings,
    };
  } catch (error) {
    console.error("Error getting Zoom recordings:", error);
    return {
      message: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const getZoomTranscript = async (meetingId: string, userId: string) => {
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

    // Create Drive API instance
    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Search for transcript files related to this meeting
    const transcriptFiles = await drive.files.list({
      q: `name contains '${meetingId}' and (mimeType contains 'text' or mimeType contains 'document')`,
      fields: "files(id,name,mimeType,webContentLink,createdTime)",
      orderBy: "createdTime desc",
    });

    if (
      !transcriptFiles.data.files ||
      transcriptFiles.data.files.length === 0
    ) {
      return {
        message: "failed",
        error:
          "No transcript files found for this Zoom meeting. Make sure the meeting was recorded with transcription enabled.",
      };
    }

    // Get the most recent transcript file
    const transcriptFile = transcriptFiles.data.files[0];

    // Download the transcript content
    const transcriptContent = await drive.files.get({
      fileId: transcriptFile.id!,
      alt: "media",
    });

    return {
      message: "success",
      transcript: transcriptContent.data,
      fileName: transcriptFile.name,
      fileId: transcriptFile.id,
    };
  } catch (error) {
    console.error("Error getting Zoom transcript:", error);
    return {
      message: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const generateMeetingSummary = async (transcript: string) => {
  try {
    console.log(
      `🤖 OpenAI API Key status: ${
        process.env.OPENAI_API_KEY ? "✅ Set" : "❌ Not set"
      }`
    );
    console.log(`📄 Transcript length: ${transcript.length} characters`);

    if (!process.env.OPENAI_API_KEY) {
      return { message: "failed", error: "OpenAI API key not configured" };
    }

    if (!transcript || transcript.trim().length < 10) {
      return { message: "failed", error: "Transcript too short or empty" };
    }

    // Keep original transcript size for better summaries
    const maxLength = 8000; // Original size for comprehensive summaries
    const truncatedTranscript =
      transcript.length > maxLength
        ? transcript.substring(0, maxLength) +
          "\n\n[Transcript truncated to optimize token usage]"
        : transcript;

    console.log(
      `📄 Using transcript length: ${truncatedTranscript.length} characters (optimized for $5 credit)`
    );

    // Estimate cost (rough calculation)
    const estimatedTokens = Math.ceil(truncatedTranscript.length / 4) + 1000; // Rough estimate
    const estimatedCost = (estimatedTokens * 0.0005) / 1000; // GPT-3.5-turbo pricing
    console.log(`💰 Estimated cost: ~$${estimatedCost.toFixed(4)}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              "You are a professional meeting summarizer. Create a comprehensive, well-structured summary of the Zoom meeting transcript. Include: 1) Meeting Overview, 2) Key Discussion Points, 3) Decisions Made, 4) Action Items, 5) Next Steps. Format it professionally for business use.",
          },
          {
            role: "user",
            content: `Please summarize this Zoom meeting transcript:\n\n${truncatedTranscript}`,
          },
        ],
        max_tokens: 1000, // Reduced to save money
        temperature: 0.3,
      }),
    });

    console.log(`📡 OpenAI API response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ OpenAI API error: ${response.status} - ${errorText}`);

      // Handle quota exceeded error
      if (response.status === 429) {
        return {
          message: "failed",
          error:
            "OpenAI API quota exceeded. Please add credits to your OpenAI account or try again later.",
        };
      }

      return {
        message: "failed",
        error: `OpenAI API error: ${response.status}`,
      };
    }

    const result = await response.json();
    console.log(`📊 OpenAI API result:`, result);

    if (result.choices && result.choices[0] && result.choices[0].message) {
      const summary = result.choices[0].message.content;

      // Check if content was filtered
      if (result.choices[0].finish_reason === "content_filter") {
        console.log(`⚠️ Content filtered by OpenAI, using fallback summary`);
        return {
          message: "success",
          summary: `Meeting Summary (Content Filtered)\n\nDate: ${new Date().toISOString()}\nFile: Audio transcript processed\n\n[Summary was filtered by OpenAI content policy. Please review the transcript manually for sensitive content.]`,
        };
      }

      return {
        message: "success",
        summary: summary,
      };
    } else {
      console.error(`❌ No valid response from OpenAI:`, result);
      return { message: "failed", error: "No summary generated from OpenAI" };
    }
  } catch (error) {
    console.error("Error generating meeting summary:", error);
    return {
      message: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const saveSummaryToDrive = async (
  summary: string,
  meetingTitle: string,
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

    // Create Drive API instance
    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    // Convert summary to text content (simpler and more reliable)
    const textContent = Buffer.from(summary, "utf-8");

    // Upload to Drive as text file
    const fileMetadata = {
      name: `${meetingTitle} - Zoom Meeting Summary.txt`,
      parents: ["root"], // Upload to root folder
    };

    const media = {
      mimeType: "text/plain",
      body: textContent,
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id,name,webViewLink",
    });

    return {
      message: "success",
      fileId: file.data.id,
      fileName: file.data.name,
      fileLink: file.data.webViewLink,
    };
  } catch (error) {
    console.error("Error saving summary to Drive:", error);
    return {
      message: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

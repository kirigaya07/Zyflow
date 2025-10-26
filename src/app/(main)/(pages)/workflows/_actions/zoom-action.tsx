"use server";

import { auth } from "@clerk/nextjs/server";
import {
  getZoomTranscript,
  getZoomMeetingRecordings,
  generateMeetingSummary,
  saveSummaryToDrive,
} from "@/app/(main)/(pages)/connections/_actions/zoom-connection";

export async function processZoomAction(
  meetingId: string,
  meetingTitle: string,
  isAutoDetect: boolean = false
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { message: "failed", error: "User not authenticated" };
    }

    if (isAutoDetect) {
      // Auto-detect recent Zoom meetings
      const recentMeetingsResult = await getZoomMeetingRecordings(userId);

      if (
        recentMeetingsResult.message === "success" &&
        recentMeetingsResult.meetings.length > 0
      ) {
        const mostRecentMeeting = recentMeetingsResult.meetings[0];

        // Get transcript
        const transcriptResult = await getZoomTranscript(
          mostRecentMeeting.meetingId!,
          userId
        );

        if (transcriptResult.message !== "success") {
          return {
            message: "failed",
            error: `Failed to get transcript: ${transcriptResult.error}`,
          };
        }

        // Generate summary
        const summaryResult = await generateMeetingSummary(
          transcriptResult.transcript
        );

        if (summaryResult.message !== "success") {
          return {
            message: "failed",
            error: `Failed to generate summary: ${summaryResult.error}`,
          };
        }

        // Save to Drive
        const saveResult = await saveSummaryToDrive(
          summaryResult.summary,
          mostRecentMeeting.fileName || "Zoom Meeting Summary",
          userId
        );

        if (saveResult.message === "success") {
          return {
            message: "success",
            meetingId: mostRecentMeeting.meetingId,
            meetingTitle: mostRecentMeeting.fileName,
            transcript: transcriptResult.transcript,
            summary: summaryResult.summary,
          };
        } else {
          return {
            message: "failed",
            error: `Failed to save to Drive: ${saveResult.error}`,
          };
        }
      } else {
        return { message: "failed", error: "No recent Zoom meetings found" };
      }
    } else {
      // Manual meeting ID
      if (!meetingId.trim()) {
        return { message: "failed", error: "Meeting ID is required" };
      }

      // Get transcript
      const transcriptResult = await getZoomTranscript(meetingId, userId);

      if (transcriptResult.message !== "success") {
        return {
          message: "failed",
          error: `Failed to get transcript: ${transcriptResult.error}`,
        };
      }

      // Generate summary
      const summaryResult = await generateMeetingSummary(
        transcriptResult.transcript
      );

      if (summaryResult.message !== "success") {
        return {
          message: "failed",
          error: `Failed to generate summary: ${summaryResult.error}`,
        };
      }

      // Save to Drive
      const saveResult = await saveSummaryToDrive(
        summaryResult.summary,
        meetingTitle || "Zoom Meeting Summary",
        userId
      );

      if (saveResult.message === "success") {
        return {
          message: "success",
          meetingId: meetingId,
          meetingTitle: meetingTitle,
          transcript: transcriptResult.transcript,
          summary: summaryResult.summary,
        };
      } else {
        return {
          message: "failed",
          error: `Failed to save to Drive: ${saveResult.error}`,
        };
      }
    }
  } catch (error) {
    console.error("Zoom processing error:", error);
    return {
      message: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

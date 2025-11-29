"use server";

/**
 * Zoom Workflow Actions Module
 *
 * This module handles Zoom meeting processing within workflow automations:
 * - Automatic meeting detection and processing
 * - Manual meeting ID processing
 * - Transcript extraction and AI summarization
 * - Google Drive integration for summary storage
 * - Error handling and user feedback
 *
 * Features:
 * - Auto-detection of recent Zoom meetings
 * - Manual meeting ID input support
 * - AI-powered meeting summaries
 * - Automated Drive storage
 * - Comprehensive error reporting
 */

import { auth } from "@clerk/nextjs/server";
import {
  getZoomTranscript,
  getZoomMeetingRecordings,
  generateMeetingSummary,
  saveSummaryToDrive,
} from "@/app/(main)/(pages)/connections/_actions/zoom-connection";

/**
 * Processes Zoom meetings through the complete automation pipeline.
 *
 * This function:
 * - Handles both auto-detection and manual meeting processing
 * - Extracts transcripts from Zoom recordings
 * - Generates AI-powered meeting summaries
 * - Saves results to Google Drive
 * - Provides detailed error feedback for troubleshooting
 *
 * Auto-detection mode:
 * - Finds most recent Zoom meeting automatically
 * - Processes without user input
 *
 * Manual mode:
 * - Uses provided meeting ID and title
 * - Allows specific meeting targeting
 *
 * @param meetingId - Zoom meeting identifier (required for manual mode)
 * @param meetingTitle - Display title for the meeting (optional)
 * @param isAutoDetect - Whether to auto-detect recent meetings (default: false)
 * @returns Response object with processing results or error details
 */
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

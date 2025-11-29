"use server";

/**
 * Zoom Upload Actions Module
 *
 * This module handles manual transcript upload processing for workflow automations:
 * - User-uploaded transcript processing
 * - AI-powered summary generation from uploaded content
 * - Google Drive integration for result storage
 * - Error handling and validation
 *
 * Features:
 * - Manual transcript content processing
 * - AI summary generation
 * - Automated Drive storage
 * - Comprehensive error reporting
 * - Flexible meeting identification
 */

import { auth } from "@clerk/nextjs/server";
import {
  generateMeetingSummary,
  saveSummaryToDrive,
} from "@/app/(main)/(pages)/connections/_actions/zoom-connection";

/**
 * Processes user-uploaded transcript content through the automation pipeline.
 *
 * This function:
 * - Validates uploaded transcript content
 * - Generates AI-powered meeting summaries
 * - Saves results to Google Drive
 * - Handles manual transcript uploads when direct Zoom integration isn't available
 *
 * Use cases:
 * - Manual transcript uploads from various sources
 * - Processing transcripts from external meeting tools
 * - Handling legacy meeting recordings
 * - Custom transcript processing workflows
 *
 * @param transcriptContent - Raw transcript text content
 * @param meetingTitle - Display title for the meeting
 * @param meetingId - Optional meeting identifier (defaults to "uploaded")
 * @returns Response object with processing results or error details
 */
export async function processUploadedTranscript(
  transcriptContent: string,
  meetingTitle: string,
  meetingId?: string
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { message: "failed", error: "User not authenticated" };
    }

    if (!transcriptContent.trim()) {
      return { message: "failed", error: "Transcript content is required" };
    }

    // Generate summary
    const summaryResult = await generateMeetingSummary(transcriptContent);

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
        meetingId: meetingId || "uploaded",
        meetingTitle: meetingTitle,
        transcript: transcriptContent,
        summary: summaryResult.summary,
      };
    } else {
      return {
        message: "failed",
        error: `Failed to save to Drive: ${saveResult.error}`,
      };
    }
  } catch (error) {
    console.error("Upload transcript error:", error);
    return {
      message: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

"use server";

import { auth } from "@clerk/nextjs/server";
import {
  generateMeetingSummary,
  saveSummaryToDrive,
} from "@/app/(main)/(pages)/connections/_actions/zoom-connection";

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

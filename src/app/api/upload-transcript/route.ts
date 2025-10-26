import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { processUploadedTranscript } from "@/app/(main)/(pages)/workflows/_actions/zoom-upload-action";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { transcriptContent, meetingTitle, meetingId } = await req.json();

    const result = await processUploadedTranscript(
      transcriptContent,
      meetingTitle,
      meetingId
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload transcript API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

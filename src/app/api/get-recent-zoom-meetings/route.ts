import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getZoomMeetingRecordings } from "@/app/(main)/(pages)/connections/_actions/zoom-connection";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await getZoomMeetingRecordings(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Get recent meetings error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

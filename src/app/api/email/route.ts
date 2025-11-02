import { sendEmailViaGmail } from "@/app/(main)/(pages)/connections/_actions/email-connection";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { recipients, subject, content } = await request.json();

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { message: "User not authenticated" },
        { status: 401 }
      );
    }

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { message: "No recipients provided" },
        { status: 400 }
      );
    }

    if (!subject || !content) {
      return NextResponse.json(
        { message: "Subject and content are required" },
        { status: 400 }
      );
    }

    // Send test email to first recipient
    const response = await sendEmailViaGmail(
      recipients[0],
      subject,
      content,
      userId
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Test email error:", error);
    return NextResponse.json(
      {
        message: "Failed to send test email",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

import { google } from "googleapis";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.OAUTH2_REDIRECT_URI
    );

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "User not found" }, { status: 401 });
    }

    const clerkResponse = await (
      await clerkClient()
    ).users.getUserOauthAccessToken(userId, "google");

    if (!clerkResponse || clerkResponse.data.length === 0) {
      return NextResponse.json(
        { message: "Google account not connected" },
        { status: 400 }
      );
    }

    const accessToken = clerkResponse.data[0].token;
    oauth2Client.setCredentials({
      access_token: accessToken,
    });

    const drive = google.drive({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await drive.files.list({
      pageSize: 10,
      fields: "files(id,name,mimeType,createdTime,modifiedTime)",
    });

    if (response.data.files && response.data.files.length > 0) {
      return NextResponse.json(
        {
          message: { files: response.data.files },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          message: { files: [] },
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching Drive files:", error);
    return NextResponse.json(
      {
        message: "Something went wrong",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const encoded = Buffer.from(
    `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_API_SECRET}`
  ).toString("base64");
  if (code) {
    const response = await axios("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Basic ${encoded}`,
        "Notion-Version": "2022-06-28",
      },
      data: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: process.env.NOTION_REDIRECT_URI!,
      }),
    });
    if (response) {
      const workspaceId =
        response.data.workspace_id || response.data.owner?.workspace || "";

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/connections?access_token=${
          response.data.access_token
        }&workspace_name=${encodeURIComponent(
          response.data.workspace_name || ""
        )}&workspace_icon=${encodeURIComponent(
          response.data.workspace_icon || ""
        )}&workspace_id=${workspaceId}`
      );
    }
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/connections`);
}

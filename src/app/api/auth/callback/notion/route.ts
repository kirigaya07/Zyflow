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
      // Use the database ID from your Notion workspace
      // Format: 28eb6093-eb0f-800f-bbf3-d553b72d9dc2
      const databaseId = "28eb6093-eb0f-800f-bbf3-d553b72d9dc2";

      console.log("Access Token received");
      console.log("Database ID:", databaseId);
      console.log("Workspace ID:", response.data.workspace_id);
      console.log("Owner workspace_id:", response.data.owner?.workspace);

      // Notion returns workspace_id in owner.workspace for workspace owners
      const workspaceId =
        response.data.workspace_id || response.data.owner?.workspace || "";

      return NextResponse.redirect(
        `https://localhost:3000/connections?access_token=${
          response.data.access_token
        }&workspace_name=${encodeURIComponent(
          response.data.workspace_name || ""
        )}&workspace_icon=${encodeURIComponent(
          response.data.workspace_icon || ""
        )}&workspace_id=${workspaceId}&database_id=${databaseId}`
      );
    }
  }

  return NextResponse.redirect("https://localhost:3000/connections");
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  startZoomWatcher,
  stopZoomWatcher,
} from "@/lib/zoom-folder-watcher-simple";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { action, zoomFolderPath } = await req.json();
    console.log("Zoom watcher API called:", { action, zoomFolderPath });

    if (action === "start") {
      if (!zoomFolderPath) {
        return NextResponse.json(
          { message: "Zoom folder path is required" },
          { status: 400 }
        );
      }

      try {
        // Start watching the Zoom folder
        console.log("Starting zoom watcher for path:", zoomFolderPath);
        startZoomWatcher(zoomFolderPath);

        return NextResponse.json({
          message: "success",
          status: "Zoom folder watcher started",
          folderPath: zoomFolderPath,
        });
      } catch (error) {
        console.error("Error starting zoom watcher:", error);
        return NextResponse.json(
          { message: `Failed to start watcher: ${error}` },
          { status: 500 }
        );
      }
    }

    if (action === "stop") {
      try {
        stopZoomWatcher();

        return NextResponse.json({
          message: "success",
          status: "Zoom folder watcher stopped",
        });
      } catch (error) {
        console.error("Error stopping zoom watcher:", error);
        return NextResponse.json(
          { message: `Failed to stop watcher: ${error}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Zoom watcher API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Return current status
    return NextResponse.json({
      message: "success",
      status: "Zoom folder watcher status",
      isWatching: true, // You can implement proper status tracking
    });
  } catch (error) {
    console.error("Zoom watcher status error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

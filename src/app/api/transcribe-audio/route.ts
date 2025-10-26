import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ZoomFolderWatcher } from "@/lib/zoom-folder-watcher-simple";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    // Dev/test bypass: allow unauthenticated calls in development or with header
    const bypass =
      process.env.NODE_ENV !== "production" ||
      req.headers.get("x-test-bypass")?.toLowerCase?.() === "1" ||
      req.headers.get("x-test-bypass")?.toLowerCase?.() === "true";

    if (!bypass) {
      const { userId } = await auth();
      if (!userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await req.json().catch(() => ({}));
    const filePath: string | undefined = body?.path || body?.filePath;
    if (!filePath) {
      return NextResponse.json(
        { error: "Missing 'path' in request body" },
        { status: 400 }
      );
    }

    const zoomFolderPath =
      process.env.ZOOM_FOLDER_PATH ||
      "C:\\Users\\anmol\\OneDrive\\Documents\\Zoom";

    const watcher = new ZoomFolderWatcher(zoomFolderPath);
    await watcher.processAudioFileManual(filePath);

    return NextResponse.json({ message: "ok", processed: filePath });
  } catch (error: unknown) {
    console.error("/api/transcribe-audio error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

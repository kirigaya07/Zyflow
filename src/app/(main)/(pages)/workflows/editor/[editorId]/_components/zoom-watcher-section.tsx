"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import { processUploadedTranscript } from "../../../_actions/zoom-upload-action";

interface ZoomWatcherSectionProps {
  nodeConnection: ConnectionProviderProps;
}

export default function ZoomWatcherSection({
  nodeConnection,
}: ZoomWatcherSectionProps) {
  // Zoom watcher state
  const [isWatching, setIsWatching] = useState(false);
  const [zoomFolderPath, setZoomFolderPath] = useState(
    "C:\\Users\\anmol\\OneDrive\\Documents\\Zoom"
  );
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      {/* Zoom Watcher Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Zoom Folder Monitoring</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={isWatching ? "destructive" : "default"}
              size="sm"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const response = await fetch("/api/zoom-watcher", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: isWatching ? "stop" : "start",
                      zoomFolderPath: zoomFolderPath,
                    }),
                  });
                  const result = await response.json();
                  console.log("Zoom watcher response:", result);
                  if (result.message === "success") {
                    setIsWatching(!isWatching);
                    toast.success(
                      isWatching
                        ? "Zoom watcher stopped"
                        : "Zoom watcher started"
                    );
                  } else {
                    toast.error(result.message || "Failed to toggle watcher");
                  }
                } catch (error) {
                  console.error("Zoom watcher error:", error);
                  toast.error(`Failed to toggle watcher: ${error}`);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
            >
              {isLoading
                ? "⏳"
                : isWatching
                ? "⏹️ Stop Watching"
                : "▶️ Start Watching"}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-muted-foreground">
            Zoom Folder Path
          </label>
          <Input
            value={zoomFolderPath}
            onChange={(e) => setZoomFolderPath(e.target.value)}
            placeholder="C:\Users\anmol\OneDrive\Documents\Zoom"
            className="text-xs"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Status: {isWatching ? "🟢 Monitoring" : "🔴 Stopped"}
          </span>
          <Badge variant={isWatching ? "default" : "secondary"}>
            {isWatching ? "Active" : "Inactive"}
          </Badge>
        </div>

        {isWatching && (
          <div className="rounded-lg bg-green-50 p-3 text-xs text-green-800">
            <div className="flex items-center gap-1 mb-1">
              <Activity className="h-3 w-3" />
              <span className="font-medium">Automation Active</span>
            </div>
            <p>
              Watching for new Zoom recordings in the specified folder. When
              detected, they will be automatically transcribed and processed.
            </p>
          </div>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch("/api/get-recent-zoom-meetings");
                const result = await response.json();
                if (result.message === "success") {
                  console.log("Recent meetings:", result.meetings);
                  toast.success(
                    `Found ${result.meetings.length} recent meetings`
                  );

                  if (result.meetings.length > 0) {
                    const firstMeeting = result.meetings[0];
                    nodeConnection.setZoomNode((prev: any) => ({
                      ...prev,
                      meetingId: firstMeeting.meetingId,
                      meetingTitle: firstMeeting.fileName,
                    }));
                  }
                } else {
                  toast.error(result.error);
                }
              } catch (error) {
                toast.error("Failed to fetch recent meetings");
              }
            }}
          >
            🔍 Auto-Detect Recent Meetings
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mb-1">
          Meeting ID (Auto-detected or Manual)
        </p>
        <Input
          type="text"
          value={nodeConnection.zoomNode.meetingId}
          onChange={(e) => {
            nodeConnection.setZoomNode((prev: any) => ({
              ...prev,
              meetingId: e.target.value,
            }));
          }}
          placeholder="Enter meeting ID or leave empty for auto-detection"
          className="text-xs"
        />

        <p className="text-xs text-muted-foreground mb-1 mt-2">
          Meeting Title (Optional)
        </p>
        <Input
          type="text"
          value={nodeConnection.zoomNode.meetingTitle}
          onChange={(e) => {
            nodeConnection.setZoomNode((prev: any) => ({
              ...prev,
              meetingTitle: e.target.value,
            }));
          }}
          placeholder="Enter meeting title..."
          className="text-xs"
        />

        <p className="text-xs text-muted-foreground mb-1 mt-2">
          Upload Transcript File (Alternative)
        </p>
        <input
          type="file"
          accept=".txt,.doc,.docx"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              try {
                const text = await file.text();
                toast.info("Processing uploaded transcript...");

                const result = await processUploadedTranscript(
                  text,
                  nodeConnection.zoomNode.meetingTitle || "Uploaded Meeting",
                  nodeConnection.zoomNode.meetingId
                );

                if (result.message === "success") {
                  toast.success(
                    "✅ Summary generated from uploaded transcript!"
                  );
                  nodeConnection.setZoomNode((prev: any) => ({
                    ...prev,
                    transcript: result.transcript,
                    summary: result.summary,
                  }));
                } else {
                  toast.error(result.error || "Failed to process transcript");
                }
              } catch (error) {
                toast.error("Failed to read file");
              }
            }
          }}
          className="text-xs"
        />
      </div>
    </>
  );
}

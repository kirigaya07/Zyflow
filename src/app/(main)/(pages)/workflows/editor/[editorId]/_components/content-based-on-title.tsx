import { AccordionContent } from "@/components/ui/accordion";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import { EditorState } from "@/providers/editor-provider";
import { nodeMapper } from "@/lib/types";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { onContentChange } from "@/lib/editor-utils";
import GoogleFileDetails from "./google-file-details";
import GoogleDriveFiles from "./google-drive-files";
import ActionButton from "./action-button";
import ZoomWatcherSection from "./zoom-watcher-section";
import axios from "axios";
import { toast } from "sonner";
import { Activity } from "lucide-react";
import { processUploadedTranscript } from "../../../_actions/zoom-upload-action";

export interface Option {
  value: string;
  label: string;
  disable?: boolean;
  /** fixed option that can't be removed. */
  fixed?: boolean;
  /** Group the options by providing key. */
  [key: string]: string | boolean | undefined;
}
interface GroupOption {
  [key: string]: Option[];
}

type Props = {
  nodeConnection: ConnectionProviderProps;
  newState: EditorState;
  file: any;
  setFile: (file: any) => void;
  selectedSlackChannels: Option[];
  setSelectedSlackChannels: (value: Option[]) => void;
};

const ContentBasedOnTitle = ({
  nodeConnection,
  newState,
  file,
  setFile,
  selectedSlackChannels,
  setSelectedSlackChannels,
}: Props) => {
  const { selectedNode } = newState.editor;
  const title = selectedNode.data.title;
  const [localContent, setLocalContent] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Zoom watcher state
  const [isWatching, setIsWatching] = useState(false);
  const [zoomFolderPath, setZoomFolderPath] = useState(
    "C:\\Users\\anmol\\OneDrive\\Documents\\Zoom"
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const reqGoogle = async () => {
      try {
        const response = await axios.get("/api/drive");
        if (
          response &&
          response.data &&
          response.data.message &&
          response.data.message.files
        ) {
          console.log(response.data.message.files[0]);
          toast.message("Fetched File");
          setFile(response.data.message.files[0]);
        } else {
          console.log("No files found or invalid response structure");
          toast.message("No files found");
        }
      } catch (error) {
        console.error("Error fetching Drive files:", error);
        toast.error("Failed to fetch Drive files");
      }
    };
    reqGoogle();
  }, []);

  // @ts-ignore
  const nodeConnectionType: any = nodeConnection[nodeMapper[title]];

  // Initialize local content from node connection
  useEffect(() => {
    if (!isInitialized) {
      if (title === "Email") {
        setLocalContent(nodeConnection.emailNode.content || "");
        setIsInitialized(true);
      } else if (title === "Zoom") {
        setLocalContent(nodeConnection.zoomNode.summary || "");
        setIsInitialized(true);
      } else if (nodeConnectionType?.content !== undefined) {
        setLocalContent(nodeConnectionType.content || "");
        setIsInitialized(true);
      }
    }
  }, [
    nodeConnectionType,
    nodeConnection.emailNode.content,
    nodeConnection.zoomNode.summary,
    isInitialized,
    title,
  ]);

  // Debounced update to nodeConnection for content
  useEffect(() => {
    if (!isInitialized) return;

    const timeoutId = setTimeout(() => {
      if (localContent !== nodeConnectionType?.content) {
        const fakeEvent = {
          target: { value: localContent },
        } as React.ChangeEvent<HTMLInputElement>;
        onContentChange(nodeConnection, title, fakeEvent);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localContent, isInitialized]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalContent(event.target.value);

    // For Email, also update the nodeConnection
    if (title === "Email") {
      nodeConnection.setEmailNode((prev: any) => ({
        ...prev,
        content: event.target.value,
      }));
    }

    // For Zoom, also update the nodeConnection
    if (title === "Zoom") {
      nodeConnection.setZoomNode((prev: any) => ({
        ...prev,
        summary: event.target.value,
      }));
    }
  };

  const isConnected =
    title === "Google Drive"
      ? true // Google Drive is always connected via OAuth during login
      : title === "Email"
      ? true // Email uses same Google OAuth as Drive, so always connected
      : title === "Zoom"
      ? true // Zoom uses same Google OAuth as Drive, so always connected
      : nodeConnectionType &&
        !!nodeConnectionType[
          `${
            title === "Slack"
              ? "slackAccessToken"
              : title === "Discord"
              ? "webhookURL"
              : title === "Notion"
              ? "accessToken"
              : ""
          }`
        ];

  // Debug logging for Google Drive
  if (title === "Google Drive") {
    console.log("Google Drive content rendering:", {
      title,
      isConnected,
      file,
      nodeConnectionType,
    });
  }

  if (!isConnected) return <p>Not connected</p>;

  return (
    <AccordionContent>
      <Card>
        {title === "Discord" && (
          <CardHeader>
            <CardTitle>{nodeConnectionType.webhookName}</CardTitle>
            <CardDescription>{nodeConnectionType.guildName}</CardDescription>
          </CardHeader>
        )}
        {title === "Email" && (
          <CardHeader>
            <CardTitle>Email Configuration</CardTitle>
            <CardDescription>
              Send email notifications via Gmail API
            </CardDescription>
          </CardHeader>
        )}
        {title === "Zoom" && (
          <CardHeader>
            <CardTitle>Zoom Configuration</CardTitle>
            <CardDescription>
              Generate meeting summaries and save to Drive
            </CardDescription>
          </CardHeader>
        )}
        <div className="flex flex-col gap-3 px-6 py-3 pb-20">
          {title === "Email" ? (
            <>
              <p>Email Recipients</p>
              <Input
                type="text"
                value={nodeConnection.emailNode.recipients.join(", ")}
                onChange={(e) => {
                  const emails = e.target.value
                    .split(",")
                    .map((email) => email.trim())
                    .filter((email) => email);
                  nodeConnection.setEmailNode((prev: any) => ({
                    ...prev,
                    recipients: emails,
                  }));
                }}
                placeholder="Enter email addresses separated by commas (e.g., user1@example.com, user2@example.com)"
              />

              <p>Email Subject</p>
              <Input
                type="text"
                value={nodeConnection.emailNode.subject}
                onChange={(e) => {
                  nodeConnection.setEmailNode((prev: any) => ({
                    ...prev,
                    subject: e.target.value,
                  }));
                }}
                placeholder="Enter email subject..."
              />

              <p>Email Content</p>
              <Input
                type="text"
                value={localContent}
                onChange={handleInputChange}
                placeholder="Type your email content here..."
              />
            </>
          ) : title === "Zoom" ? (
            <ZoomWatcherSection nodeConnection={nodeConnection} />
          ) : (
            <>
              <p>{title === "Notion" ? "Values to be stored" : "Message"}</p>
              <Input
                type="text"
                value={localContent}
                onChange={handleInputChange}
                placeholder="Type your message here..."
              />
            </>
          )}

          {JSON.stringify(file) !== "{}" && title !== "Google Drive" && (
            <Card className="w-full">
              <CardContent className="px-2 py-3">
                <div className="flex flex-col gap-4">
                  <CardDescription>Drive File</CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <GoogleFileDetails
                      nodeConnection={nodeConnection}
                      title={title}
                      gFile={file}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {title === "Google Drive" && <GoogleDriveFiles />}
          <ActionButton
            currentService={title}
            nodeConnection={nodeConnection}
            channels={selectedSlackChannels}
            setChannels={setSelectedSlackChannels}
          />
        </div>
      </Card>
    </AccordionContent>
  );
};

export default ContentBasedOnTitle;

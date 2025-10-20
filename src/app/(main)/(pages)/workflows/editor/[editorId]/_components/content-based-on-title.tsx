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
import { onContentChange } from "@/lib/editor-utils";
import GoogleFileDetails from "./google-file-details";
import GoogleDriveFiles from "./google-drive-files";
import ActionButton from "./action-button";
import axios from "axios";
import { toast } from "sonner";

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
    if (!isInitialized && nodeConnectionType?.content !== undefined) {
      setLocalContent(nodeConnectionType.content || "");
      setIsInitialized(true);
    }
  }, [nodeConnectionType, isInitialized]);

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
  };

  if (!nodeConnectionType) return <p>Not connected</p>;

  const isConnected =
    title === "Google Drive"
      ? !nodeConnection.isLoading
      : !!nodeConnectionType[
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
        <div className="flex flex-col gap-3 px-6 py-3 pb-20">
          <p>{title === "Notion" ? "Values to be stored" : "Message"}</p>

          <Input
            type="text"
            value={localContent}
            onChange={handleInputChange}
            placeholder="Type your message here..."
          />

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

import React, { useCallback } from "react";
import { Option } from "./content-based-on-title";
import { ConnectionProviderProps } from "@/providers/connections-provider";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { postContentToWebHook } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import { onCreateNodeTemplate } from "../../../_actions/workflow-connections";
import { toast } from "sonner";
import { onCreateNewPageInDatabase } from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import { postMessageToSlack } from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { processZoomAction } from "../../../_actions/zoom-action";

type Props = {
  currentService: string;
  nodeConnection: ConnectionProviderProps;
  channels?: Option[];
  setChannels?: (value: Option[]) => void;
};

const ActionButton = ({
  currentService,
  nodeConnection,
  channels,
  setChannels,
}: Props) => {
  const pathname = usePathname();

  const onSendDiscordMessage = useCallback(async () => {
    console.log("Discord node content:", nodeConnection.discordNode.content);
    console.log("Discord webhook URL:", nodeConnection.discordNode.webhookURL);

    if (!nodeConnection.discordNode.webhookURL) {
      toast.error(
        "Discord not connected. Please connect Discord in the Connections page first."
      );
      return;
    }

    // Use the actual content, or fallback if empty
    const messageContent =
      nodeConnection.discordNode.content?.trim() || "Test message from Zyflow!";
    console.log("Sending message:", messageContent);

    const response = await postContentToWebHook(
      messageContent,
      nodeConnection.discordNode.webhookURL
    );

    if (response.message == "success") {
      nodeConnection.setDiscordNode((prev: any) => ({
        ...prev,
        content: "",
      }));
    }
  }, [nodeConnection]);

  const onStoreNotionContent = useCallback(async () => {
    console.log(
      nodeConnection.notionNode.databaseId,
      nodeConnection.notionNode.accessToken,
      nodeConnection.notionNode.content
    );

    if (!nodeConnection.notionNode.accessToken) {
      toast.error(
        "Notion not connected. Please connect Notion in the Connections page first."
      );
      return;
    }

    const response = await onCreateNewPageInDatabase(
      nodeConnection.notionNode.databaseId,
      nodeConnection.notionNode.accessToken,
      nodeConnection.notionNode.content
    );
    if (response) {
      nodeConnection.setNotionNode((prev: any) => ({
        ...prev,
        content: "",
      }));
    }
  }, [nodeConnection]);

  const onSendTestEmail = useCallback(async () => {
    if (nodeConnection.emailNode.recipients.length === 0) {
      toast.error("Please add at least one email recipient");
      return;
    }

    if (!nodeConnection.emailNode.subject.trim()) {
      toast.error("Please add an email subject");
      return;
    }

    if (!nodeConnection.emailNode.content.trim()) {
      toast.error("Please add email content");
      return;
    }

    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: nodeConnection.emailNode.recipients,
          subject: nodeConnection.emailNode.subject,
          content: nodeConnection.emailNode.content,
        }),
      });

      const result = await response.json();

      if (result.message === "success") {
        toast.success("Test email sent successfully!");
        nodeConnection.setEmailNode((prev: any) => ({
          ...prev,
          content: "",
        }));
      } else {
        toast.error(`Failed to send email: ${result.message}`);
      }
    } catch (error) {
      toast.error("Error sending test email");
      console.error("Test email error:", error);
    }
  }, [nodeConnection]);

  const onTestZoom = useCallback(async () => {
    try {
      toast.info("🔍 Processing Zoom meeting summary...");

      const result = await processZoomAction(
        nodeConnection.zoomNode.meetingId,
        nodeConnection.zoomNode.meetingTitle,
        !nodeConnection.zoomNode.meetingId.trim() // Auto-detect if no meeting ID
      );

      if (result.message === "success") {
        toast.success("🎉 Meeting summary generated and saved to Drive!");
        nodeConnection.setZoomNode((prev: any) => ({
          ...prev,
          meetingId: result.meetingId,
          meetingTitle: result.meetingTitle,
          transcript: result.transcript,
          summary: result.summary,
        }));
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error processing Zoom meeting");
      console.error("Zoom error:", error);
    }
  }, [nodeConnection]);

  const onStoreSlackContent = useCallback(async () => {
    if (!nodeConnection.slackNode.slackAccessToken) {
      toast.error(
        "Slack not connected. Please connect Slack in the Connections page first."
      );
      return;
    }

    const response = await postMessageToSlack(
      nodeConnection.slackNode.slackAccessToken,
      channels!,
      nodeConnection.slackNode.content
    );
    if (response.message == "Success") {
      toast.success("Message sent successfully");
      nodeConnection.setSlackNode((prev: any) => ({
        ...prev,
        content: "",
      }));
      setChannels!([]);
    } else {
      toast.error(response.message);
    }
  }, [nodeConnection, channels, setChannels]);

  const onCreateLocalNodeTempate = useCallback(async () => {
    if (currentService === "Discord") {
      const response = await onCreateNodeTemplate(
        nodeConnection.discordNode.content,
        currentService,
        pathname.split("/").pop()!
      );

      if (response) {
        toast.message(response);
      }
    }
    if (currentService === "Slack") {
      const response = await onCreateNodeTemplate(
        nodeConnection.slackNode.content,
        currentService,
        pathname.split("/").pop()!,
        channels,
        nodeConnection.slackNode.slackAccessToken
      );

      if (response) {
        toast.message(response);
      }
    }

    if (currentService === "Notion") {
      const response = await onCreateNodeTemplate(
        JSON.stringify(nodeConnection.notionNode.content),
        currentService,
        pathname.split("/").pop()!,
        [],
        nodeConnection.notionNode.accessToken,
        nodeConnection.notionNode.databaseId
      );

      if (response) {
        toast.message(response);
      }
    }

    if (currentService === "Email") {
      const response = await onCreateNodeTemplate(
        nodeConnection.emailNode.content,
        currentService,
        pathname.split("/").pop()!,
        [],
        undefined,
        undefined,
        nodeConnection.emailNode.recipients.map((email) => ({
          label: email,
          value: email,
        })),
        nodeConnection.emailNode.subject
      );

      if (response) {
        toast.message(response);
      }
    }

    if (currentService === "Zoom") {
      const response = await onCreateNodeTemplate(
        nodeConnection.zoomNode.summary,
        currentService,
        pathname.split("/").pop()!,
        [],
        undefined,
        undefined,
        undefined,
        undefined,
        nodeConnection.zoomNode.meetingId,
        nodeConnection.zoomNode.meetingTitle
      );

      if (response) {
        toast.message(response);
      }
    }
  }, [nodeConnection, channels, currentService, pathname]);

  const renderActionButton = () => {
    switch (currentService) {
      case "Discord":
        return (
          <>
            <Button variant="outline" onClick={onSendDiscordMessage}>
              Test Message
            </Button>
            <Button onClick={onCreateLocalNodeTempate} variant="outline">
              Save Template
            </Button>
          </>
        );

      case "Notion":
        return (
          <>
            <Button variant="outline" onClick={onStoreNotionContent}>
              Test
            </Button>
            <Button onClick={onCreateLocalNodeTempate} variant="outline">
              Save Template
            </Button>
          </>
        );

      case "Slack":
        return (
          <>
            <Button variant="outline" onClick={onStoreSlackContent}>
              Send Message
            </Button>
            <Button onClick={onCreateLocalNodeTempate} variant="outline">
              Save Template
            </Button>
          </>
        );

      case "Email":
        return (
          <>
            <Button variant="outline" onClick={onSendTestEmail}>
              Send Test Email
            </Button>
            <Button variant="outline" onClick={onCreateLocalNodeTempate}>
              Save Template
            </Button>
          </>
        );

      case "Zoom":
        return (
          <>
            <Button variant="outline" onClick={onTestZoom}>
              Generate Summary
            </Button>
            <Button variant="outline" onClick={onCreateLocalNodeTempate}>
              Save Template
            </Button>
          </>
        );

      default:
        return null;
    }
  };
  return renderActionButton();
};

export default ActionButton;

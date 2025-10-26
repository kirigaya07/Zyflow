import { ConnectionProviderProps } from "@/providers/connections-provider";
import { EditorCanvasCardType } from "./types";
import { EditorState } from "@/providers/editor-provider";
import { getDiscordConnectionUrl } from "@/app/(main)/(pages)/connections/_actions/discord-connection";
import {
  getNotionConnection,
  getNotionDatabase,
} from "@/app/(main)/(pages)/connections/_actions/notion-connection";
import {
  getSlackConnection,
  listBotChannels,
} from "@/app/(main)/(pages)/connections/_actions/slack-connection";
import { Option } from "@/components/ui/multiple-selector";

export const onDragStart = (
  event: any,
  nodeType: EditorCanvasCardType["type"]
) => {
  event.dataTransfer.setData("application/reactflow", nodeType);
  event.dataTransfer.effectAllowed = "move";
};

export const onSlackContent = (
  nodeConnection: ConnectionProviderProps,
  event: React.ChangeEvent<HTMLInputElement>
) => {
  nodeConnection.setSlackNode((prev: any) => ({
    ...prev,
    content: event.target.value,
  }));
};

export const onDiscordContent = (
  nodeConnection: ConnectionProviderProps,
  event: React.ChangeEvent<HTMLInputElement>
) => {
  nodeConnection.setDiscordNode((prev: any) => ({
    ...prev,
    content: event.target.value,
  }));
};

export const onContentChange = (
  nodeConnection: ConnectionProviderProps,
  nodeType: string,
  event: React.ChangeEvent<HTMLInputElement>
) => {
  if (nodeType === "Slack") {
    onSlackContent(nodeConnection, event);
  } else if (nodeType === "Discord") {
    onDiscordContent(nodeConnection, event);
  } else if (nodeType === "Notion") {
    onNotionContent(nodeConnection, event);
  }
};

export const onAddTemplateSlack = (
  nodeConnection: ConnectionProviderProps,
  template: string
) => {
  nodeConnection.setSlackNode((prev: any) => ({
    ...prev,
    content: `${prev.content} ${template}`,
  }));
};

export const onAddTemplateDiscord = (
  nodeConnection: ConnectionProviderProps,
  template: string
) => {
  nodeConnection.setDiscordNode((prev: any) => ({
    ...prev,
    content: `${prev.content} ${template}`,
  }));
};

export const onAddTemplate = (
  nodeConnection: ConnectionProviderProps,
  title: string,
  template: string
) => {
  if (title === "Slack") {
    onAddTemplateSlack(nodeConnection, template);
  } else if (title === "Discord") {
    onAddTemplateDiscord(nodeConnection, template);
  }
};

// Add a loading state to prevent multiple simultaneous calls
let isLoadingConnections = false;

export const preloadAllConnections = async (
  nodeConnection: ConnectionProviderProps,
  googleFile: any
) => {
  if (isLoadingConnections) {
    return;
  }

  isLoadingConnections = true;

  try {
    // Load Discord connection
    const discordConnection = await getDiscordConnectionUrl();
    if (discordConnection) {
      nodeConnection.setDiscordNode((prev: any) => ({
        webhookURL: discordConnection.url,
        content: prev?.content || "",
        webhookName: discordConnection.name,
        guildName: discordConnection.guildName,
      }));
    }

    // Load Notion connection
    const notionConnection = await getNotionConnection();
    if (notionConnection) {
      nodeConnection.setNotionNode({
        accessToken: notionConnection.accessToken,
        databaseId: notionConnection.databaseId,
        workspaceName: notionConnection.workspaceName,
        content: {
          name: googleFile.name || "",
          kind: googleFile.kind || "",
          type: googleFile.mimeType || "",
        },
      });
    }

    // Load Slack connection
    const slackConnection = await getSlackConnection();
    if (slackConnection) {
      nodeConnection.setSlackNode((prev: any) => ({
        appId: slackConnection.appId,
        authedUserId: slackConnection.authedUserId,
        authedUserToken: slackConnection.authedUserToken,
        slackAccessToken: slackConnection.slackAccessToken,
        botUserId: slackConnection.botUserId,
        teamId: slackConnection.teamId,
        teamName: slackConnection.teamName,
        userId: slackConnection.userId,
        content: prev?.content || "",
      }));
    }
  } catch (error) {
    console.error("Error preloading connections:", error);
  } finally {
    isLoadingConnections = false;
  }
};

export const onConnections = async (
  nodeConnection: ConnectionProviderProps,
  editorState: EditorState,
  googleFile: any
) => {
  if (editorState.editor.selectedNode.data.title == "Discord") {
    const connection = await getDiscordConnectionUrl();
    if (connection) {
      nodeConnection.setDiscordNode((prev: any) => ({
        webhookURL: connection.url,
        content: prev?.content || "",
        webhookName: connection.name,
        guildName: connection.guildName,
      }));
    }
  }
  if (editorState.editor.selectedNode.data.title == "Notion") {
    const connection = await getNotionConnection();
    if (connection) {
      nodeConnection.setNotionNode({
        accessToken: connection.accessToken,
        databaseId: connection.databaseId,
        workspaceName: connection.workspaceName,
        content: {
          name: googleFile.name,
          kind: googleFile.kind,
          type: googleFile.mimeType,
        },
      });

      if (nodeConnection.notionNode.databaseId !== "") {
        const response = await getNotionDatabase(
          nodeConnection.notionNode.databaseId,
          nodeConnection.notionNode.accessToken
        );
      }
    }
  }
  if (editorState.editor.selectedNode.data.title == "Slack") {
    const connection = await getSlackConnection();
    if (connection) {
      nodeConnection.setSlackNode((prev: any) => ({
        appId: connection.appId,
        authedUserId: connection.authedUserId,
        authedUserToken: connection.authedUserToken,
        slackAccessToken: connection.slackAccessToken,
        botUserId: connection.botUserId,
        teamId: connection.teamId,
        teamName: connection.teamName,
        userId: connection.userId,
        content: prev?.content || "",
      }));
    }
  }
};

export const fetchBotSlackChannels = async (
  token: string,
  setSlackChannels: (slackChannels: Option[]) => void
) => {
  await listBotChannels(token)?.then((channels) => setSlackChannels(channels));
};

export const onNotionContent = (
  nodeConnection: ConnectionProviderProps,
  event: React.ChangeEvent<HTMLInputElement>
) => {
  nodeConnection.setNotionNode((prev: any) => ({
    ...prev,
    content: event.target.value,
  }));
};

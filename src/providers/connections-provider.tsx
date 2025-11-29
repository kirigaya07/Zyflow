"use client";
import { createContext, useContext, useState } from "react";

/**
 * Connection provider props interface that manages all external service integrations.
 * This provider handles state for various third-party service connections including
 * Discord, Google, Notion, Email, Zoom, and Slack integrations.
 */
export type ConnectionProviderProps = {
  /** Discord webhook integration configuration */
  discordNode: {
    webhookURL: string;
    content: string;
    webhookName: string;
    guildName: string;
  };
  /** Function to update Discord node configuration */
  setDiscordNode: React.Dispatch<React.SetStateAction<any>>;
  /** Google Drive/Services integration data array */
  googleNode: {}[];
  /** Function to update Google node configuration */
  setGoogleNode: React.Dispatch<React.SetStateAction<any>>;
  /** Notion workspace and database integration settings */
  notionNode: {
    accessToken: string;
    databaseId: string;
    workspaceName: string;
    content: "";
  };
  /** Email service configuration for notifications */
  emailNode: {
    recipients: string[];
    subject: string;
    content: string;
  };
  /** Function to update email node configuration */
  setEmailNode: React.Dispatch<React.SetStateAction<any>>;
  /** Zoom meeting integration data and transcription */
  zoomNode: {
    meetingId: string;
    meetingTitle: string;
    transcript: string;
    summary: string;
  };
  /** Function to update Zoom node configuration */
  setZoomNode: React.Dispatch<React.SetStateAction<any>>;
  /** Workflow template configuration for different services */
  workflowTemplate: {
    discord?: string;
    notion?: string;
    slack?: string;
    email?: string;
    zoom?: string;
  };
  /** Function to update Notion node configuration */
  setNotionNode: React.Dispatch<React.SetStateAction<any>>;
  /** Slack workspace and bot integration settings */
  slackNode: {
    appId: string;
    authedUserId: string;
    authedUserToken: string;
    slackAccessToken: string;
    botUserId: string;
    teamId: string;
    teamName: string;
    content: string;
  };
  /** Function to update Slack node configuration */
  setSlackNode: React.Dispatch<React.SetStateAction<any>>;
  /** Function to update workflow template configuration */
  setWorkFlowTemplate: React.Dispatch<
    React.SetStateAction<{
      discord?: string;
      notion?: string;
      slack?: string;
      email?: string;
      zoom?: string;
    }>
  >;
  /** Loading state indicator for connection operations */
  isLoading: boolean;
  /** Function to update loading state */
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

/**
 * Props interface for components that accept children within the connections context.
 */
type ConnectionWithChildProps = {
  children: React.ReactNode;
};

/**
 * Initial default values for all connection nodes and states.
 * Provides empty/default configurations for all supported integrations.
 */
const InitialValues: ConnectionProviderProps = {
  discordNode: {
    webhookURL: "",
    content: "",
    webhookName: "",
    guildName: "",
  },
  googleNode: [],
  notionNode: {
    accessToken: "",
    databaseId: "",
    workspaceName: "",
    content: "",
  },
  emailNode: {
    recipients: [],
    subject: "",
    content: "",
  },
  zoomNode: {
    meetingId: "",
    meetingTitle: "",
    transcript: "",
    summary: "",
  },
  workflowTemplate: {
    discord: "",
    notion: "",
    slack: "",
    email: "",
    zoom: "",
  },
  slackNode: {
    appId: "",
    authedUserId: "",
    authedUserToken: "",
    slackAccessToken: "",
    botUserId: "",
    teamId: "",
    teamName: "",
    content: "",
  },
  isLoading: false,
  setGoogleNode: () => undefined,
  setDiscordNode: () => undefined,
  setNotionNode: () => undefined,
  setEmailNode: () => undefined,
  setZoomNode: () => undefined,
  setSlackNode: () => undefined,
  setIsLoading: () => undefined,
  setWorkFlowTemplate: () => undefined,
};

/** React context for managing all external service connections */
const ConnectionsContext = createContext(InitialValues);
const { Provider } = ConnectionsContext;

/**
 * ConnectionsProvider component that manages state for all external service integrations.
 *
 * This provider handles:
 * - Discord webhook configurations
 * - Google Drive/Services integration
 * - Notion workspace and database connections
 * - Email service settings
 * - Zoom meeting data and transcription
 * - Slack workspace integration
 * - Workflow templates for automation
 * - Loading states for connection operations
 *
 * @param children - Child components that will have access to connections context
 * @returns JSX.Element - Provider wrapper with connections context
 */
export const ConnectionsProvider = ({ children }: ConnectionWithChildProps) => {
  const [discordNode, setDiscordNode] = useState(InitialValues.discordNode);
  const [googleNode, setGoogleNode] = useState(InitialValues.googleNode);
  const [notionNode, setNotionNode] = useState(InitialValues.notionNode);
  const [emailNode, setEmailNode] = useState(InitialValues.emailNode);
  const [zoomNode, setZoomNode] = useState(InitialValues.zoomNode);
  const [slackNode, setSlackNode] = useState(InitialValues.slackNode);
  const [isLoading, setIsLoading] = useState(InitialValues.isLoading);
  const [workflowTemplate, setWorkFlowTemplate] = useState(
    InitialValues.workflowTemplate
  );

  const values = {
    discordNode,
    setDiscordNode,
    googleNode,
    setGoogleNode,
    notionNode,
    setNotionNode,
    emailNode,
    setEmailNode,
    zoomNode,
    setZoomNode,
    slackNode,
    setSlackNode,
    isLoading,
    setIsLoading,
    workflowTemplate,
    setWorkFlowTemplate,
  };

  return <Provider value={values}>{children}</Provider>;
};

/**
 * Custom hook to access the connections context.
 *
 * @returns Object containing nodeConnection with all connection states and setters
 * @throws Error if used outside of ConnectionsProvider
 */
export const useNodeConnections = () => {
  const nodeConnection = useContext(ConnectionsContext);
  return { nodeConnection };
};

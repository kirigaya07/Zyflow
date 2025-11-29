/**
 * Application Constants
 *
 * This file contains all static configuration data used throughout the Zyflow application.
 * Includes navigation menus, product showcases, editor configurations, and connection definitions.
 */

import Category from "@/components/icons/category";
import Logs from "@/components/icons/clipboard";
import Templates from "@/components/icons/cloud_download";
import Home from "@/components/icons/home";
import Payment from "@/components/icons/payment";
import Settings from "@/components/icons/settings";
import Workflows from "@/components/icons/workflows";
import { Connection } from "./types";

/**
 * Client portfolio/testimonial images configuration.
 * Generates an array of client image references for display purposes.
 */
export const clients = [...new Array(10)].map((client, index) => ({
  href: `/${index + 1}.png`,
}));

/**
 * Product showcase configuration for the landing page.
 * Contains featured products and services with their respective links and thumbnails.
 * Used to display partner companies and successful integrations.
 */
export const products = [
  {
    title: "Moonbeam",
    link: "https://gomoonbeam.com",
    thumbnail: "/p1.png",
  },
  {
    title: "Cursor",
    link: "https://cursor.so",
    thumbnail: "/p2.png",
  },
  {
    title: "Rogue",
    link: "https://userogue.com",
    thumbnail: "/p3.png",
  },

  {
    title: "Editorially",
    link: "https://editorially.org",
    thumbnail: "/p4.png",
  },
  {
    title: "Editrix AI",
    link: "https://editrix.ai",
    thumbnail: "/p5.png",
  },
  {
    title: "Pixel Perfect",
    link: "https://app.pixelperfect.quest",
    thumbnail: "/p6.png",
  },

  {
    title: "Algochurn",
    link: "https://algochurn.com",
    thumbnail: "/p1.png",
  },
  {
    title: "Aceternity UI",
    link: "https://ui.aceternity.com",
    thumbnail: "/p2.png",
  },
  {
    title: "Tailwind Master Kit",
    link: "https://tailwindmasterkit.com",
    thumbnail: "/p3.png",
  },
  {
    title: "SmartBridge",
    link: "https://smartbridgetech.com",
    thumbnail: "/p4.png",
  },
  {
    title: "Renderwork Studio",
    link: "https://renderwork.studio",
    thumbnail: "/p5.png",
  },

  {
    title: "Creme Digital",
    link: "https://cremedigital.com",
    thumbnail: "/p6.png",
  },
  {
    title: "Golden Bells Academy",
    link: "https://goldenbellsacademy.com",
    thumbnail: "/p1.png",
  },
  {
    title: "Invoker Labs",
    link: "https://invoker.lol",
    thumbnail: "/p2.png",
  },
  {
    title: "E Free Invoice",
    link: "https://efreeinvoice.com",
    thumbnail: "/p3.png",
  },
];

/**
 * Main navigation menu configuration for the application sidebar.
 * Defines the primary navigation items with their corresponding icons and routes.
 * Each menu item includes a display name, icon component, and route path.
 */
export const menuOptions = [
  { name: "Dashboard", Component: Home, href: "/dashboard" },
  { name: "Workflows", Component: Workflows, href: "/workflows" },
  { name: "Settings", Component: Settings, href: "/settings" },
  { name: "Connections", Component: Category, href: "/connections" },
  { name: "Billing", Component: Payment, href: "/billing" },
  { name: "Templates", Component: Templates, href: "/templates" },
  { name: "Logs", Component: Logs, href: "/logs" },
];

/**
 * Editor canvas card type definitions for workflow automation.
 * Defines all available node types that can be used in the workflow editor.
 * Each card type includes a description and classification (Action/Trigger).
 *
 * Card Types:
 * - Trigger: Events that start a workflow (e.g., file changes, webhooks)
 * - Action: Operations performed during workflow execution (e.g., send email, create files)
 */
export const EditorCanvasDefaultCardTypes = {
  Email: { description: "Send and email to a user", type: "Action" },
  Zoom: {
    description: "Generate meeting summary and save to Drive",
    type: "Action",
  },
  Condition: {
    description: "Boolean operator that creates different conditions lanes.",
    type: "Action",
  },
  AI: {
    description:
      "Use the power of AI to summarize, respond, create and much more.",
    type: "Action",
  },
  Slack: { description: "Send a notification to slack", type: "Action" },
  "Google Drive": {
    description:
      "Connect with Google drive to trigger actions or to create files and folders.",
    type: "Trigger",
  },
  Notion: { description: "Create entries directly in notion.", type: "Action" },
  "Custom Webhook": {
    description:
      "Connect any app that has an API key and send data to your applicaiton.",
    type: "Action",
  },
  Discord: {
    description: "Post messages to your discord server",
    type: "Action",
  },
  "Google Calendar": {
    description: "Create a calendar invite.",
    type: "Action",
  },
  Trigger: {
    description: "An event that starts the workflow.",
    type: "Trigger",
  },
  Action: {
    description: "An event that happens after the workflow begins",
    type: "Action",
  },
  Wait: {
    description: "Delay the next action step by using the wait timer.",
    type: "Action",
  },
};

/**
 * Available connection integrations configuration.
 * Defines all supported third-party service integrations with their metadata.
 *
 * Each connection includes:
 * - title: Display name of the service
 * - description: Brief explanation of the integration capabilities
 * - image: Icon/logo path for the service
 * - connectionKey: Reference key for state management
 * - accessTokenKey: Token field name for authentication (optional)
 * - alwaysTrue: Whether connection is always considered active (optional)
 * - slackSpecial: Special handling flag for Slack integration (optional)
 */
export const CONNECTIONS: Connection[] = [
  {
    title: "Google Drive",
    description: "Connect your google drive to listen to folder changes",
    image: "/googleDrive.png",
    connectionKey: "googleNode",
    alwaysTrue: true,
  },
  {
    title: "Discord",
    description: "Connect your discord to send notification and messages",
    image: "/discord.png",
    connectionKey: "discordNode",
    accessTokenKey: "webhookURL",
  },
  {
    title: "Notion",
    description: "Create entries in your notion dashboard and automate tasks.",
    image: "/notion.png",
    connectionKey: "notionNode",
    accessTokenKey: "accessToken",
  },
  {
    title: "Slack",
    description:
      "Use slack to send notifications to team members through your own custom bot.",
    image: "/slack.png",
    connectionKey: "slackNode",
    accessTokenKey: "slackAccessToken",
    slackSpecial: true,
  },
  {
    title: "Email",
    description: "Send email notifications to recipients when events occur.",
    image: "/gmail.png",
    connectionKey: "emailNode",
    accessTokenKey: "emailRecipients",
  },
  {
    title: "Zoom",
    description: "Generate meeting summaries and save to Drive.",
    image: "/zoom.png",
    connectionKey: "zoomNode",
    accessTokenKey: "meetingId",
  },
];

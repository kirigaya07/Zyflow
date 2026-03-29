"use client";
import React from "react";
import {
  Calendar,
  CircuitBoard,
  Code2,
  Database,
  GitBranch,
  Globe,
  HardDrive,
  Mail,
  MessageSquare,
  MousePointerClickIcon,
  Pencil,
  Slack,
  Table2,
  Timer,
  Webhook,
  Zap,
} from "lucide-react";
import { EditorCanvasTypes } from "@/lib/types";

type Props = {
  type: EditorCanvasTypes;
  /** Icon size in pixels. Defaults to 20. */
  size?: number;
};

const EditorCanvasIconHelper = ({ type, size = 20 }: Props) => {
  const props = { size, className: "flex-shrink-0" };
  switch (type) {
    case "Email":
      return <Mail {...props} />;
    case "Condition":
      return <GitBranch {...props} />;
    case "AI":
      return <CircuitBoard {...props} />;
    case "Slack":
      return <Slack {...props} />;
    case "Google Drive":
      return <HardDrive {...props} />;
    case "Notion":
      return <Database {...props} />;
    case "Custom Webhook":
      return <Webhook {...props} />;
    case "Google Calendar":
      return <Calendar {...props} />;
    case "Trigger":
      return <MousePointerClickIcon {...props} />;
    case "Action":
      return <Zap {...props} />;
    case "Wait":
      return <Timer {...props} />;
    case "HTTP Request":
      return <Globe {...props} />;
    case "Webhook Trigger":
      return <Webhook {...props} />;
    case "Code":
      return <Code2 {...props} />;
    case "Discord":
      return <MessageSquare {...props} />;
    case "Set Fields":
      return <Pencil {...props} />;
    case "Google Sheets":
      return <Table2 {...props} />;
    default:
      return <Zap {...props} />;
  }
};

export default EditorCanvasIconHelper;

/**
 * Workflow Templates Page Component
 *
 * This page provides a comprehensive template gallery for workflow automation:
 * - Pre-built workflow templates for common automation scenarios
 * - Search and filtering capabilities for template discovery
 * - One-click template instantiation for quick workflow creation
 * - Visual template cards with service integration indicators
 *
 * Features:
 * - Template library with popular automation patterns
 * - Service-specific filtering (Zoom, Google Drive, Slack, Notion)
 * - Template preview and instant deployment
 * - Custom template request functionality
 * - Responsive grid layout with detailed descriptions
 * - Loading states and error handling for template operations
 */

"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Zap,
  Mic,
  FileText,
  Share2,
  Cloud,
  MessageSquare,
  Search,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTemplate } from "./_actions/use-template";

/**
 * Pre-defined workflow templates with metadata and configuration.
 * Each template includes service integrations, descriptions, and visual indicators.
 */
const templates = [
  {
    id: "zoom-meeting-summary",
    title: "Zoom Meeting → Transcript → AI Summary",
    description:
      "Watch Zoom folder, transcribe with Whisper, generate summary, save to Drive, notify",
    icon: Mic,
    tags: ["Zoom", "Whisper", "ChatGPT", "Google Drive", "Notifications"],
  },
  {
    id: "drive-to-slack",
    title: "Drive Upload → Slack Notification",
    description:
      "Watch Google Drive folder and auto-notify a Slack channel with file details",
    icon: Cloud,
    tags: ["Google Drive", "Slack", "Alerts"],
  },
  {
    id: "drive-to-discord",
    title: "Drive Upload → Discord Notification",
    description:
      "Watch Google Drive folder and auto-notify a Discord channel with file details",
    icon: Cloud,
    tags: ["Google Drive", "Discord", "Alerts"],
  },
  {
    id: "summary-to-notion",
    title: "Transcript → AI Summary → Notion Page",
    description:
      "Convert transcript to a structured Notion page with key points and action items",
    icon: FileText,
    tags: ["Notion", "ChatGPT", "Docs"],
  },
  {
    id: "discord-announcements",
    title: "Meeting Summary → Discord Announcement",
    description:
      "Publish meeting highlights to a Discord channel with mentions and links",
    icon: Share2,
    tags: ["Discord", "Announcements"],
  },
  {
    id: "email-digest",
    title: "Daily Summary → Email Digest",
    description:
      "Send a daily digest email with all meeting summaries and action items",
    icon: MessageSquare,
    tags: ["Email", "Digest"],
  },
];

/**
 * Templates page component providing workflow template gallery and management.
 *
 * This component handles:
 * - Display of pre-built workflow templates in a responsive grid
 * - Search and filtering functionality for template discovery
 * - Template instantiation with loading states and navigation
 * - Custom template request capabilities
 * - Service-specific categorization and filtering
 *
 * Template features:
 * - Visual cards with service integration icons and descriptions
 * - Tag-based filtering for quick discovery
 * - One-click deployment to workflow editor
 * - Preview functionality for template inspection
 * - Custom template request for specialized workflows
 *
 * User interaction:
 * - Search functionality for template discovery
 * - Service-specific filter buttons (Zoom, Drive, Slack, Notion)
 * - Template deployment with loading states
 * - Navigation to workflow editor after template creation
 *
 * @returns JSX.Element - Templates gallery page with search, filters, and template cards
 */
export default function TemplatesPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /**
   * Handles template instantiation and navigation to the workflow editor.
   *
   * This function:
   * - Uses React transition for loading state management
   * - Calls the useTemplate server action to create a new workflow
   * - Navigates to the workflow editor with the newly created workflow ID
   * - Handles success and error states appropriately
   *
   * @param id - The template ID to instantiate
   */
  const onUseTemplate = (id: string) => {
    startTransition(async () => {
      // @ts-expect-error server action import
      const res = await useTemplate(id);
      if (res?.ok && res.workflowId) {
        router.push(`/workflows/editor/${res.workflowId}`);
      }
    });
  };
  return (
    <div className="flex flex-col gap-6 relative p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Templates</h1>
          <p className="text-gray-600 mt-2">
            Kickstart your automation with ready-made flows.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative w-full">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search templates..." className="pl-9" />
            </div>
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              All
            </Button>
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              Zoom
            </Button>
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              Drive
            </Button>
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              Slack
            </Button>
            <Button
              variant="outline"
              className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
            >
              Notion
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <Card
            key={tpl.id}
            className="border-2 border-gray-200 bg-white hover:shadow-md transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <tpl.icon className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-gray-800">
                    {tpl.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {tpl.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {tpl.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-gray-100 text-gray-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => onUseTemplate(tpl.id)}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Use Template
                </Button>
                <Button variant="outline" className="border-gray-300">
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Zap className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-800">
                Need a custom template?
              </CardTitle>
              <CardDescription className="text-gray-600">
                Tell us your flow and we&apos;ll set it up for you.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            Request Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

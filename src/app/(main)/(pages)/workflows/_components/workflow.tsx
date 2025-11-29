/**
 * Individual Workflow Card Component
 *
 * This component displays a single workflow automation as an interactive card with:
 * - Workflow metadata (name, description, publish status)
 * - Service integration icons (Google Drive, Notion, Discord)
 * - Publish toggle switch for activation control
 * - Loading-aware navigation to workflow editor
 *
 * Features:
 * - Real-time publish status toggling with toast notifications
 * - Visual service integration indicators
 * - Click-through navigation to editor with loading states
 * - Responsive card layout with proper spacing and accessibility
 * - Unique element IDs for proper form association
 */

"use client";

import React from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { onFlowPublish } from "../_actions/workflow-connections";
import { toast } from "sonner";
import { LoadingLink } from "@/components/global/loading-link";
// import { toast } from "sonner";
// import { onFlowPublish } from "../_actions/workflow-connections";

/**
 * Props interface for the individual Workflow card component.
 *
 * @interface Props
 * @property {string} name - Display name of the workflow
 * @property {string} description - Workflow description text
 * @property {string} id - Unique workflow identifier for routing and operations
 * @property {boolean | null} publish - Current publish/active status of the workflow
 */
type Props = {
  name: string;
  description: string;
  id: string;
  publish: boolean | null;
};

/**
 * Individual workflow card component that displays workflow information and controls.
 *
 * This component provides:
 * - Visual workflow representation with service integration icons
 * - Clickable card that navigates to workflow editor with loading states
 * - Toggle switch for publishing/unpublishing workflows
 * - Status indicators and user feedback via toast notifications
 *
 * Layout structure:
 * - Left side: Service integration icons, workflow name and description
 * - Right side: Publish status label and toggle switch
 * - Full card is clickable for navigation to editor
 * - Responsive design with proper minimum heights and spacing
 *
 * Accessibility features:
 * - Proper label association with unique IDs
 * - Alt text for service integration images
 * - Semantic HTML structure with proper roles
 *
 * @param description - Workflow description text displayed under the title
 * @param id - Unique workflow ID used for routing and publish operations
 * @param name - Workflow display name shown as card title
 * @param publish - Current publish status (true = active, false = inactive, null = unknown)
 * @returns JSX.Element - Interactive card component with workflow information and controls
 */
const Workflow = ({ description, id, name, publish }: Props) => {
  /**
   * Handles workflow publish/unpublish toggle events.
   *
   * This function:
   * - Reads the current switch state from the button event
   * - Calls the server action to update publish status in database
   * - Shows success/error feedback via toast notifications
   * - Handles the boolean inversion logic for toggle behavior
   *
   * @param event - Switch button click event containing current state
   */
  const onPublishFlow = async (event: React.MouseEvent<HTMLButtonElement>) => {
    const response = await onFlowPublish(
      id,
      event.currentTarget.ariaChecked === "false"
    );
    if (response) toast.message(response);
  };

  return (
    <Card className="flex w-full items-center justify-between min-h-[120px]">
      <CardHeader className="flex-1 py-0">
        <LoadingLink href={`/workflows/editor/${id}`} className="block">
          <div className="flex flex-row gap-3 mb-4">
            <Image
              src="/googleDrive.png"
              alt="Google Drive"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src="/notion.png"
              alt="Notion"
              height={30}
              width={30}
              className="object-contain"
            />
            <Image
              src="/discord.png"
              alt="Discord"
              height={30}
              width={30}
              className="object-contain"
            />
          </div>
          <div>
            <CardTitle className="text-xl mb-2">{name}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </LoadingLink>
      </CardHeader>
      <div className="flex flex-col items-center justify-center gap-2 px-6 py-0 min-w-[80px]">
        <Label
          htmlFor={`switch-${id}`}
          className="text-muted-foreground text-sm font-medium"
        >
          {publish! ? "On" : "Off"}
        </Label>
        <Switch
          id={`switch-${id}`}
          onClick={onPublishFlow}
          defaultChecked={publish!}
        />
      </div>
    </Card>
  );
};

export default Workflow;

/**
 * Workflows Page Component
 *
 * This is the main workflows management page that provides users with:
 * - Overview of all created workflow automations
 * - Quick access to create new workflows
 * - Visual representation of workflow status and configuration
 * - Navigation to individual workflow editors
 *
 * The page serves as a dashboard for workflow management, displaying
 * existing automations and providing creation capabilities.
 */

import React from "react";

import WorkflowButton from "./_components/workflow-button";
import Workflows from "./_components";

/**
 * Props interface for the Workflows page component.
 * Currently uses generic object type for future extensibility.
 */
type Props = object;

/**
 * Main Workflows page component that displays the workflow management interface.
 *
 * This component:
 * - Renders a sticky header with the page title
 * - Provides a workflow creation button in the header
 * - Displays the list of existing workflows
 * - Uses backdrop blur effect for the header
 *
 * Layout features:
 * - Sticky positioned header that remains visible during scroll
 * - Glassmorphism effect with backdrop blur
 * - Responsive flex layout
 * - Consistent spacing and typography
 *
 * @param props - Component props (currently unused but available for future extensions)
 * @returns JSX.Element - The workflows management page interface
 */
const Page = (props: Props) => {
  return (
    <div className="flex flex-col relative">
      <h1 className="text-4xl sticky top-0 z-[10] p-6 bg-background/50 backdrop-blur-lg flex items-center border-b justify-between">
        Workflows
        <WorkflowButton />
      </h1>
      <Workflows />
    </div>
  );
};

export default Page;

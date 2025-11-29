/**
 * Workflows Container Component
 *
 * This component serves as the main container for displaying all user workflows:
 * - Fetches and displays user's workflow automations
 * - Handles empty state when no workflows exist
 * - Provides consistent layout and spacing
 * - Maps workflows to individual Workflow components
 *
 * Features:
 * - Server-side workflow data fetching
 * - Empty state handling with user-friendly message
 * - Responsive grid layout for workflow cards
 * - Automatic workflow list updates
 */

import React from "react";
import Workflow from "./workflow";
import { onGetWorkflows } from "../_actions/workflow-connections";
// import MoreCredits from "./more-creadits";

/**
 * Props interface for the Workflows container component.
 * Currently uses generic object type for future extensibility.
 */
type Props = object;

/**
 * Workflows container component that fetches and displays all user workflows.
 *
 * This component:
 * - Fetches workflows from the database server-side
 * - Renders individual Workflow components for each automation
 * - Shows empty state message when no workflows exist
 * - Provides consistent spacing and layout
 *
 * Layout features:
 * - Responsive flexbox layout
 * - Consistent gap spacing between workflow cards
 * - Centered empty state message
 * - Proper padding and margins
 *
 * @param props - Component props (currently unused but available for future extensions)
 * @returns JSX.Element - Container with workflow list or empty state
 */
const Workflows = async (props: Props) => {
  const workflows = await onGetWorkflows();
  return (
    <div className="relative flex flex-col gap-4 p-6">
      <section className="flex flex-col gap-4">
        {workflows?.length ? (
          workflows.map((flow) => <Workflow key={flow.id} {...flow} />)
        ) : (
          <div className="mt-28 flex text-muted-foreground items-center justify-center">
            No Workflows
          </div>
        )}
      </section>
    </div>
  );
};

export default Workflows;

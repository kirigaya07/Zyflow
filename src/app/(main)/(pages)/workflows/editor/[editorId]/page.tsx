/**
 * Workflow Editor Page Component
 *
 * This is the main workflow editor interface that provides users with:
 * - Visual workflow builder with drag-and-drop functionality
 * - Node-based automation design interface
 * - Real-time connection management for external services
 * - Comprehensive workflow configuration and editing
 *
 * The page wraps the editor canvas with necessary providers for
 * state management and service integrations.
 */

import { ConnectionsProvider } from "@/providers/connections-provider";
import EditorProvider from "@/providers/editor-provider";
import EditorCanvas from "./_components/editor-canvas";

/**
 * Props interface for the Editor page component.
 * Receives dynamic editorId from the route parameters.
 */
type Props = {
  params: { editorId: string };
};

/**
 * Workflow Editor page component that renders the visual workflow builder.
 *
 * This component:
 * - Sets up the provider hierarchy for editor and connections state
 * - Provides full-height container for the editor interface
 * - Enables drag-and-drop workflow creation
 * - Manages service connections and integrations
 *
 * Provider hierarchy:
 * - EditorProvider: Manages workflow nodes, edges, and editor state
 * - ConnectionsProvider: Handles external service integrations
 * - EditorCanvas: The main visual editor interface
 *
 * Features:
 * - Visual node-based workflow design
 * - Real-time connection status
 * - Undo/redo functionality
 * - Auto-save capabilities
 * - Service integration management
 *
 * @param props - Component props containing route parameters
 * @returns JSX.Element - The workflow editor interface
 */
const Page = (props: Props) => {
  return (
    <div className="h-full">
      <EditorProvider>
        <ConnectionsProvider>
          <EditorCanvas />
        </ConnectionsProvider>
      </EditorProvider>
    </div>
  );
};

export default Page;

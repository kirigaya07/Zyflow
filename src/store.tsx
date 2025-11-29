import { create } from "zustand";

/**
 * Generic option interface for dropdown/select components.
 * Used throughout the application for consistent option handling.
 */
export interface Option {
  /** Unique identifier value for the option */
  value: string;
  /** Display text shown to the user */
  label: string;
  /** Whether this option should be disabled/unselectable */
  disable?: boolean;
  /** Fixed option that can't be removed by user interaction */
  fixed?: boolean;
  /** Additional properties for grouping options by key-value pairs */
  [key: string]: string | boolean | undefined;
}

/**
 * Zustand store interface for managing global application state.
 *
 * This store manages:
 * - Google Drive file integration data
 * - Slack channel configurations and selections
 * - Cross-component state sharing for workflow automation
 *
 * Note: Originally named FuzzieStore, maintains backward compatibility
 * while serving the Zyflow application architecture.
 */
type FuzzieStore = {
  /** Google Drive file data object containing file metadata and content */
  googleFile: any;
  /** Function to update the Google Drive file data */
  setGoogleFile: (googleFile: any) => void;
  /** Array of available Slack channels for integration */
  slackChannels: Option[];
  /** Function to update the list of available Slack channels */
  setSlackChannels: (slackChannels: Option[]) => void;
  /** Array of currently selected Slack channels for workflow actions */
  selectedSlackChannels: Option[];
  /** Function to update the selected Slack channels */
  setSelectedSlackChannels: (selectedSlackChannels: Option[]) => void;
};

/**
 * Zustand store hook for global state management in Zyflow application.
 *
 * This store provides centralized state management for:
 * - Google Drive file integration and metadata
 * - Slack channel management and selection
 * - Cross-component data sharing for workflow automation
 *
 * Usage:
 * ```tsx
 * const { googleFile, setGoogleFile, slackChannels, selectedSlackChannels } = useZyflowStore();
 * ```
 *
 * Features:
 * - Persistent state across component re-renders
 * - Optimized re-renders through selective subscriptions
 * - Type-safe state management with TypeScript
 * - Lightweight and performant state updates
 *
 * @returns FuzzieStore - Store object with state values and setter functions
 */
export const useZyflowStore = create<FuzzieStore>()((set) => ({
  // Google Drive Integration State
  googleFile: {},
  setGoogleFile: (googleFile: any) => set({ googleFile }),

  // Slack Integration State
  slackChannels: [],
  setSlackChannels: (slackChannels: Option[]) => set({ slackChannels }),

  // Selected Slack Channels for Workflow Actions
  selectedSlackChannels: [],
  setSelectedSlackChannels: (selectedSlackChannels: Option[]) =>
    set({ selectedSlackChannels }),
}));

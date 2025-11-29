"use client";

import { EditorActions, EditorNodeType } from "@/lib/types";
import {
  Dispatch,
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";

/**
 * Type alias for editor node, representing individual workflow nodes.
 * Each node contains data, position, and type information.
 */
export type EditorNode = EditorNodeType;

/**
 * Editor state interface representing the complete editor configuration.
 * Contains all nodes, connections, and currently selected element.
 */
export type Editor = {
  /** Array of all workflow nodes in the editor */
  elements: EditorNode[];
  /** Array of connections between nodes */
  edges: {
    id: string;
    source: string;
    target: string;
  }[];
  /** Currently selected node in the editor */
  selectedNode: EditorNodeType;
};

/**
 * History state interface for undo/redo functionality.
 * Maintains a history of editor states and current position.
 */
export type HistoryState = {
  /** Array of historical editor states */
  history: Editor[];
  /** Current position in the history array */
  currentIndex: number;
};

/**
 * Complete editor state combining current editor and history.
 */
export type EditorState = {
  /** Current editor configuration */
  editor: Editor;
  /** History state for undo/redo operations */
  history: HistoryState;
};

/**
 * Initial editor state with empty elements and default selected node.
 * Provides a clean starting point for new workflows.
 */
const initialEditorState: EditorState["editor"] = {
  elements: [],
  selectedNode: {
    data: {
      completed: false,
      current: false,
      description: "",
      metadata: {},
      title: "",
      type: "Trigger",
    },
    id: "",
    position: { x: 0, y: 0 },
    type: "Trigger",
  },
  edges: [],
};

/**
 * Initial history state containing the initial editor state.
 * Enables undo/redo functionality from the start.
 */
const initialHistoryState: HistoryState = {
  history: [initialEditorState],
  currentIndex: 0,
};

/**
 * Complete initial state combining editor and history.
 */
const initialState: EditorState = {
  editor: initialEditorState,
  history: initialHistoryState,
};

/**
 * Reducer function for managing editor state changes.
 * Handles undo/redo operations, data loading, and element selection.
 *
 * @param state - Current editor state
 * @param action - Action to perform on the state
 * @returns Updated editor state
 */
const editorReducer = (
  state: EditorState = initialState,
  action: EditorActions
): EditorState => {
  switch (action.type) {
    case "REDO":
      if (state.history.currentIndex < state.history.history.length - 1) {
        const nextIndex = state.history.currentIndex + 1;
        const nextEditorState = { ...state.history.history[nextIndex] };
        const redoState = {
          ...state,
          editor: nextEditorState,
          history: {
            ...state.history,
            currentIndex: nextIndex,
          },
        };
        return redoState;
      }
      return state;

    case "UNDO":
      if (state.history.currentIndex > 0) {
        const prevIndex = state.history.currentIndex - 1;
        const prevEditorState = { ...state.history.history[prevIndex] };
        const undoState = {
          ...state,
          editor: prevEditorState,
          history: {
            ...state.history,
            currentIndex: prevIndex,
          },
        };
        return undoState;
      }
      return state;

    case "LOAD_DATA":
      return {
        ...state,
        editor: {
          ...state.editor,
          elements: action.payload.elements || initialEditorState.elements,
          edges: action.payload.edges,
        },
      };
    case "SELECTED_ELEMENT":
      return {
        ...state,
        editor: {
          ...state.editor,
          selectedNode: action.payload.element,
        },
      };
    default:
      return state;
  }
};

/**
 * Editor context data interface for additional editor functionality.
 * Currently includes preview mode state management.
 */
export type EditorContextData = {
  previewMode: boolean;
  setPreviewMode: (previewMode: boolean) => void;
};

/**
 * React context for editor state management.
 * Provides access to editor state and dispatch function for state updates.
 */
export const EditorContext = createContext<{
  state: EditorState;
  dispatch: Dispatch<EditorActions>;
}>({
  state: initialState,
  dispatch: () => undefined,
});

/**
 * Props interface for the EditorProvider component.
 */
type EditorProps = {
  children: React.ReactNode;
};

/**
 * EditorProvider component that manages workflow editor state.
 *
 * This provider handles:
 * - Workflow node management
 * - Node connections and relationships
 * - Undo/redo functionality
 * - Element selection state
 * - Data loading operations
 *
 * @param props - Component props containing children
 * @returns JSX.Element - Provider wrapper with editor context
 */
const EditorProvider = (props: EditorProps) => {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  return (
    <EditorContext.Provider
      value={{
        state,
        dispatch,
      }}
    >
      {props.children}
    </EditorContext.Provider>
  );
};

/**
 * Custom hook to access the editor context.
 *
 * @returns Editor context containing state and dispatch function
 * @throws Error if used outside of EditorProvider
 */
export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditor Hook must be used within the editor Provider");
  }
  return context;
};

export default EditorProvider;

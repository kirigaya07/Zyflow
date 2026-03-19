"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  BackgroundVariant,
  Connection,
  Controls,
  Edge,
  EdgeChange,
  MiniMap,
  NodeChange,
  ReactFlowInstance,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { EditorCanvasCardType, EditorNodeType } from "@/lib/types";
import { useEditor } from "@/providers/editor-provider";
import { usePathname } from "next/navigation";
import { v4 } from "uuid";
import { toast } from "sonner";
import { EditorCanvasDefaultCardTypes } from "@/lib/constants";
import { onGetNodesEdges } from "../../../_actions/workflow-connections";
import { onCreateNodesEdges } from "../_actions/workflow-connections";

import EditorCanvasCardSingle from "./editor-canvas-card-single";
import { EditorToolbar } from "./editor-toolbar";
import { NodeLibrary } from "./node-library";
import { NodeConfigPanel } from "./node-config-panel";
import { Zap } from "lucide-react";

/** All canvas node types mapped to the shared card component. */
const NODE_TYPES = {
  Action:           EditorCanvasCardSingle,
  Trigger:          EditorCanvasCardSingle,
  Email:            EditorCanvasCardSingle,
  Zoom:             EditorCanvasCardSingle,
  Condition:        EditorCanvasCardSingle,
  AI:               EditorCanvasCardSingle,
  Slack:            EditorCanvasCardSingle,
  "Google Drive":   EditorCanvasCardSingle,
  Notion:           EditorCanvasCardSingle,
  Discord:          EditorCanvasCardSingle,
  "Custom Webhook": EditorCanvasCardSingle,
  "Google Calendar":EditorCanvasCardSingle,
  Wait:             EditorCanvasCardSingle,
  "HTTP Request":   EditorCanvasCardSingle,
  "Webhook Trigger":EditorCanvasCardSingle,
  Code:             EditorCanvasCardSingle,
  "Set Fields":     EditorCanvasCardSingle,
} as const;

const DEFAULT_EDGE_OPTIONS = {
  type: "smoothstep" as const,
  style: { stroke: "hsl(var(--primary))", strokeWidth: 1.5, opacity: 0.7 },
  animated: false,
};

/** Kahn's BFS topological sort — returns ordered node IDs. */
function topologicalSort(
  nodes: EditorNodeType[],
  edges: { id: string; source: string; target: string }[]
): string[] {
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  for (const n of nodes) { adj[n.id] = []; inDegree[n.id] = 0; }
  for (const e of edges) {
    if (adj[e.source]) adj[e.source].push(e.target);
    inDegree[e.target] = (inDegree[e.target] ?? 0) + 1;
  }
  const queue = nodes.filter((n) => (inDegree[n.id] ?? 0) === 0).map((n) => n.id);
  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const nb of adj[id] ?? []) {
      inDegree[nb]--;
      if (inDegree[nb] === 0) queue.push(nb);
    }
  }
  return sorted;
}

/** Spinner shown while loading workflow data. */
function LoadingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm z-10">
      <svg
        aria-hidden="true"
        className="h-8 w-8 animate-spin fill-primary text-muted"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.591C100 78.205 77.614 100.591 50 100.591C22.386 100.591 0 78.205 0 50.591C0 22.977 22.386 0.591 50 0.591C77.614 0.591 100 22.977 100 50.591ZM9.081 50.591C9.081 73.19 27.401 91.509 50 91.509C72.599 91.509 90.919 73.19 90.919 50.591C90.919 27.992 72.599 9.672 50 9.672C27.401 9.672 9.081 27.992 9.081 50.591Z"
          fill="currentColor"
        />
        <path
          d="M93.968 39.041C96.393 38.404 97.862 35.912 97.008 33.554C95.293 28.823 92.871 24.369 89.817 20.348C85.845 15.119 80.883 10.724 75.212 7.413C69.542 4.102 63.275 1.940 56.770 1.051C51.767 0.368 46.698 0.447 41.735 1.279C39.261 1.693 37.813 4.198 38.450 6.623C39.087 9.049 41.569 10.472 44.051 10.107C47.851 9.549 51.719 9.527 55.540 10.049C60.864 10.777 65.993 12.546 70.633 15.255C75.274 17.965 79.335 21.562 82.585 25.841C84.918 28.912 86.800 32.291 88.181 35.876C89.083 38.216 91.542 39.678 93.968 39.041Z"
          fill="currentFill"
        />
      </svg>
    </div>
  );
}

/** Empty canvas hint overlay */
function EmptyCanvasOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-[1]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Drag a trigger node to get started
        </p>
        <p className="text-xs text-muted-foreground/60">
          Then connect action nodes to build your workflow
        </p>
      </div>
    </div>
  );
}

const EditorCanvas = () => {
  const { dispatch, state } = useEditor();
  const [nodes, setNodes] = useState<EditorNodeType[]>([]);
  const [edges, setEdges] = useState<{ id: string; source: string; target: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance<EditorNodeType, Edge>>();
  const pathname = usePathname();
  const workflowId = pathname.split("/").pop()!;

  /** Keep the editor context in sync with local node/edge state. */
  useEffect(() => {
    dispatch({ type: "LOAD_DATA", payload: { edges, elements: nodes } });
  }, [nodes, edges]);

  /** Load persisted workflow on mount. */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const response = await onGetNodesEdges(workflowId);
      if (response) {
        try { setEdges(JSON.parse(response.edges!)); } catch {}
        try { setNodes(JSON.parse(response.nodes!)); } catch {}
      }
      setIsLoading(false);
    };
    load();
  }, [workflowId]);

  /** Ctrl/Cmd+S to save */
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const flowPath = topologicalSort(nodes, edges);
        if (!flowPath.length) {
          toast.error("Connect your nodes before saving.");
          return;
        }
        try {
          const res = await onCreateNodesEdges(
            workflowId,
            JSON.stringify(nodes),
            JSON.stringify(edges),
            JSON.stringify(flowPath)
          );
          toast.success(res?.message ?? "Saved");
        } catch {
          toast.error("Save failed");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, edges, workflowId]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      // @ts-ignore — xyflow generic mismatch is safe here
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      // @ts-ignore
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow"
      ) as EditorCanvasCardType["type"];

      if (!type || !reactFlowInstance) return;

      const isTriggerType = EditorCanvasDefaultCardTypes[type]?.type === "Trigger";
      const hasTrigger = state.editor.elements.some(
        (n) => EditorCanvasDefaultCardTypes[n.type]?.type === "Trigger"
      );

      if (isTriggerType && hasTrigger) {
        toast("Only one trigger node is allowed per workflow.");
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: EditorNodeType = {
        id: v4(),
        type,
        position,
        data: {
          title: type,
          description: EditorCanvasDefaultCardTypes[type]?.description ?? "",
          completed: false,
          current: false,
          metadata: {},
          type,
        },
      };

      // @ts-ignore
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, state]
  );

  /** Deselect node when clicking the canvas background. */
  const handleClickCanvas = () => {
    dispatch({
      type: "SELECTED_ELEMENT",
      payload: {
        element: {
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
      },
    });
  };

  const nodeTypes = useMemo(() => NODE_TYPES, []);
  const isEmpty = state.editor.elements.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ── Top toolbar ───────────────────────────────────── */}
      <EditorToolbar nodes={nodes} edges={edges} />

      {/* ── Main content area ─────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Node library */}
        <NodeLibrary nodes={nodes} />

        {/* Center: React Flow canvas */}
        <div className="flex-1 relative" onClick={handleClickCanvas}>
          {isLoading && <LoadingSpinner />}
          {isEmpty && <EmptyCanvasOverlay />}
          <ReactFlow
            className="w-full h-full"
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodes={state.editor.elements}
            onNodesChange={onNodesChange}
            edges={edges}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) =>
              setReactFlowInstance(
                instance as unknown as ReactFlowInstance<EditorNodeType, Edge>
              )
            }
            fitView
            nodeTypes={nodeTypes}
            defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
            deleteKeyCode="Delete"
            proOptions={{ hideAttribution: true }}
          >
            <Controls position="bottom-right" className="!bottom-4 !right-4" />
            <MiniMap
              position="bottom-left"
              className="!bg-card !border !border-border !rounded-md !bottom-4 !left-4"
              zoomable
              pannable
            />
            <Background variant={"dots" as BackgroundVariant} gap={16} size={1} />
          </ReactFlow>
        </div>

        {/* Right: Node config panel (visible when a node is selected) */}
        <NodeConfigPanel />
      </div>
    </div>
  );
};

export default EditorCanvas;

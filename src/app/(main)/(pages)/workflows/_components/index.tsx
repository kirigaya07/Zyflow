import React from "react";
import Workflow from "./workflow";
import { getLastRunsForWorkflows, getRunCountsForWorkflows, onGetWorkflows } from "../_actions/workflow-connections";
import { EditorCanvasTypes } from "@/lib/types";

type Props = object;

/** Extract unique node types from a workflow's serialized nodes JSON. */
function parseNodeTypes(nodesJson: string | null | undefined): EditorCanvasTypes[] {
  if (!nodesJson) return [];
  try {
    const nodes: { type?: string; data?: { type?: string } }[] = JSON.parse(nodesJson);
    const seen = new Set<string>();
    for (const n of nodes) {
      const t = n.type ?? n.data?.type;
      if (t) seen.add(t);
    }
    return Array.from(seen) as EditorCanvasTypes[];
  } catch {
    return [];
  }
}

const Workflows = async (_props: Props) => {
  const workflows = await onGetWorkflows();
  const workflowIds = workflows?.map((w) => w.id) ?? [];
  const [lastRuns, runCounts] = await Promise.all([
    getLastRunsForWorkflows(workflowIds),
    getRunCountsForWorkflows(workflowIds),
  ]);
  const lastRunMap = new Map(lastRuns.map((r) => [r.workflowId, r]));

  return (
    <section className="flex flex-col gap-2">
      {workflows?.length ? (
        workflows.map((flow) => (
          <Workflow
            key={flow.id}
            id={flow.id}
            name={flow.name}
            description={flow.description}
            publish={flow.publish}
            lastRun={lastRunMap.get(flow.id) ?? null}
            runCount={runCounts[flow.id] ?? 0}
            nodeTypes={parseNodeTypes(flow.nodes)}
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No workflows yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Press <kbd className="px-1 py-0.5 text-[10px] font-mono rounded bg-secondary border border-border">+</kbd> to create your first automation.
            </p>
          </div>
        </div>
      )}
    </section>
  );
};

export default Workflows;

"use server";

import { db } from "@/lib/db";

export const onCreateNodesEdges = async (
  flowId: string,
  nodes: string,
  edges: string,
  flowPath: string
) => {
  const flow = await db.workflows.update({
    where: {
      id: flowId,
    },
    data: {
      nodes,
      edges,
      flowPath: flowPath,
    },
  });

  if (flow) return { message: "flow saved" };
};

export const onFlowPublish = async (workflowId: string, state: boolean) => {
  if (state) {
    const workflow = await db.workflows.findUnique({
      where: { id: workflowId },
      select: { flowPath: true },
    });

    let path: string[] = [];
    try {
      path = workflow?.flowPath ? JSON.parse(workflow.flowPath) : [];
    } catch {
      path = [];
    }

    if (!path.length) {
      return "Cannot publish: connect your nodes and save the workflow first.";
    }
  }

  const published = await db.workflows.update({
    where: { id: workflowId },
    data: { publish: state },
  });

  if (published.publish) return "Workflow published";
  return "Workflow unpublished";
};

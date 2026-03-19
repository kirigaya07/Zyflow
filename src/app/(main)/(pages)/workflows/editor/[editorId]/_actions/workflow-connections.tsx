"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

/**
 * Returns the workflow name and publish status — used by the editor toolbar.
 */
export const getWorkflowMeta = async (workflowId: string) => {
  const { userId } = await auth();
  if (!userId) return null;
  return db.workflows.findUnique({
    where: { id: workflowId, userId },
    select: { name: true, publish: true },
  });
};

export const onCreateNodesEdges = async (
  flowId: string,
  nodes: string,
  edges: string,
  flowPath: string
) => {
  const { userId } = await auth();
  if (!userId) return { message: "Unauthorized" };

  const flow = await db.workflows.update({
    where: { id: flowId, userId },
    data: { nodes, edges, flowPath },
  });

  if (flow) return { message: "flow saved" };
};

export const dynamic = "force-dynamic";

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { executeWorkflow } from "@/inngest/workflow-execution";
import { scheduledWorkflowCheck } from "@/inngest/cron-execution";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeWorkflow, scheduledWorkflowCheck],
});

import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { executeWorkflow } from "@/inngest/workflow-execution";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [executeWorkflow],
});

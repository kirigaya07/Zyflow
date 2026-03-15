import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "zyflow",
  name: "Zyflow",
});

/** All Zyflow event definitions for type-safe event sending */
export type ZyflowEvents = {
  "workflow/trigger": {
    data: {
      workflowId: string;
      source: "drive" | "zoom" | "webhook" | "cron";
      payload?: Record<string, unknown>;
    };
  };
};

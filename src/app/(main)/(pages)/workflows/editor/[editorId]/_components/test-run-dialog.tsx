"use client";

import { useState } from "react";
import { Play, Loader2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = { workflowId: string; isPublished: boolean };

const DEFAULT_PAYLOAD = `{
  "key": "value",
  "name": "test"
}`;

export function TestRunDialog({ workflowId, isPublished }: Props) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [isTesting, setIsTesting] = useState(false);

  const handleRun = async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(payload);
    } catch {
      toast.error("Invalid JSON — fix the payload and try again");
      return;
    }

    setIsTesting(true);
    try {
      const res = await fetch(`/api/webhooks/${workflowId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success("Workflow completed — check the Executions tab");
        setOpen(false);
      } else {
        toast.error((data as { error?: string }).error ?? `Run failed (${res.status})`);
      }
    } catch {
      toast.error("Failed to reach the webhook endpoint");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          title="Test run"
        >
          <FlaskConical className="h-3 w-3" />
          <span className="hidden sm:inline">Test</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[460px] gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <FlaskConical className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Test Run</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Send a test payload to trigger this workflow
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4">
          {!isPublished && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Workflow is not published. Deploy it first or the test may be ignored.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-foreground">JSON Payload</p>
            <Textarea
              value={payload}
              onChange={(e) => setPayload(e.target.value)}
              className="font-mono text-xs min-h-[140px] resize-none"
              spellCheck={false}
            />
            <p className="text-[11px] text-muted-foreground">
              This is sent as the trigger payload — accessible via{" "}
              <code className="bg-muted px-1 rounded text-[10px]">{"{{ trigger.key }}"}</code>
            </p>
          </div>

          <Button
            onClick={handleRun}
            disabled={isTesting}
            className="w-full gap-2"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run Workflow
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

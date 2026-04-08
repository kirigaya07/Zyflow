"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useEditor } from "@/providers/editor-provider";
import { EditorCanvasTypes, EditorNodeType } from "@/lib/types";
import { getConnectedServices } from "../_actions/workflow-connections";
import EditorCanvasIconHelper from "./editor-canvas-card-icon-helper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { X, Copy, Check, Loader2, CheckCircle2 } from "lucide-react";
import ExecutionLogs from "./execution-logs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────
   Tiny helper: expression hint
───────────────────────────────────────────────────────── */
function ExprHint() {
  return (
    <p className="text-[11px] text-muted-foreground">
      Use{" "}
      <code className="bg-muted px-1 rounded text-[10px]">
        {"{{ trigger.field }}"}
      </code>{" "}
      or{" "}
      <code className="bg-muted px-1 rounded text-[10px]">
        {"{{ nodeId.field }}"}
      </code>{" "}
      to reference previous data.
    </p>
  );
}

/* ─────────────────────────────────────────────────────────
   Field label
───────────────────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-medium text-foreground mb-1">{children}</p>
  );
}

/* ─────────────────────────────────────────────────────────
   Section wrapper
───────────────────────────────────────────────────────── */
function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-1", className)}>{children}</div>;
}

/* ─────────────────────────────────────────────────────────
   Individual node config forms
───────────────────────────────────────────────────────── */

function WebhookTriggerConfig({ workflowId }: { workflowId: string }) {
  const [copied, setCopied] = useState(false);
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/webhooks/${workflowId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>Webhook URL</Label>
        <div className="flex gap-2">
          <Input value={webhookUrl} readOnly className="font-mono text-[11px]" />
          <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Send a POST request with JSON body to trigger this workflow.
        </p>
      </Section>
      <ExprHint />
    </div>
  );
}

function HttpRequestConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const onTest = async () => {
    const url = meta.url as string;
    if (!url) { toast.error("Enter a URL first"); return; }
    setIsTesting(true);
    setTestResult(null);
    try {
      const method = ((meta.method as string) || "GET").toUpperCase();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((meta.headers as Record<string, string>) ?? {}),
      };
      const bodyAllowed = ["POST", "PUT", "PATCH"].includes(method);
      const res = await fetch(url, {
        method,
        headers,
        body: bodyAllowed && meta.body ? JSON.stringify(meta.body) : undefined,
      });
      const text = await res.text();
      setTestResult(`${res.status} ${res.statusText}\n\n${text}`);
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>Method & URL</Label>
        <div className="flex gap-2">
          <Select
            value={(meta.method as string) || "GET"}
            onValueChange={(v) => update({ method: v })}
          >
            <SelectTrigger className="w-24 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="https://api.example.com/endpoint"
            value={(meta.url as string) || ""}
            onChange={(e) => update({ url: e.target.value })}
            className="font-mono text-xs"
          />
        </div>
      </Section>

      <Section>
        <Label>
          Headers{" "}
          <span className="font-normal text-muted-foreground">(JSON)</span>
        </Label>
        <Textarea
          placeholder={'{\n  "Authorization": "Bearer token"\n}'}
          value={(meta.headersRaw as string) || ""}
          onChange={(e) => {
            update({ headersRaw: e.target.value });
            try { update({ headers: JSON.parse(e.target.value) }); } catch {}
          }}
          className="font-mono text-xs min-h-[72px] resize-none"
        />
      </Section>

      <Section>
        <Label>
          Body{" "}
          <span className="font-normal text-muted-foreground">
            (JSON, for POST/PUT/PATCH)
          </span>
        </Label>
        <Textarea
          placeholder={'{\n  "key": "{{ trigger.value }}"\n}'}
          value={(meta.bodyRaw as string) || ""}
          onChange={(e) => {
            update({ bodyRaw: e.target.value });
            try { update({ body: JSON.parse(e.target.value) }); } catch {}
          }}
          className="font-mono text-xs min-h-[72px] resize-none"
        />
      </Section>

      <ExprHint />

      <Button variant="outline" size="sm" onClick={onTest} disabled={isTesting}>
        {isTesting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
        {isTesting ? "Testing…" : "Test Request"}
      </Button>

      {testResult && (
        <pre className="bg-muted rounded p-2 text-[11px] overflow-auto max-h-40 whitespace-pre-wrap break-all">
          {testResult}
        </pre>
      )}
    </div>
  );
}

function AiConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>Model</Label>
        <Select
          value={(meta.model as string) || "gpt-4o-mini"}
          onValueChange={(v) => update({ model: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o-mini">GPT-4o mini (fast, cheap)</SelectItem>
            <SelectItem value="gpt-4o">GPT-4o (best)</SelectItem>
            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section>
        <Label>Prompt</Label>
        <Textarea
          placeholder={`Summarize the following:\n{{ trigger.content }}`}
          value={(meta.prompt as string) || ""}
          onChange={(e) => update({ prompt: e.target.value })}
          className="min-h-[140px] resize-none text-sm"
        />
      </Section>

      <ExprHint />
      <p className="text-[11px] text-muted-foreground">
        Output is available as{" "}
        <code className="bg-muted px-1 rounded text-[10px]">output</code>,{" "}
        <code className="bg-muted px-1 rounded text-[10px]">model</code>,{" "}
        <code className="bg-muted px-1 rounded text-[10px]">tokens</code>{" "}
        in subsequent nodes.
      </p>
    </div>
  );
}

function ConditionConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  const operators = [
    { value: "equals",       label: "equals" },
    { value: "not_equals",   label: "not equals" },
    { value: "contains",     label: "contains" },
    { value: "starts_with",  label: "starts with" },
    { value: "ends_with",    label: "ends with" },
    { value: "greater_than", label: "greater than" },
    { value: "less_than",    label: "less than" },
    { value: "exists",       label: "exists" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>Field path</Label>
        <Input
          placeholder="e.g. data.status or trigger.name"
          value={(meta.field as string) || ""}
          onChange={(e) => update({ field: e.target.value })}
          className="font-mono text-xs"
        />
      </Section>

      <Section>
        <Label>Operator</Label>
        <Select
          value={(meta.operator as string) || "equals"}
          onValueChange={(v) => update({ operator: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {operators.map((op) => (
              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <Section>
        <Label>Value</Label>
        <Input
          placeholder="e.g. active  or  42"
          value={(meta.value as string) || ""}
          onChange={(e) => update({ value: e.target.value })}
        />
      </Section>

      <p className="text-[11px] text-muted-foreground">
        Items where the condition is <strong>true</strong> continue to the next node.
        All others are dropped.
      </p>
    </div>
  );
}

function WaitConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  /** value = Inngest-compatible duration string; label = human-readable */
  const presets: { value: string; label: string }[] = [
    { value: "5m",  label: "5 minutes" },
    { value: "15m", label: "15 minutes" },
    { value: "30m", label: "30 minutes" },
    { value: "1h",  label: "1 hour" },
    { value: "6h",  label: "6 hours" },
    { value: "12h", label: "12 hours" },
    { value: "1d",  label: "1 day" },
    { value: "3d",  label: "3 days" },
    { value: "7d",  label: "1 week" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>Duration</Label>
        <Select
          value={(meta.duration as string) || "1h"}
          onValueChange={(v) => update({ duration: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {presets.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>
      <p className="text-[11px] text-muted-foreground">
        Powered by Inngest durable sleep — survives serverless cold starts.
      </p>
    </div>
  );
}

function CodeConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>JavaScript</Label>
        <Textarea
          placeholder={`// Transform input items\nreturn $input.map(item => ({\n  json: { ...item.json, processed: true }\n}));`}
          value={(meta.code as string) || ""}
          onChange={(e) => update({ code: e.target.value })}
          className="font-mono text-xs min-h-[200px] resize-none"
        />
      </Section>
      <p className="text-[11px] text-muted-foreground">
        Available:{" "}
        <code className="bg-muted px-1 rounded text-[10px]">$input</code>{" "}
        (Item[]),{" "}
        <code className="bg-muted px-1 rounded text-[10px]">$trigger</code>{" "}
        (payload),{" "}
        <code className="bg-muted px-1 rounded text-[10px]">$nodeOutputs</code>{" "}
        (Map). Return <code className="bg-muted px-1 rounded text-[10px]">[{"{ json: {...} }"}]</code>.
        5 second timeout.
      </p>
    </div>
  );
}

function DiscordConfig({
  meta,
  update,
  autoUrl,
  autoName,
  autoGuildName,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
  autoUrl?: string | null;
  autoName?: string;
  autoGuildName?: string;
}) {
  const isAutoFilled = !!(meta.webhookUrl as string) && (meta.webhookUrl as string) === autoUrl;

  return (
    <div className="flex flex-col gap-4">
      {autoUrl && (
        <div className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2",
          isAutoFilled ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" : "bg-muted/40"
        )}>
          {isAutoFilled
            ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            : null
          }
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{autoName || "Discord"}</p>
            {autoGuildName && <p className="text-[11px] text-muted-foreground truncate">{autoGuildName}</p>}
          </div>
          {!isAutoFilled && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0"
              onClick={() => update({ webhookUrl: autoUrl })}
            >
              Use this
            </Button>
          )}
        </div>
      )}

      <Section>
        <Label>Webhook URL</Label>
        <Input
          placeholder="https://discord.com/api/webhooks/…"
          value={(meta.webhookUrl as string) || ""}
          onChange={(e) => update({ webhookUrl: e.target.value })}
          className="font-mono text-xs"
        />
      </Section>

      <Section>
        <Label>Message</Label>
        <Textarea
          placeholder={"Hello {{ trigger.name }}!"}
          value={(meta.template as string) || ""}
          onChange={(e) => update({ template: e.target.value })}
          className="min-h-[100px] resize-none text-sm"
        />
      </Section>

      <ExprHint />
    </div>
  );
}

function SlackConfig({
  meta,
  update,
  autoToken,
  autoTeamName,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
  autoToken?: string | null;
  autoTeamName?: string;
}) {
  const isAutoFilled = !!(meta.slackAccessToken as string) && (meta.slackAccessToken as string) === autoToken;

  return (
    <div className="flex flex-col gap-4">
      {autoToken && (
        <div className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2",
          isAutoFilled ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" : "bg-muted/40"
        )}>
          {isAutoFilled && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{autoTeamName || "Slack"}</p>
            <p className="text-[11px] text-muted-foreground">Connected workspace</p>
          </div>
          {!isAutoFilled && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0"
              onClick={() => update({ slackAccessToken: autoToken })}
            >
              Use this
            </Button>
          )}
        </div>
      )}

      <Section>
        <Label>Access Token</Label>
        <Input
          type="password"
          placeholder="xoxb-…"
          value={(meta.slackAccessToken as string) || ""}
          onChange={(e) => update({ slackAccessToken: e.target.value })}
          className="font-mono text-xs"
        />
      </Section>

      <Section>
        <Label>Channel(s)</Label>
        <Input
          placeholder="#general, #alerts"
          value={
            Array.isArray(meta.channels)
              ? (meta.channels as { value: string }[]).map((c) => c.value).join(", ")
              : (meta.channelsRaw as string) || ""
          }
          onChange={(e) => {
            const raw = e.target.value;
            update({
              channelsRaw: raw,
              channels: raw
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
                .map((c) => ({ label: c, value: c })),
            });
          }}
        />
      </Section>

      <Section>
        <Label>Message</Label>
        <Textarea
          placeholder={"Hello {{ trigger.name }}!"}
          value={(meta.template as string) || ""}
          onChange={(e) => update({ template: e.target.value })}
          className="min-h-[100px] resize-none text-sm"
        />
      </Section>

      <ExprHint />
    </div>
  );
}

function NotionConfig({
  meta,
  update,
  autoToken,
  autoWorkspaceName,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
  autoToken?: string | null;
  autoWorkspaceName?: string;
}) {
  const isAutoFilled = !!(meta.accessToken as string) && (meta.accessToken as string) === autoToken;

  return (
    <div className="flex flex-col gap-4">
      {autoToken && (
        <div className={cn(
          "flex items-center gap-2 rounded-md border px-3 py-2",
          isAutoFilled ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900" : "bg-muted/40"
        )}>
          {isAutoFilled && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{autoWorkspaceName || "Notion"}</p>
            <p className="text-[11px] text-muted-foreground">Connected workspace</p>
          </div>
          {!isAutoFilled && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs shrink-0"
              onClick={() => update({ accessToken: autoToken })}
            >
              Use this
            </Button>
          )}
        </div>
      )}

      <Section>
        <Label>Access Token</Label>
        <Input
          type="password"
          placeholder="secret_…"
          value={(meta.accessToken as string) || ""}
          onChange={(e) => update({ accessToken: e.target.value })}
          className="font-mono text-xs"
        />
      </Section>

      <Section>
        <Label>Database ID <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Input
          placeholder="Paste Notion database ID or URL"
          value={(meta.databaseId as string) || ""}
          onChange={(e) => update({ databaseId: e.target.value })}
          className="font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground">
          Leave blank to create a top-level page. Paste the database URL or ID to add a row to a database.
        </p>
      </Section>

      <Section>
        <Label>Content / Page Title</Label>
        <Textarea
          placeholder={"New entry: {{ trigger.name }}"}
          value={(meta.content as string) || ""}
          onChange={(e) => update({ content: e.target.value })}
          className="min-h-[80px] resize-none text-sm"
        />
      </Section>

      <ExprHint />
    </div>
  );
}

function EmailConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>Recipients</Label>
        <Input
          type="text"
          placeholder="user@example.com, another@example.com"
          value={
            Array.isArray(meta.recipients)
              ? (meta.recipients as string[]).join(", ")
              : (meta.recipientsRaw as string) || ""
          }
          onChange={(e) => {
            const raw = e.target.value;
            update({
              recipientsRaw: raw,
              recipients: raw
                .split(",")
                .map((r) => r.trim())
                .filter(Boolean),
            });
          }}
        />
      </Section>

      <Section>
        <Label>Subject</Label>
        <Input
          placeholder="Notification: {{ trigger.name }}"
          value={(meta.subject as string) || ""}
          onChange={(e) => update({ subject: e.target.value })}
        />
      </Section>

      <Section>
        <Label>Body</Label>
        <Textarea
          placeholder={"Hello,\n\nThis is an automated message.\n\n{{ trigger.content }}"}
          value={(meta.body as string) || ""}
          onChange={(e) => update({ body: e.target.value })}
          className="min-h-[120px] resize-none text-sm"
        />
      </Section>

      <ExprHint />
      <p className="text-[11px] text-muted-foreground">
        Sent via Gmail API using your Google OAuth connection.
      </p>
    </div>
  );
}

function SetFieldsConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  type Mapping = { field: string; value: string };
  const mappings: Mapping[] = Array.isArray(meta.mappings)
    ? (meta.mappings as Mapping[])
    : [];

  const setMappings = (next: Mapping[]) => update({ mappings: next });

  const addRow = () => setMappings([...mappings, { field: "", value: "" }]);
  const removeRow = (i: number) => setMappings(mappings.filter((_, idx) => idx !== i));
  const updateRow = (i: number, key: "field" | "value", val: string) => {
    const next = mappings.map((m, idx) => (idx === i ? { ...m, [key]: val } : m));
    setMappings(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>Mode</Label>
        <Select
          value={(meta.mode as string) || "merge"}
          onValueChange={(v) => update({ mode: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="merge">Merge — keep existing, set/overwrite specified fields</SelectItem>
            <SelectItem value="replace">Replace — output only the specified fields</SelectItem>
          </SelectContent>
        </Select>
      </Section>

      <Section>
        <Label>Field Mappings</Label>
        <div className="flex flex-col gap-1.5">
          {mappings.map((m, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <Input
                placeholder="Field name"
                value={m.field}
                onChange={(e) => updateRow(i, "field", e.target.value)}
                className="font-mono text-xs"
              />
              <span className="text-muted-foreground text-xs shrink-0">=</span>
              <Input
                placeholder="Value or {{ expr }}"
                value={m.value}
                onChange={(e) => updateRow(i, "value", e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeRow(i)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="mt-1 w-full" onClick={addRow}>
            + Add field
          </Button>
        </div>
      </Section>

      <ExprHint />
      <p className="text-[11px] text-muted-foreground">
        Dot notation supported for nested fields:{" "}
        <code className="bg-muted px-1 rounded text-[10px]">user.name</code>
      </p>
    </div>
  );
}

function CronTriggerConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  const schedules: { value: string; label: string; cron: string }[] = [
    { value: "every_hour",        label: "Every hour",           cron: "0 * * * *"     },
    { value: "every_day_9am",     label: "Every day at 9 AM",    cron: "0 9 * * *"     },
    { value: "every_day_midnight",label: "Every day at midnight", cron: "0 0 * * *"    },
    { value: "every_monday",      label: "Every Monday at 9 AM", cron: "0 9 * * 1"     },
    { value: "every_weekday",     label: "Every weekday at 9 AM",cron: "0 9 * * 1-5"   },
    { value: "every_sunday",      label: "Every Sunday at midnight", cron: "0 0 * * 0" },
  ];

  const selected = (meta.schedule as string) || "every_day_9am";
  const cronExpr = schedules.find((s) => s.value === selected)?.cron ?? "0 9 * * *";

  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>Schedule</Label>
        <Select
          value={selected}
          onValueChange={(v) => {
            const match = schedules.find((s) => s.value === v);
            update({ schedule: v, cron: match?.cron ?? "0 9 * * *" });
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schedules.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      <div className="rounded-md border px-3 py-2 bg-muted/40">
        <p className="text-[11px] text-muted-foreground">
          Cron expression:{" "}
          <code className="bg-muted px-1 rounded text-[10px] font-mono">{cronExpr}</code>
        </p>
      </div>

      <p className="text-[11px] text-muted-foreground">
        All times are UTC. The workflow will fire automatically on this schedule
        when published.
      </p>
    </div>
  );
}

function McpClientConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Section>
        <Label>MCP Server URL</Label>
        <Input
          placeholder="https://example.com/api/mcp"
          value={(meta.serverUrl as string) || ""}
          onChange={(e) => update({ serverUrl: e.target.value })}
          className="font-mono text-xs"
        />
        <p className="text-[11px] text-muted-foreground">
          URL of any HTTP-based MCP server (including other Zyflow instances).
        </p>
      </Section>

      <Section>
        <Label>API Key <span className="font-normal text-muted-foreground">(Bearer token)</span></Label>
        <Input
          type="password"
          placeholder="Bearer token for auth (optional)"
          value={(meta.apiKey as string) || ""}
          onChange={(e) => update({ apiKey: e.target.value })}
          className="font-mono text-xs"
        />
      </Section>

      <Section>
        <Label>Tool Name</Label>
        <Input
          placeholder="e.g. search_web or a workflow UUID"
          value={(meta.toolName as string) || ""}
          onChange={(e) => update({ toolName: e.target.value })}
          className="font-mono text-xs"
        />
      </Section>

      <Section>
        <Label>Tool Input <span className="font-normal text-muted-foreground">(JSON)</span></Label>
        <Textarea
          placeholder={'{\n  "query": "{{ trigger.search }}"\n}'}
          value={(meta.toolInput as string) || ""}
          onChange={(e) => update({ toolInput: e.target.value })}
          className="font-mono text-xs min-h-[100px] resize-none"
        />
      </Section>

      <ExprHint />
      <p className="text-[11px] text-muted-foreground">
        Output is available as{" "}
        <code className="bg-muted px-1 rounded text-[10px]">output</code>{" "}
        in subsequent nodes.
      </p>
    </div>
  );
}

function GoogleSheetsConfig({
  meta,
  update,
}: {
  meta: Record<string, unknown>;
  update: (updates: Record<string, unknown>) => void;
}) {
  const operation = (meta.operation as string) || "append";

  const OPERATIONS = [
    { value: "append",     label: "Append Row" },
    { value: "get",        label: "Get Rows" },
    { value: "update",     label: "Update Row" },
    { value: "find",       label: "Find Row" },
    { value: "clear",      label: "Clear Range" },
    { value: "delete_row", label: "Delete Row" },
    { value: "create",     label: "Create Spreadsheet" },
  ];

  const needsSheet  = operation !== "create";
  const needsValues = operation === "append" || operation === "update";
  const needsFind   = operation === "find";
  const needsRow    = operation === "update" || operation === "delete_row";
  const isCreate    = operation === "create";
  const showHeaders = operation === "get" || operation === "find";

  return (
    <div className="flex flex-col gap-4">
      {/* Google account notice */}
      <div className="rounded-md border px-3 py-2 bg-muted/40">
        <p className="text-[11px] text-muted-foreground">
          Uses your connected Google account. Make sure the{" "}
          <span className="font-medium">Google Sheets API</span> scope is enabled
          in your Clerk dashboard.
        </p>
      </div>

      {/* Operation */}
      <Section>
        <Label>Operation</Label>
        <Select
          value={operation}
          onValueChange={(v) => update({ operation: v })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {OPERATIONS.map((op) => (
              <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Section>

      {/* Create: just a title */}
      {isCreate && (
        <Section>
          <Label>Spreadsheet Title</Label>
          <Input
            placeholder="My Spreadsheet"
            value={(meta.sheetTitle as string) || ""}
            onChange={(e) => update({ sheetTitle: e.target.value })}
          />
        </Section>
      )}

      {/* All other ops: need sheet ID + range */}
      {needsSheet && (
        <>
          <Section>
            <Label>Spreadsheet URL or ID</Label>
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/… or just the ID"
              value={(meta.spreadsheetId as string) || ""}
              onChange={(e) => update({ spreadsheetId: e.target.value })}
              className="font-mono text-xs"
            />
          </Section>

          <Section>
            <Label>Range</Label>
            <Input
              placeholder="Sheet1  or  Sheet1!A:Z"
              value={(meta.range as string) || ""}
              onChange={(e) => update({ range: e.target.value })}
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Omit the range to use the whole sheet (e.g.{" "}
              <code className="bg-muted px-1 rounded text-[10px]">Sheet1</code>).
            </p>
          </Section>
        </>
      )}

      {/* Append / Update: row values */}
      {needsValues && (
        <Section>
          <Label>
            Row Values{" "}
            <span className="font-normal text-muted-foreground">(CSV or JSON array)</span>
          </Label>
          <Input
            placeholder='value1, value2  or  ["val1","val2"]'
            value={(meta.values as string) || ""}
            onChange={(e) => update({ values: e.target.value })}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Supports expressions:{" "}
            <code className="bg-muted px-1 rounded text-[10px]">{"{{ trigger.name }}, {{ trigger.email }}"}</code>
          </p>
        </Section>
      )}

      {/* Update / Delete: specific row number */}
      {needsRow && (
        <Section>
          <Label>Row Number</Label>
          <Input
            placeholder="2  (1 = header, 2 = first data row)"
            value={(meta.rowNumber as string) || ""}
            onChange={(e) => update({ rowNumber: e.target.value })}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">
            Supports expressions:{" "}
            <code className="bg-muted px-1 rounded text-[10px]">{"{{ trigger.rowNumber }}"}</code>
          </p>
        </Section>
      )}

      {/* Find: column + search value */}
      {needsFind && (
        <>
          <Section>
            <Label>Search Column</Label>
            <Input
              placeholder="Email  or  column header name"
              value={(meta.searchColumn as string) || ""}
              onChange={(e) => update({ searchColumn: e.target.value })}
              className="font-mono text-xs"
            />
          </Section>
          <Section>
            <Label>Search Value</Label>
            <Input
              placeholder={"user@example.com  or  {{ trigger.email }}"}
              value={(meta.searchValue as string) || ""}
              onChange={(e) => update({ searchValue: e.target.value })}
              className="font-mono text-xs"
            />
          </Section>
        </>
      )}

      {/* Get / Find: headers toggle */}
      {showHeaders && (
        <div className="flex items-center justify-between">
          <Label>First row is header</Label>
          <button
            type="button"
            role="switch"
            aria-checked={meta.hasHeaders !== false}
            onClick={() => update({ hasHeaders: meta.hasHeaders === false })}
            className={cn(
              "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
              meta.hasHeaders !== false ? "bg-primary" : "bg-input"
            )}
          >
            <span
              className={cn(
                "inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform",
                meta.hasHeaders !== false ? "translate-x-4" : "translate-x-1"
              )}
            />
          </button>
        </div>
      )}

      <ExprHint />

      {operation === "get" && (
        <p className="text-[11px] text-muted-foreground">
          Output: each row becomes a separate item with column names as keys.
          Available via{" "}
          <code className="bg-muted px-1 rounded text-[10px]">{"{{ nodeId.ColumnName }}"}</code>
        </p>
      )}
      {operation === "find" && (
        <p className="text-[11px] text-muted-foreground">
          Returns all matching rows. Each row includes{" "}
          <code className="bg-muted px-1 rounded text-[10px]">_rowNumber</code> for use in Update or Delete Row.
        </p>
      )}
      {operation === "create" && (
        <p className="text-[11px] text-muted-foreground">
          Output includes{" "}
          <code className="bg-muted px-1 rounded text-[10px]">spreadsheetId</code> and{" "}
          <code className="bg-muted px-1 rounded text-[10px]">url</code> for use in downstream nodes.
        </p>
      )}
    </div>
  );
}

function GoogleDriveConfig() {
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-md border px-3 py-3 bg-muted/40">
        <p className="text-xs font-medium mb-1">Google Drive Trigger</p>
        <p className="text-[11px] text-muted-foreground">
          This workflow fires when a file is added or changed in your monitored
          Drive folder. Configure the folder to watch on the{" "}
          <span className="font-medium">Connections</span> page.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main panel dispatcher
───────────────────────────────────────────────────────── */

type ConnectedServices = Awaited<ReturnType<typeof getConnectedServices>>;

function NodeConfigForms({
  node,
  workflowId,
}: {
  node: EditorNodeType;
  workflowId: string;
}) {
  const { state, dispatch } = useEditor();
  const [services, setServices] = useState<ConnectedServices>(null);
  // Track whether we've already fetched to avoid redundant network calls
  const fetchedRef = useRef(false);

  const meta = (node.data.metadata ?? {}) as Record<string, unknown>;

  const updateNodeMetadata = useCallback(
    (updates: Record<string, unknown>) => {
      const updatedElements = state.editor.elements.map((el) =>
        el.id === node.id
          ? { ...el, data: { ...el.data, metadata: { ...el.data.metadata, ...updates } } }
          : el
      );
      dispatch({ type: "UPDATE_NODE", payload: { elements: updatedElements } });
    },
    [state, dispatch, node.id]
  );

  // Effect 1: Fetch once — runs whenever we land on a service node for the first time
  useEffect(() => {
    if (fetchedRef.current) return;
    const nodeType = node.data.type as EditorCanvasTypes;
    if (!["Slack", "Notion", "Discord"].includes(nodeType)) return;
    fetchedRef.current = true;
    getConnectedServices().then(setServices);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.data.type]);

  // Effect 2: Auto-populate — runs whenever node changes OR services arrive
  useEffect(() => {
    if (!services) return;
    const nodeType = node.data.type as EditorCanvasTypes;
    const currentMeta = (node.data.metadata ?? {}) as Record<string, unknown>;
    if (nodeType === "Slack" && services.slack && !currentMeta.slackAccessToken) {
      updateNodeMetadata({ slackAccessToken: services.slack.token });
    }
    if (nodeType === "Notion" && services.notion && !currentMeta.accessToken) {
      updateNodeMetadata({ accessToken: services.notion.token });
    }
    if (nodeType === "Discord" && services.discord && !currentMeta.webhookUrl) {
      updateNodeMetadata({ webhookUrl: services.discord.url });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id, node.data.type, services]);

  switch (node.data.type as EditorCanvasTypes) {
    case "Webhook Trigger":
      return <WebhookTriggerConfig workflowId={workflowId} />;
    case "HTTP Request":
      return <HttpRequestConfig meta={meta} update={updateNodeMetadata} />;
    case "AI":
      return <AiConfig meta={meta} update={updateNodeMetadata} />;
    case "Condition":
      return <ConditionConfig meta={meta} update={updateNodeMetadata} />;
    case "Wait":
      return <WaitConfig meta={meta} update={updateNodeMetadata} />;
    case "Code":
      return <CodeConfig meta={meta} update={updateNodeMetadata} />;
    case "Discord":
      return (
        <DiscordConfig
          meta={meta}
          update={updateNodeMetadata}
          autoUrl={services?.discord?.url}
          autoName={services?.discord?.name}
          autoGuildName={services?.discord?.guildName}
        />
      );
    case "Slack":
      return (
        <SlackConfig
          meta={meta}
          update={updateNodeMetadata}
          autoToken={services?.slack?.token}
          autoTeamName={services?.slack?.teamName}
        />
      );
    case "Notion":
      return (
        <NotionConfig
          meta={meta}
          update={updateNodeMetadata}
          autoToken={services?.notion?.token}
          autoWorkspaceName={services?.notion?.workspaceName}
        />
      );
    case "Email":
      return <EmailConfig meta={meta} update={updateNodeMetadata} />;
    case "Set Fields":
      return <SetFieldsConfig meta={meta} update={updateNodeMetadata} />;
    case "Cron Trigger":
      return <CronTriggerConfig meta={meta} update={updateNodeMetadata} />;
    case "Google Sheets":
      return <GoogleSheetsConfig meta={meta} update={updateNodeMetadata} />;
    case "MCP":
      return <McpClientConfig meta={meta} update={updateNodeMetadata} />;
    case "Google Drive":
      return <GoogleDriveConfig />;
    default:
      return (
        <p className="text-sm text-muted-foreground">
          No configuration required for this node.
        </p>
      );
  }
}

/* ─────────────────────────────────────────────────────────
   Panel container
───────────────────────────────────────────────────────── */
export function NodeConfigPanel() {
  const { state, dispatch } = useEditor();
  const pathname = usePathname();
  const workflowId = pathname.split("/").pop()!;

  const { selectedNode } = state.editor;
  if (!selectedNode.id) return null;

  const handleClose = () => {
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

  return (
    <>
      {/* Mobile/tablet backdrop */}
      <div
        className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className={cn(
        "bg-background flex flex-col overflow-hidden",
        // ── Desktop: static right sidebar ─────────────────
        "lg:w-[340px] lg:h-full lg:border-l lg:border-border lg:shrink-0",
        "lg:static lg:z-auto lg:rounded-none lg:border-t-0",
        // ── Mobile / tablet: bottom sheet ─────────────────
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t border-border rounded-t-2xl",
        "max-h-[85vh] lg:max-h-full",
      )}>
        {/* Drag handle — mobile only */}
        <div className="lg:hidden flex justify-center pt-2.5 pb-0 shrink-0">
          <div className="w-8 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 h-12 border-b border-border shrink-0">
          <span className="text-muted-foreground shrink-0">
            <EditorCanvasIconHelper type={selectedNode.data.type} size={14} />
          </span>
          <span className="text-sm font-semibold flex-1 truncate text-foreground">
            {selectedNode.data.title}
          </span>
          <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-md shrink-0">
            {selectedNode.data.type}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground shrink-0"
            onClick={handleClose}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="config" className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-3 mt-2 mb-0 self-start h-7 bg-secondary/60 rounded-lg p-0.5">
            <TabsTrigger value="config" className="text-xs h-6 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Parameters
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-xs h-6 px-3 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Executions
            </TabsTrigger>
          </TabsList>

          <Separator className="mt-2" />

          <TabsContent value="config" className="flex-1 overflow-y-auto p-4 mt-0">
            <NodeConfigForms node={selectedNode} workflowId={workflowId} />
          </TabsContent>

          <TabsContent value="logs" className="flex-1 overflow-y-auto mt-0 p-0">
            <ExecutionLogs />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

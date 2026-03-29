"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type McpData = {
  apiKey: string;
  serverUrl: string;
  claudeConfig: object;
};

export function McpSettings() {
  const [data, setData] = useState<McpData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mcp/token");
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const copy = async (text: string, type: "key" | "config") => {
    await navigator.clipboard.writeText(text);
    if (type === "key") { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
    else { setCopiedConfig(true); setTimeout(() => setCopiedConfig(false), 2000); }
    toast.success("Copied to clipboard");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Loading MCP settings…
      </div>
    );
  }

  if (!data) return null;

  const configStr = JSON.stringify(data.claudeConfig, null, 2);

  return (
    <div className="flex flex-col gap-6">
      {/* Server URL */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">MCP Server URL</p>
        <Input value={data.serverUrl} readOnly className="font-mono text-xs" />
        <p className="text-xs text-muted-foreground">
          Add this URL to any MCP client to connect Zyflow.
        </p>
      </div>

      {/* API Key */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">API Key</p>
        <div className="flex gap-2">
          <Input
            value={data.apiKey}
            readOnly
            type="password"
            className="font-mono text-xs flex-1"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => copy(data.apiKey, "key")}
            className="shrink-0"
          >
            {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Pass this as{" "}
          <code className="bg-muted px-1 rounded text-[11px]">Authorization: Bearer &lt;key&gt;</code>
        </p>
      </div>

      {/* Claude Desktop config */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Claude Desktop Config</p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={() => copy(configStr, "config")}
          >
            {copiedConfig
              ? <><Check className="h-3 w-3 text-emerald-500" /> Copied</>
              : <><Copy className="h-3 w-3" /> Copy JSON</>
            }
          </Button>
        </div>
        <pre className={cn(
          "bg-muted rounded-lg p-3 text-[11px] font-mono overflow-auto",
          "text-foreground border border-border"
        )}>
          {configStr}
        </pre>
        <p className="text-xs text-muted-foreground">
          Paste this into{" "}
          <code className="bg-muted px-1 rounded text-[11px]">~/.claude/claude_desktop_config.json</code>{" "}
          (merge with existing <code className="bg-muted px-1 rounded text-[11px]">mcpServers</code> if present).
          After saving, restart Claude Desktop.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 flex flex-col gap-1.5">
        <p className="text-xs font-semibold text-foreground">How it works</p>
        <ul className="text-[11px] text-muted-foreground list-disc list-inside space-y-1">
          <li>Every <strong>published</strong> workflow appears as a callable tool in Claude.</li>
          <li>Claude can trigger them by passing a JSON payload.</li>
          <li>Results appear in the Executions tab of each workflow.</li>
          <li>You can also use the <strong>MCP node</strong> to call external MCP servers from inside any workflow.</li>
        </ul>
      </div>
    </div>
  );
}

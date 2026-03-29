"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { connectDiscordManually } from "../_actions/discord-connection";

export function DiscordManualConnect({ onDone }: { onDone?: () => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) { toast.error("Paste your Discord webhook URL"); return; }

    const match = trimmed.match(/discord\.com\/api\/webhooks\/(\d+)\/(.+)/);
    if (!match) { toast.error("Invalid Discord webhook URL format"); return; }
    const webhookId = match[1];

    setLoading(true);
    try {
      // Verify the webhook via Discord's public API (no auth needed)
      const res = await fetch(`https://discord.com/api/webhooks/${webhookId}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        toast.error("Could not verify webhook — make sure the URL is correct");
        return;
      }
      const data = await res.json() as {
        name?: string;
        guild_id?: string;
        channel_id?: string;
      };

      const result = await connectDiscordManually({
        webhookId,
        webhookUrl: trimmed,
        webhookName: data.name || "Zyflow",
        guildId: data.guild_id || webhookId,
        guildName: data.guild_id ? `Server ${data.guild_id}` : "Unknown Server",
        channelId: data.channel_id || webhookId,
      });

      if ("error" in result && result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Discord webhook connected!");
      setUrl("");
      onDone?.();
      router.refresh();
    } catch {
      toast.error("Failed to connect webhook — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleConnect} className="flex gap-2 mt-3">
      <Input
        placeholder="https://discord.com/api/webhooks/…"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="font-mono text-xs h-8"
      />
      <Button type="submit" size="sm" disabled={loading} className="shrink-0 h-8">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Connect"}
      </Button>
    </form>
  );
}

"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DiscordWebhookFormProps {
  onSubmit: (webhookData: {
    webhook_url: string;
    webhook_name: string;
    guild_name: string;
    channel_name: string;
  }) => Promise<void>;
}

const DiscordWebhookForm = ({ onSubmit }: DiscordWebhookFormProps) => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const parseWebhookUrl = (url: string) => {
    // Discord webhook URL format: https://discord.com/api/webhooks/{webhook_id}/{webhook_token}
    const match = url.match(
      /https:\/\/discord\.com\/api\/webhooks\/(\d+)\/(.+)/
    );
    if (!match) {
      throw new Error("Invalid Discord webhook URL format");
    }
    return {
      webhook_id: match[1],
      webhook_token: match[2],
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim()) {
      toast.error("Please enter a webhook URL");
      return;
    }

    setIsLoading(true);
    try {
      const { webhook_id } = parseWebhookUrl(webhookUrl);

      // Fetch webhook details from Discord API
      const response = await fetch(
        `https://discord.com/api/webhooks/${webhook_id}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error("Invalid webhook URL or webhook not found");
      }

      const webhookData = await response.json();

      await onSubmit({
        webhook_url: webhookUrl,
        webhook_name: webhookData.name || "Discord Webhook",
        guild_name: webhookData.guild_id || "Unknown Server",
        channel_name: webhookData.channel_id || "Unknown Channel",
      });

      toast.success("Discord webhook connected successfully!");
      setWebhookUrl("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to connect webhook"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect Discord Webhook</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="webhook-url">Discord Webhook URL</Label>
            <Input
              id="webhook-url"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              required
            />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>To get your webhook URL:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Go to your Discord server settings</li>
              <li>Navigate to Integrations → Webhooks</li>
              <li>Create a new webhook or copy existing webhook URL</li>
            </ol>
          </div>
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Connecting..." : "Connect Webhook"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default DiscordWebhookForm;

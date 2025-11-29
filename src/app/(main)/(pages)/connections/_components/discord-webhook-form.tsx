"use client";

/**
 * Discord Webhook Form Component
 *
 * This component provides a form interface for manually connecting Discord webhooks.
 * Handles webhook URL validation, Discord API integration, and error feedback.
 *
 * Features:
 * - Webhook URL validation and parsing
 * - Discord API integration for webhook verification
 * - User-friendly setup instructions
 * - Error handling and user feedback
 * - Loading states during connection process
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Props interface for the DiscordWebhookForm component.
 */
interface DiscordWebhookFormProps {
  /** Callback function to handle successful webhook setup */
  onSubmit: (webhookData: {
    webhook_url: string;
    webhook_name: string;
    guild_name: string;
    channel_name: string;
  }) => Promise<void>;
}

/**
 * DiscordWebhookForm component for manual Discord webhook connection.
 *
 * This component:
 * - Provides input field for Discord webhook URL
 * - Validates webhook URL format
 * - Fetches webhook details from Discord API
 * - Handles form submission and error states
 * - Shows setup instructions for users
 *
 * @param props - Component props containing onSubmit callback
 * @returns JSX.Element - Discord webhook connection form
 */
const DiscordWebhookForm = ({ onSubmit }: DiscordWebhookFormProps) => {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Parses Discord webhook URL to extract webhook ID and token.
   *
   * @param url - Discord webhook URL to parse
   * @returns Object containing webhook_id and webhook_token
   * @throws Error if URL format is invalid
   */
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

  /**
   * Handles form submission and webhook connection process.
   *
   * This function:
   * - Validates webhook URL input
   * - Parses webhook URL for ID extraction
   * - Fetches webhook details from Discord API
   * - Calls onSubmit callback with webhook data
   * - Provides user feedback via toast notifications
   *
   * @param e - Form submission event
   */
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

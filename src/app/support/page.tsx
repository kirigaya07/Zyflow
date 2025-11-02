import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold mb-6">Support</h1>
      <p className="text-lg text-muted-foreground mb-8">
        We're here to help! Get assistance with your Zyflow account and
        services.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>New to Zyflow? Learn the basics</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 space-y-2">
              <li>How to connect Zoom</li>
              <li>Setting up Google Drive</li>
              <li>Creating your first workflow</li>
              <li>Understanding notifications</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>
              Connect and manage your integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 space-y-2">
              <li>Zoom Cloud Recording</li>
              <li>Google Drive integration</li>
              <li>Slack notifications</li>
              <li>Discord webhooks</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Troubleshooting</CardTitle>
            <CardDescription>Common issues and solutions</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-6 space-y-2">
              <li>Webhook not receiving events</li>
              <li>Drive upload failures</li>
              <li>Authentication issues</li>
              <li>API errors</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
            <CardDescription>Need help? Reach out to us</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-2">Email: support@zyflow.com</p>
            <p className="mb-2">Response time: Within 24 hours</p>
            <p>
              We typically respond to all inquiries within one business day.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

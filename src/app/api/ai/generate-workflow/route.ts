export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

const SYSTEM_PROMPT = `You are a workflow automation builder for Zyflow, a platform similar to n8n or Zapier.

Your job: convert a plain-English description into a valid Zyflow workflow graph.

== AVAILABLE NODE TYPES ==

TRIGGERS (exactly one per workflow, always first):
- "Webhook Trigger": starts workflow when a POST request hits a unique URL. Use for: API calls, form submissions, external events.
- "Cron Trigger": starts on a schedule. metadata: { "schedule": "hourly"|"daily"|"weekly"|"monthly" }
- "Google Drive": starts when files change in Google Drive. Use for: file upload automations.

ACTION NODES (one or more, executed in order):
- "Slack": send a message to Slack. metadata: { "template": "message text, can use {{ trigger.field }}" }
- "Discord": post to a Discord webhook. metadata: { "content": "message text" }
- "Email": send an email. metadata: { "subject": "subject line", "template": "email body" }
- "Notion": create a Notion page. metadata: { "content": "page content" }
- "AI": run a GPT prompt. Output available as {{ nodeId.output }}. metadata: { "model": "gpt-4o-mini", "prompt": "your prompt, use {{ trigger.field }} for input data" }
- "HTTP Request": call any external API. metadata: { "method": "GET"|"POST"|"PUT"|"DELETE", "url": "https://..." }
- "Condition": if/else branch. metadata: { "field": "{{ trigger.status }}", "operator": "equals"|"not_equals"|"contains"|"greater_than"|"less_than", "value": "expected value" }
- "Wait": pause the workflow. metadata: { "duration": "30m"|"1h"|"6h"|"1d" }
- "Set Fields": transform data. metadata: { "fields": [{ "key": "name", "value": "{{ trigger.field }}" }] }
- "Code": run custom JavaScript. metadata: { "code": "// return transformed items\nreturn items;" }

== EXPRESSION SYNTAX ==
- {{ trigger.fieldName }} — access data from the trigger payload
- {{ nodeId.output }} — access output from a previous AI node
- {{ nodeId.fieldName }} — access any field from a previous node's output

== OUTPUT FORMAT ==
Return ONLY valid JSON, no explanation, no markdown. Exact format:

{
  "nodes": [
    {
      "id": "USE_REAL_UUID_HERE",
      "type": "NodeType",
      "position": { "x": 100, "y": 200 },
      "data": {
        "title": "Human readable title",
        "description": "Brief description of what this node does",
        "completed": false,
        "current": false,
        "metadata": {},
        "type": "NodeType"
      }
    }
  ],
  "edges": [
    { "id": "USE_REAL_UUID_HERE", "source": "source-node-id", "target": "target-node-id" }
  ]
}

== LAYOUT RULES ==
- Trigger node always at x:100, y:200
- Each subsequent linear node: x increases by 350 (so x:450, x:800, x:1150...)
- Parallel branches from one node: spread vertically by 200 (y:100, y:300, y:500...)
- Keep the graph readable and left-to-right

== RULES ==
1. Only ONE trigger node per workflow
2. Every non-trigger node must have at least one incoming edge
3. Every node must have a unique UUID id
4. Metadata should be pre-filled with sensible defaults based on the description
5. Use AI node before Slack/Notion if summarization is implied
6. If the user mentions "every day" or "daily" → use Cron Trigger with schedule "daily"
7. If the user mentions "webhook" or "API call" → use Webhook Trigger
8. If the user mentions "Google Drive" or "file upload" → use Google Drive trigger`;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { description } = await req.json();
    if (!description || typeof description !== "string" || description.trim().length < 5) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to your environment." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Build a Zyflow workflow for this: "${description.trim()}"

Remember: return ONLY valid JSON with "nodes" and "edges" arrays. Use real UUIDs for all ids.`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    let parsed: { nodes?: unknown[]; edges?: unknown[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return NextResponse.json({ error: "AI response missing nodes or edges" }, { status: 500 });
    }

    // Validate and sanitise nodes — ensure valid types and real UUIDs
    const VALID_TYPES = new Set([
      "Webhook Trigger", "Cron Trigger", "Google Drive", "Trigger",
      "Slack", "Discord", "Email", "Notion", "AI", "HTTP Request",
      "Condition", "Wait", "Set Fields", "Code",
    ]);

    const nodes = (parsed.nodes as Record<string, unknown>[]).map((n) => ({
      ...n,
      // Replace any placeholder id with a real UUID
      id: typeof n.id === "string" && n.id.includes("-") ? n.id : uuidv4(),
      type: VALID_TYPES.has(n.type as string) ? n.type : "Action",
    }));

    // Rebuild edge ids to be real UUIDs
    const edges = (parsed.edges as Record<string, unknown>[]).map((e) => ({
      ...e,
      id: typeof e.id === "string" && e.id.includes("-") ? e.id : uuidv4(),
    }));

    return NextResponse.json({ nodes, edges });
  } catch (err) {
    console.error("[ai/generate-workflow] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate workflow" },
      { status: 500 }
    );
  }
}

import type { ExecutionContext, Item, NodeConfig, NodeExecutor } from "../types";
import { interpolate } from "../expressions";
import OpenAI from "openai";

export class AIExecutor implements NodeExecutor {
  async execute(
    input: Item[],
    config: NodeConfig,
    ctx: ExecutionContext
  ): Promise<Item[]> {
    const { metadata } = config;

    const rawPrompt = metadata.prompt as string | undefined;
    const model = (metadata.model as string) || "gpt-4o-mini";

    if (!rawPrompt) {
      return [{ json: { skipped: true, reason: "No prompt configured" } }];
    }

    // Interpolate expressions so {{ trigger.field }} and {{ node.output }} work in prompts
    const prompt = interpolate(rawPrompt, ctx.nodeOutputs, ctx.triggerPayload);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Make input data available in the system context
    const inputSummary = input.length
      ? JSON.stringify(input.map((i) => i.json))
      : "No input data";

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a workflow automation assistant. Input data from previous step: ${inputSummary}`,
        },
        { role: "user", content: prompt },
      ],
    });

    const text = completion.choices[0]?.message?.content ?? "";

    return [
      {
        json: {
          output: text,
          model,
          tokens: completion.usage?.total_tokens,
        },
      },
    ];
  }
}

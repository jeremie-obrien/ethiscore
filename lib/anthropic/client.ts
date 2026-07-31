import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool, WebSearchTool20250305 } from "@anthropic-ai/sdk/resources/messages";
import { ModelEvaluationSchema, type ModelEvaluation } from "../scoring/schema";
import { SUBMIT_EVALUATION_TOOL_NAME } from "./buildPrompt";

export const DEFAULT_MODEL = "claude-sonnet-5";
const MAX_TURNS = 6;

const webSearchTool: WebSearchTool20250305 = {
  type: "web_search_20250305",
  name: "web_search",
  max_uses: 8,
};

const submitEvaluationTool: Tool = {
  name: SUBMIT_EVALUATION_TOOL_NAME,
  description: "Submit the completed per-criterion ethics evaluation for the company.",
  input_schema: {
    type: "object",
    properties: {
      criteria: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Criterion name, matching the input criterion." },
            score: { type: "number", description: "Score from 0.0 to 1.0 for this criterion." },
            rationale: { type: "string", description: "Evidence-based rationale for the score." },
            sources: {
              type: "array",
              items: { type: "string" },
              description: "Source URLs relied on for this criterion.",
            },
          },
          required: ["name", "score", "rationale", "sources"],
        },
      },
      overall_summary: {
        type: "string",
        description: "One-paragraph synthesis of the company's ethical profile across all criteria.",
      },
    },
    required: ["criteria", "overall_summary"],
  },
};

export interface RunEvaluationParams {
  apiKey: string;
  model?: string;
  system: string;
  userPrompt: string;
}

export async function runEvaluation({
  apiKey,
  model = DEFAULT_MODEL,
  system,
  userPrompt,
}: RunEvaluationParams): Promise<ModelEvaluation> {
  const client = new Anthropic({ apiKey });
  const messages: MessageParam[] = [{ role: "user", content: userPrompt }];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const forceSubmit = turn === MAX_TURNS - 1;

    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system,
      messages,
      tools: [webSearchTool, submitEvaluationTool],
      tool_choice: forceSubmit ? { type: "tool", name: SUBMIT_EVALUATION_TOOL_NAME } : { type: "auto" },
    });

    const submitBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === SUBMIT_EVALUATION_TOOL_NAME
    );
    if (submitBlock) {
      return ModelEvaluationSchema.parse(submitBlock.input);
    }

    if (response.stop_reason === "end_turn" || response.stop_reason === "max_tokens") {
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: `Please call the "${SUBMIT_EVALUATION_TOOL_NAME}" tool now with your completed findings.`,
      });
      continue;
    }

    messages.push({ role: "assistant", content: response.content });
  }

  throw new Error("Model did not return a structured evaluation within the allotted turns.");
}

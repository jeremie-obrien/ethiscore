import { randomUUID } from "node:crypto";
import { buildSystemPrompt, buildUserPrompt } from "../anthropic/buildPrompt";
import { DEFAULT_MODEL, runEvaluation } from "../anthropic/client";
import type { CriterionInput, EvaluationRecord } from "./schema";

export interface EvaluateParams {
  apiKey: string;
  company: string;
  criteria: CriterionInput[];
  model?: string;
  presetId?: string;
  presetName?: string;
}

export async function evaluateCompany({
  apiKey,
  company,
  criteria,
  model = DEFAULT_MODEL,
  presetId,
  presetName,
}: EvaluateParams): Promise<EvaluationRecord> {
  const system = buildSystemPrompt();
  const userPrompt = buildUserPrompt(company, criteria);

  const modelEvaluation = await runEvaluation({ apiKey, model, system, userPrompt });

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  const criteriaResults = criteria.map((input) => {
    const match = modelEvaluation.criteria.find(
      (c) => c.name.trim().toLowerCase() === input.name.trim().toLowerCase()
    );
    if (!match) {
      throw new Error(`Model response is missing a result for criterion "${input.name}".`);
    }
    return {
      ...match,
      description: input.description,
      weight: input.weight,
      normalizedWeight: input.weight / totalWeight,
    };
  });

  // Weighted geometric mean: a very low score on any one criterion drags the
  // whole result down much harder than a weighted arithmetic mean would.
  const overallScore = criteriaResults.reduce(
    (product, c) => product * Math.pow(c.score, c.normalizedWeight),
    1
  );

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    company,
    model,
    criteria: criteriaResults,
    overallScore: Math.round(overallScore * 10000) / 10000,
    overallSummary: modelEvaluation.overall_summary,
    presetId,
    presetName,
  };
}

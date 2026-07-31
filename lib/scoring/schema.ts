import { z } from "zod";

export const CriterionInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().positive(),
});
export type CriterionInput = z.infer<typeof CriterionInputSchema>;

export const CriterionResultSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(1),
  rationale: z.string(),
  sources: z.array(z.string()).default([]),
});
export type CriterionResult = z.infer<typeof CriterionResultSchema>;

export const ModelEvaluationSchema = z.object({
  criteria: z.array(CriterionResultSchema).min(1),
  overall_summary: z.string(),
});
export type ModelEvaluation = z.infer<typeof ModelEvaluationSchema>;

export const EvaluationRecordSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  company: z.string(),
  model: z.string(),
  criteria: z.array(
    CriterionResultSchema.extend({
      weight: z.number().positive(),
      normalizedWeight: z.number().min(0).max(1),
    })
  ),
  overallScore: z.number().min(0).max(1),
  overallSummary: z.string(),
});
export type EvaluationRecord = z.infer<typeof EvaluationRecordSchema>;

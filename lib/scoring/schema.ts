import { z } from "zod";

export const CriterionInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
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
      description: z.string().optional(),
      weight: z.number().positive(),
      normalizedWeight: z.number().min(0).max(1),
    })
  ),
  overallScore: z.number().min(0).max(1),
  overallSummary: z.string(),
  criteriaSetId: z.string(),
  criteriaSetName: z.string(),
});
export type EvaluationRecord = z.infer<typeof EvaluationRecordSchema>;

export interface EvaluateResult {
  company: string;
  record?: EvaluationRecord;
  error?: string;
}

export const CriteriaSetSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  createdAt: z.string(),
  criteria: z.array(CriterionInputSchema).min(1).max(50),
  isDefault: z.boolean().default(false),
  /** Shared with every user and read-only (seeded by supabase/migrations). */
  builtIn: z.boolean().default(false),
});
export type CriteriaSet = z.infer<typeof CriteriaSetSchema>;

import type { SupabaseClient } from "@supabase/supabase-js";
import { EvaluationRecordSchema, type EvaluationRecord } from "../scoring/schema";
import { isUuid } from "./ids";

interface EvaluationRow {
  id: string;
  created_at: string;
  company: string;
  model: string;
  criteria_set_id: string;
  criteria_set_name: string;
  criteria: EvaluationRecord["criteria"];
  overall_score: number;
  overall_summary: string;
}

function toRecord(row: EvaluationRow): EvaluationRecord {
  return EvaluationRecordSchema.parse({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    company: row.company,
    model: row.model,
    criteria: row.criteria,
    overallScore: row.overall_score,
    overallSummary: row.overall_summary,
    criteriaSetId: row.criteria_set_id,
    criteriaSetName: row.criteria_set_name,
  });
}

/** Saved under the signed-in user (user_id defaults to auth.uid() in the database). */
export async function saveEvaluation(supabase: SupabaseClient, record: EvaluationRecord): Promise<void> {
  const { error } = await supabase.from("evaluations").insert({
    id: record.id,
    created_at: record.createdAt,
    company: record.company,
    model: record.model,
    criteria_set_id: record.criteriaSetId,
    criteria_set_name: record.criteriaSetName,
    criteria: record.criteria,
    overall_score: record.overallScore,
    overall_summary: record.overallSummary,
  });
  if (error) throw error;
}

/** The signed-in user's evaluations only (row-level security filters out everyone else's). */
export async function listEvaluations(supabase: SupabaseClient): Promise<EvaluationRecord[]> {
  const { data, error } = await supabase.from("evaluations").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data as EvaluationRow[]).map(toRecord);
}

export type EvaluationSort = "date" | "score";

/** Newest-first for "date"; highest-score-first for "score" (a leaderboard ranking). */
export function sortEvaluationRecords(
  records: EvaluationRecord[],
  sort: EvaluationSort
): EvaluationRecord[] {
  const sorted = [...records];
  if (sort === "score") {
    sorted.sort((a, b) => b.overallScore - a.overallScore);
  } else {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return sorted;
}

export async function findEvaluation(supabase: SupabaseClient, id: string): Promise<EvaluationRecord | undefined> {
  if (!isUuid(id)) return undefined;
  const { data, error } = await supabase.from("evaluations").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? toRecord(data as EvaluationRow) : undefined;
}

export async function deleteEvaluation(supabase: SupabaseClient, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const { data, error } = await supabase.from("evaluations").delete().eq("id", id).select("id");
  if (error) throw error;
  return data.length > 0;
}

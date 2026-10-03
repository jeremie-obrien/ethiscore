import type { SupabaseClient } from "@supabase/supabase-js";
import { CriteriaSetSchema, type CriterionInput, type CriteriaSet } from "../scoring/schema";
import { isUuid } from "./ids";

/** The built-in ESG set (seeded in supabase/migrations) — the default until a user picks another. */
export const BUILT_IN_DEFAULT_CRITERIA_SET_ID = "00000000-0000-4000-8000-000000000001";

interface CriteriaSetRow {
  id: string;
  user_id: string | null;
  name: string;
  criteria: CriterionInput[];
  created_at: string;
}

function toCriteriaSet(row: CriteriaSetRow, defaultId: string | null): CriteriaSet {
  return CriteriaSetSchema.parse({
    id: row.id,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
    criteria: row.criteria,
    isDefault: row.id === defaultId,
    builtIn: row.user_id === null,
  });
}

async function getDefaultCriteriaSetId(supabase: SupabaseClient): Promise<string | null> {
  // Row-level security limits this to the signed-in user's own row.
  const { data, error } = await supabase.from("user_preferences").select("default_criteria_set_id").maybeSingle();
  if (error) throw error;
  return data ? data.default_criteria_set_id : BUILT_IN_DEFAULT_CRITERIA_SET_ID;
}

/** Built-in sets plus the signed-in user's own (row-level security filters out everyone else's). */
export async function listCriteriaSets(supabase: SupabaseClient): Promise<CriteriaSet[]> {
  const [{ data, error }, defaultId] = await Promise.all([
    supabase.from("criteria_sets").select("*").order("created_at"),
    getDefaultCriteriaSetId(supabase),
  ]);
  if (error) throw error;
  return (data as CriteriaSetRow[]).map((row) => toCriteriaSet(row, defaultId));
}

export async function findCriteriaSet(supabase: SupabaseClient, id: string): Promise<CriteriaSet | undefined> {
  if (!isUuid(id)) return undefined;
  const [{ data, error }, defaultId] = await Promise.all([
    supabase.from("criteria_sets").select("*").eq("id", id).maybeSingle(),
    getDefaultCriteriaSetId(supabase),
  ]);
  if (error) throw error;
  return data ? toCriteriaSet(data as CriteriaSetRow, defaultId) : undefined;
}

export async function createCriteriaSet(
  supabase: SupabaseClient,
  input: { name: string; criteria: CriterionInput[] }
): Promise<CriteriaSet> {
  const { data, error } = await supabase.from("criteria_sets").insert(input).select("*").single();
  if (error) throw error;
  return toCriteriaSet(data as CriteriaSetRow, null);
}

/** Returns undefined if the set doesn't exist or isn't the user's own (built-ins are read-only). */
export async function updateCriteriaSet(
  supabase: SupabaseClient,
  id: string,
  updates: { name?: string; criteria?: CriterionInput[] }
): Promise<CriteriaSet | undefined> {
  if (!isUuid(id)) return undefined;
  const [{ data, error }, defaultId] = await Promise.all([
    supabase.from("criteria_sets").update(updates).eq("id", id).select("*").maybeSingle(),
    getDefaultCriteriaSetId(supabase),
  ]);
  if (error) throw error;
  return data ? toCriteriaSet(data as CriteriaSetRow, defaultId) : undefined;
}

export async function deleteCriteriaSet(supabase: SupabaseClient, id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const { data, error } = await supabase.from("criteria_sets").delete().eq("id", id).select("id");
  if (error) throw error;
  return data.length > 0;
}

/** Only one criteria set can be default at a time, per user; setting one clears any other. */
export async function setDefaultCriteriaSet(
  supabase: SupabaseClient,
  userId: string,
  id: string,
  isDefault: boolean
): Promise<CriteriaSet | undefined> {
  const set = await findCriteriaSet(supabase, id);
  if (!set) return undefined;
  if (set.isDefault === isDefault) return set;

  const { error } = await supabase
    .from("user_preferences")
    .upsert({ user_id: userId, default_criteria_set_id: isDefault ? id : null });
  if (error) throw error;
  return { ...set, isDefault };
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { toFriendlyError } from "@/lib/anthropic/errors";
import { evaluateCompany } from "@/lib/scoring/evaluate";
import { findCriteriaSet } from "@/lib/storage/criteriaSets";
import { saveEvaluation } from "@/lib/storage/store";
import { createClient, requireUser } from "@/lib/supabase/server";

// One company per request (the browser loops over companies), so a single web-search-backed
// evaluation has the whole budget. 300s is the Vercel Hobby maximum.
export const maxDuration = 300;

const EvaluateRequestSchema = z.object({
  company: z.string().trim().min(1).max(200),
  criteriaSetId: z.string().min(1),
  // The visitor's own key, sent from their browser. Used for this request only: never
  // stored, logged, or returned.
  apiKey: z.string().min(1),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { response } = await requireUser(supabase);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = EvaluateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { company, criteriaSetId, apiKey, model } = parsed.data;
  const criteriaSet = await findCriteriaSet(supabase, criteriaSetId);
  if (!criteriaSet) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }

  try {
    const record = await evaluateCompany({
      apiKey,
      company,
      criteria: criteriaSet.criteria,
      model,
      criteriaSetId: criteriaSet.id,
      criteriaSetName: criteriaSet.name,
    });
    await saveEvaluation(supabase, record);
    return NextResponse.json({ record });
  } catch (err) {
    const { message, status, code } = toFriendlyError(err);
    return NextResponse.json({ error: message, code }, { status });
  }
}

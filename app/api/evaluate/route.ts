import { NextResponse } from "next/server";
import { z } from "zod";
import { toFriendlyError } from "@/lib/anthropic/errors";
import { claimFreeEvaluation, FREE_TIER_MESSAGES } from "@/lib/freeTier";
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
  // stored, logged, or returned. Omitted for a free evaluation on EthiScore's key.
  apiKey: z.string().min(1).optional(),
  // Only honored with the visitor's own key: free evaluations always use the default model.
  model: z.string().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { user, response } = await requireUser(supabase);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = EvaluateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { company, criteriaSetId } = parsed.data;
  const criteriaSet = await findCriteriaSet(supabase, criteriaSetId);
  if (!criteriaSet) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }

  const ownKey = parsed.data.apiKey;
  let free: Extract<Awaited<ReturnType<typeof claimFreeEvaluation>>, { ok: true }> | undefined;
  if (!ownKey) {
    let claim;
    try {
      claim = await claimFreeEvaluation(user.id, user.email);
    } catch {
      return NextResponse.json({ error: FREE_TIER_MESSAGES.disabled, code: "free_unavailable" }, { status: 503 });
    }
    if (!claim.ok) {
      return NextResponse.json({ error: FREE_TIER_MESSAGES[claim.reason], code: "free_unavailable" }, { status: 429 });
    }
    free = claim;
  }

  try {
    const record = await evaluateCompany({
      apiKey: ownKey ?? free!.apiKey,
      company,
      criteria: criteriaSet.criteria,
      model: ownKey ? parsed.data.model : undefined,
      criteriaSetId: criteriaSet.id,
      criteriaSetName: criteriaSet.name,
    });
    await saveEvaluation(supabase, record);
    await free?.confirm();
    return NextResponse.json({ record, free: Boolean(free) });
  } catch (err) {
    await free?.release().catch(() => {});
    const friendly = toFriendlyError(err);
    if (free) {
      // A problem with EthiScore's own key must never read as a problem with the visitor's,
      // and must not reveal anything about the key.
      if (friendly.code === "invalid_api_key") {
        return NextResponse.json({ error: FREE_TIER_MESSAGES.disabled, code: "free_unavailable" }, { status: 503 });
      }
      return NextResponse.json({ error: `${friendly.message} Your free evaluation wasn't used.` }, { status: friendly.status });
    }
    return NextResponse.json({ error: friendly.message, code: friendly.code }, { status: friendly.status });
  }
}

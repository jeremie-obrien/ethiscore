import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiKey } from "@/lib/config";
import { evaluateCompany } from "@/lib/scoring/evaluate";
import type { EvaluateResult } from "@/lib/scoring/schema";
import { findCriteriaSet } from "@/lib/storage/criteriaSets";
import { saveEvaluation } from "@/lib/storage/store";

const EvaluateRequestSchema = z.object({
  companies: z.array(z.string().min(1)).min(1),
  criteriaSetId: z.string().min(1),
  // Optional per-request key: used for that request only, never persisted.
  // Not sent by the local UI today, but keeps this route ready for a future
  // "bring your own key" shared deployment.
  apiKey: z.string().optional(),
  model: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = EvaluateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { companies, criteriaSetId, model } = parsed.data;
  const apiKey = parsed.data.apiKey ?? (await getApiKey());
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Anthropic API key configured. Set one first." },
      { status: 400 }
    );
  }

  const criteriaSet = await findCriteriaSet(criteriaSetId);
  if (!criteriaSet) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }

  const results: EvaluateResult[] = [];
  for (const company of companies) {
    try {
      const record = await evaluateCompany({
        apiKey,
        company,
        criteria: criteriaSet.criteria,
        model,
        criteriaSetId: criteriaSet.id,
        criteriaSetName: criteriaSet.name,
      });
      await saveEvaluation(record);
      results.push({ company, record });
    } catch (err) {
      results.push({ company, error: (err as Error).message });
    }
  }

  return NextResponse.json({ results });
}

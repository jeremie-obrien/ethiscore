import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiKey } from "@/lib/config";
import { CriterionInputSchema } from "@/lib/scoring/schema";
import { evaluateCompany } from "@/lib/scoring/evaluate";
import { saveEvaluation } from "@/lib/storage/store";

const EvaluateRequestSchema = z.object({
  company: z.string().min(1),
  criteria: z.array(CriterionInputSchema).min(1),
  // Optional per-request key: used for that request only, never persisted.
  // Not sent by the local UI today, but keeps this route ready for a future
  // "bring your own key" shared deployment.
  apiKey: z.string().optional(),
  model: z.string().optional(),
  presetId: z.string().optional(),
  presetName: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = EvaluateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { company, criteria, model, presetId, presetName } = parsed.data;
  const apiKey = parsed.data.apiKey ?? (await getApiKey());
  if (!apiKey) {
    return NextResponse.json(
      { error: "No Anthropic API key configured. Set one first." },
      { status: 400 }
    );
  }

  try {
    const record = await evaluateCompany({ apiKey, company, criteria, model, presetId, presetName });
    const filePath = await saveEvaluation(record);
    return NextResponse.json({ record, filePath });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

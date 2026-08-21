import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CriterionInputSchema } from "@/lib/scoring/schema";
import { listCriteriaSets, saveCriteriaSet } from "@/lib/storage/criteriaSets";

export async function GET() {
  const criteriaSets = await listCriteriaSets();
  return NextResponse.json({
    criteriaSets: [...criteriaSets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

const CreateCriteriaSetSchema = z.object({
  name: z.string().min(1),
  criteria: z.array(CriterionInputSchema).min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateCriteriaSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const criteriaSet = {
    id: randomUUID(),
    name: parsed.data.name,
    createdAt: new Date().toISOString(),
    criteria: parsed.data.criteria,
    isDefault: false,
  };
  await saveCriteriaSet(criteriaSet);
  return NextResponse.json({ criteriaSet });
}

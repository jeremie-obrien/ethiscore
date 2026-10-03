import { NextResponse } from "next/server";
import { z } from "zod";
import { CriterionInputSchema } from "@/lib/scoring/schema";
import { createCriteriaSet, listCriteriaSets } from "@/lib/storage/criteriaSets";
import { createClient, requireUser } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { response } = await requireUser(supabase);
  if (response) return response;

  const criteriaSets = await listCriteriaSets(supabase);
  return NextResponse.json({
    criteriaSets: [...criteriaSets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

const CreateCriteriaSetSchema = z.object({
  name: z.string().trim().min(1).max(200),
  criteria: z.array(CriterionInputSchema).min(1).max(50),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { response } = await requireUser(supabase);
  if (response) return response;

  const body = await request.json().catch(() => null);
  const parsed = CreateCriteriaSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const criteriaSet = await createCriteriaSet(supabase, parsed.data);
  return NextResponse.json({ criteriaSet });
}

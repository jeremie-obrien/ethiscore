import { NextResponse } from "next/server";
import { z } from "zod";
import { CriterionInputSchema } from "@/lib/scoring/schema";
import { deleteCriteriaSet, findCriteriaSet, updateCriteriaSet } from "@/lib/storage/criteriaSets";
import { createClient, requireUser } from "@/lib/supabase/server";

const UpdateCriteriaSetSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  criteria: z.array(CriterionInputSchema).min(1).max(50).optional(),
});

function builtInReadOnly() {
  return NextResponse.json(
    { error: "Built-in criteria sets can't be changed. Make a copy to customize it." },
    { status: 403 }
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { response } = await requireUser(supabase);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCriteriaSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const existing = await findCriteriaSet(supabase, id);
  if (!existing) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }
  if (existing.builtIn) return builtInReadOnly();

  const criteriaSet = await updateCriteriaSet(supabase, id, parsed.data);
  if (!criteriaSet) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }
  return NextResponse.json({ criteriaSet });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { response } = await requireUser(supabase);
  if (response) return response;

  const { id } = await params;
  const existing = await findCriteriaSet(supabase, id);
  if (!existing) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }
  if (existing.builtIn) return builtInReadOnly();

  const deleted = await deleteCriteriaSet(supabase, id);
  if (!deleted) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

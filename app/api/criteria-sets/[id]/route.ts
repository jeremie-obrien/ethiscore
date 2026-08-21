import { NextResponse } from "next/server";
import { z } from "zod";
import { CriterionInputSchema } from "@/lib/scoring/schema";
import { deleteCriteriaSet, updateCriteriaSet } from "@/lib/storage/criteriaSets";

const UpdateCriteriaSetSchema = z.object({
  name: z.string().min(1).optional(),
  criteria: z.array(CriterionInputSchema).min(1).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdateCriteriaSetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const criteriaSet = await updateCriteriaSet(id, parsed.data);
  if (!criteriaSet) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }
  return NextResponse.json({ criteriaSet });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deleteCriteriaSet(id);
  if (!deleted) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

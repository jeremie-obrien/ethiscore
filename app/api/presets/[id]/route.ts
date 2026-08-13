import { NextResponse } from "next/server";
import { z } from "zod";
import { CriterionInputSchema } from "@/lib/scoring/schema";
import { deletePreset, updatePreset } from "@/lib/storage/presets";

const UpdatePresetSchema = z.object({
  name: z.string().min(1).optional(),
  criteria: z.array(CriterionInputSchema).min(1).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = UpdatePresetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const preset = await updatePreset(id, parsed.data);
  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
  return NextResponse.json({ preset });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = await deletePreset(id);
  if (!deleted) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

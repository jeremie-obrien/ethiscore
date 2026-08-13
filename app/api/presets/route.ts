import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { CriterionInputSchema } from "@/lib/scoring/schema";
import { listPresets, savePreset } from "@/lib/storage/presets";

export async function GET() {
  const presets = await listPresets();
  return NextResponse.json({
    presets: [...presets].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

const CreatePresetSchema = z.object({
  name: z.string().min(1),
  criteria: z.array(CriterionInputSchema).min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreatePresetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const preset = {
    id: randomUUID(),
    name: parsed.data.name,
    createdAt: new Date().toISOString(),
    criteria: parsed.data.criteria,
    isDefault: false,
  };
  await savePreset(preset);
  return NextResponse.json({ preset });
}

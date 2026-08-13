import { NextResponse } from "next/server";
import { z } from "zod";
import { setDefaultPreset } from "@/lib/storage/presets";

const SetDefaultSchema = z.object({
  isDefault: z.boolean(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = SetDefaultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const preset = await setDefaultPreset(id, parsed.data.isDefault);
  if (!preset) {
    return NextResponse.json({ error: "Preset not found" }, { status: 404 });
  }
  return NextResponse.json({ preset });
}

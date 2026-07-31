import { NextResponse } from "next/server";
import { z } from "zod";
import { getApiKey, saveApiKey } from "@/lib/config";

export async function GET() {
  const key = await getApiKey();
  return NextResponse.json({ hasKey: Boolean(key) });
}

const SaveKeySchema = z.object({
  apiKey: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SaveKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "apiKey is required" }, { status: 400 });
  }

  await saveApiKey(parsed.data.apiKey);
  return NextResponse.json({ ok: true });
}

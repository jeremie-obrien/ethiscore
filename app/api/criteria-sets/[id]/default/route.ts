import { NextResponse } from "next/server";
import { z } from "zod";
import { setDefaultCriteriaSet } from "@/lib/storage/criteriaSets";
import { createClient, requireUser } from "@/lib/supabase/server";

const SetDefaultSchema = z.object({
  isDefault: z.boolean(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { user, response } = await requireUser(supabase);
  if (response) return response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = SetDefaultSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const criteriaSet = await setDefaultCriteriaSet(supabase, user.id, id, parsed.data.isDefault);
  if (!criteriaSet) {
    return NextResponse.json({ error: "Criteria set not found" }, { status: 404 });
  }
  return NextResponse.json({ criteriaSet });
}

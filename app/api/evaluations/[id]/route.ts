import { NextResponse } from "next/server";
import { deleteEvaluation, findEvaluation } from "@/lib/storage/store";
import { createClient, requireUser } from "@/lib/supabase/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { response } = await requireUser(supabase);
  if (response) return response;

  const { id } = await params;
  const record = await findEvaluation(supabase, id);
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ record });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { response } = await requireUser(supabase);
  if (response) return response;

  const { id } = await params;
  const deleted = await deleteEvaluation(supabase, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { findEvaluation } from "@/lib/storage/store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await findEvaluation(id);
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ record: entry.record });
}

import { NextResponse } from "next/server";
import { listEvaluations } from "@/lib/storage/store";

export async function GET() {
  const entries = await listEvaluations();
  return NextResponse.json({
    evaluations: entries.map((e) => e.record).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}

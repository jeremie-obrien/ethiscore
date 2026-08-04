import { NextResponse } from "next/server";
import { listEvaluations, sortEvaluationRecords, type EvaluationSort } from "@/lib/storage/store";

function isValidSort(value: string | null): value is EvaluationSort {
  return value === "date" || value === "score";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawSort = searchParams.get("sort");
  const sort: EvaluationSort = isValidSort(rawSort) ? rawSort : "score";

  const entries = await listEvaluations();
  return NextResponse.json({
    evaluations: sortEvaluationRecords(
      entries.map((e) => e.record),
      sort
    ),
  });
}

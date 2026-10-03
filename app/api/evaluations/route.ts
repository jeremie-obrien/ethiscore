import { NextResponse } from "next/server";
import { listEvaluations, sortEvaluationRecords, type EvaluationSort } from "@/lib/storage/store";
import { createClient, requireUser } from "@/lib/supabase/server";

function isValidSort(value: string | null): value is EvaluationSort {
  return value === "date" || value === "score";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { response } = await requireUser(supabase);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const rawSort = searchParams.get("sort");
  const sort: EvaluationSort = isValidSort(rawSort) ? rawSort : "score";

  return NextResponse.json({
    evaluations: sortEvaluationRecords(await listEvaluations(supabase), sort),
  });
}

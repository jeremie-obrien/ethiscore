"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { EvaluationSort } from "@/lib/storage/store";
import { withHistoryParam } from "./historyUrl";

export function SortSelect({ value }: { value: EvaluationSort }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={value}
      onChange={(e) => router.push(withHistoryParam(searchParams, "sort", e.target.value))}
      className="input h-9 w-auto pr-8"
    >
      <option value="score">Highest score</option>
      <option value="date">Newest</option>
    </select>
  );
}

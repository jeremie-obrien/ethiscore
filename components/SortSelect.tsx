"use client";

import { useRouter } from "next/navigation";
import type { EvaluationSort } from "@/lib/storage/store";

export function SortSelect({ value }: { value: EvaluationSort }) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => router.push(`/history?sort=${e.target.value}`)}
      className="rounded-md border border-border bg-page px-2 py-1 text-sm text-ink-primary outline-none focus:border-ink-muted"
    >
      <option value="score">Top score</option>
      <option value="date">Newest</option>
    </select>
  );
}

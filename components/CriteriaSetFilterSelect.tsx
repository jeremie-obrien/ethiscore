"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CriteriaSet } from "@/lib/scoring/schema";
import { withHistoryParam } from "./historyUrl";

export function CriteriaSetFilterSelect({ value, criteriaSets }: { value: string; criteriaSets: CriteriaSet[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={value}
      onChange={(e) => router.push(withHistoryParam(searchParams, "criteriaSet", e.target.value))}
      className="input h-9 w-auto pr-8"
    >
      <option value="">All criteria sets</option>
      {criteriaSets.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}

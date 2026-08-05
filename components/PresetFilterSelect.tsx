"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Preset } from "@/lib/scoring/schema";
import { withHistoryParam } from "./historyUrl";

export function PresetFilterSelect({ value, presets }: { value: string; presets: Preset[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <select
      value={value}
      onChange={(e) => router.push(withHistoryParam(searchParams, "preset", e.target.value))}
      className="rounded-md border border-border bg-page px-2 py-1 text-sm text-ink-primary outline-none focus:border-ink-muted"
    >
      <option value="">All presets</option>
      {presets.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

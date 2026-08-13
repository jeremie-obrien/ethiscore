"use client";

import { useState } from "react";
import Link from "next/link";
import type { EvaluationRecord } from "@/lib/scoring/schema";
import { ApiKeyForm } from "./ApiKeyForm";
import { EvaluateForm } from "./EvaluateForm";
import { ScoreReport } from "./ScoreReport";
import type { CriterionForm } from "./CriteriaEditor";

export function EvaluateClient({
  initialHasApiKey,
  initialCriteria,
  initialActivePreset,
}: {
  initialHasApiKey: boolean;
  initialCriteria?: CriterionForm[];
  initialActivePreset?: { id: string; name: string } | null;
}) {
  const [hasApiKey, setHasApiKey] = useState(initialHasApiKey);
  const [result, setResult] = useState<EvaluationRecord | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {!hasApiKey ? (
        <ApiKeyForm onSaved={() => setHasApiKey(true)} />
      ) : (
        <EvaluateForm
          onResult={setResult}
          initialCriteria={initialCriteria}
          initialActivePreset={initialActivePreset}
        />
      )}

      {result && (
        <div className="flex flex-col gap-3">
          <ScoreReport record={result} />
          <Link href="/history" className="text-sm text-ink-secondary hover:underline">
            View all saved evaluations →
          </Link>
        </div>
      )}
    </div>
  );
}

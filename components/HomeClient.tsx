"use client";

import { useState } from "react";
import Link from "next/link";
import type { EvaluationRecord } from "@/lib/scoring/schema";
import { ApiKeyForm } from "./ApiKeyForm";
import { EvaluateForm } from "./EvaluateForm";
import { ScoreReport } from "./ScoreReport";

export function HomeClient({ initialHasApiKey }: { initialHasApiKey: boolean }) {
  const [hasApiKey, setHasApiKey] = useState(initialHasApiKey);
  const [result, setResult] = useState<EvaluationRecord | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {!hasApiKey ? (
        <ApiKeyForm onSaved={() => setHasApiKey(true)} />
      ) : (
        <EvaluateForm onResult={setResult} />
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

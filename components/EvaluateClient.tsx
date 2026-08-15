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
  initialCompany,
  rerunFrom,
  skipDraft,
}: {
  initialHasApiKey: boolean;
  initialCriteria?: CriterionForm[];
  initialActivePreset?: { id: string; name: string } | null;
  initialCompany?: string;
  rerunFrom?: { id: string; company: string };
  skipDraft?: boolean;
}) {
  const [hasApiKey, setHasApiKey] = useState(initialHasApiKey);
  const [result, setResult] = useState<EvaluationRecord | null>(null);
  const [replaceChoice, setReplaceChoice] = useState<"pending" | "kept" | "replaced" | null>(null);
  const [replacing, setReplacing] = useState(false);

  function handleResult(record: EvaluationRecord) {
    setResult(record);
    setReplaceChoice(rerunFrom ? "pending" : null);
  }

  async function handleReplace() {
    if (!rerunFrom) return;
    setReplacing(true);
    try {
      const res = await fetch(`/api/evaluations/${rerunFrom.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to replace");
      setReplaceChoice("replaced");
    } catch {
      // leave the choice pending so the user can retry
    } finally {
      setReplacing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!hasApiKey ? (
        <ApiKeyForm onSaved={() => setHasApiKey(true)} />
      ) : (
        <EvaluateForm
          onResult={handleResult}
          initialCriteria={initialCriteria}
          initialActivePreset={initialActivePreset}
          initialCompany={initialCompany}
          skipDraft={skipDraft}
        />
      )}

      {result && (
        <div className="flex flex-col gap-3">
          {replaceChoice === "pending" && rerunFrom && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="mb-3 text-sm text-ink-secondary">
                Keep this as a new evaluation, or replace the original run for {rerunFrom.company}?
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setReplaceChoice("kept")}
                  className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink-primary hover:border-ink-muted"
                >
                  Keep both
                </button>
                <button
                  type="button"
                  onClick={handleReplace}
                  disabled={replacing}
                  className="rounded-md bg-critical px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                >
                  {replacing ? "Replacing..." : "Replace original"}
                </button>
              </div>
            </div>
          )}
          {replaceChoice === "replaced" && (
            <p className="text-sm font-medium text-good">Original evaluation replaced.</p>
          )}
          <ScoreReport record={result} />
          <Link href="/history" className="text-sm text-ink-secondary hover:underline">
            View all saved evaluations →
          </Link>
        </div>
      )}
    </div>
  );
}

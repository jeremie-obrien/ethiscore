"use client";

import { useState } from "react";
import Link from "next/link";
import type { CriteriaSet, EvaluateResult } from "@/lib/scoring/schema";
import { EvaluateForm } from "./EvaluateForm";
import { ScoreReport } from "./ScoreReport";
import { StatusChip } from "./StatusChip";
import { UsageBanner } from "./UsageBanner";
import { useEvaluationAccess } from "./useEvaluationAccess";
import { pct } from "./scoreStatus";

export function EvaluateClient({
  criteriaSets,
  initialCompanies,
  initialCriteriaSetId,
  rerunFrom,
  skipDraft,
}: {
  criteriaSets: CriteriaSet[];
  initialCompanies?: string[];
  initialCriteriaSetId?: string | null;
  rerunFrom?: { id: string; company: string };
  skipDraft?: boolean;
}) {
  const access = useEvaluationAccess();
  const [keyRejected, setKeyRejected] = useState<string | null>(null);
  const [results, setResults] = useState<EvaluateResult[] | null>(null);
  const [replaceChoice, setReplaceChoice] = useState<"pending" | "kept" | "replaced" | null>(null);
  const [replacing, setReplacing] = useState(false);

  const singleRerunResult =
    rerunFrom && results?.length === 1 && results[0].company.trim().toLowerCase() === rerunFrom.company.trim().toLowerCase()
      ? results[0]
      : undefined;

  const { apiKey, free } = access;
  const freeRemaining = free?.available ? free.remaining : 0;
  // Own key if set; otherwise free evaluations while any are left; otherwise nothing to run on.
  const canRun = Boolean(apiKey) || freeRemaining > 0;

  function handleKeyRejected(message: string) {
    access.forgetApiKey();
    setKeyRejected(message);
  }

  function handleResult(next: EvaluateResult[]) {
    setResults(next);
    setReplaceChoice(rerunFrom && next.length === 1 && next[0].record ? "pending" : null);
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
      {keyRejected && (
        <p className="rounded-lg border border-critical/30 bg-critical/5 px-4 py-3 text-sm text-critical">
          {keyRejected} It has been removed from this browser.{" "}
          <Link href="/profile" className="font-medium underline underline-offset-2">
            Add a different key
          </Link>
        </p>
      )}
      <UsageBanner access={access} />
      {apiKey !== undefined && free !== null && (
        <EvaluateForm
          apiKey={apiKey ?? null}
          freeRemaining={freeRemaining}
          disabled={!canRun}
          criteriaSets={criteriaSets}
          onInvalidApiKey={handleKeyRejected}
          onFreeChanged={access.refreshFree}
          onResult={handleResult}
          initialCompanies={initialCompanies}
          initialCriteriaSetId={initialCriteriaSetId}
          skipDraft={skipDraft}
        />
      )}

      {results && (
        <div className="flex flex-col gap-3">
          {replaceChoice === "pending" && rerunFrom && singleRerunResult?.record && (
            <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="text-sm text-ink-secondary">
                Keep this as a new evaluation, or replace the original run for {rerunFrom.company}?
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setReplaceChoice("kept")} className="btn btn-secondary btn-sm">
                  Keep both
                </button>
                <button type="button" onClick={handleReplace} disabled={replacing} className="btn btn-danger btn-sm">
                  {replacing ? "Replacing..." : "Replace original"}
                </button>
              </div>
            </div>
          )}
          {replaceChoice === "replaced" && (
            <p className="text-sm font-medium text-good-ink">Original evaluation replaced.</p>
          )}

          {results.length === 1 && results[0].record ? (
            <ScoreReport record={results[0].record} />
          ) : (
            <div className="card divide-y divide-gridline">
              <div className="px-5 py-3 text-sm font-semibold">Results</div>
              {results.map((r) =>
                r.record ? (
                  <Link
                    key={r.company}
                    href={`/history/${r.record.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 transition last:rounded-b-xl hover:bg-subtle"
                  >
                    <span className="font-medium">{r.company}</span>
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">{pct(r.record.overallScore)}</span>
                      <StatusChip score={r.record.overallScore} />
                    </span>
                  </Link>
                ) : (
                  <div key={r.company} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                    <span className="font-medium">{r.company}</span>
                    <span className="text-sm text-critical">{r.error ?? "Failed"}</span>
                  </div>
                )
              )}
            </div>
          )}
          <Link href="/history" className="text-sm text-ink-secondary hover:text-ink-primary">
            View all evaluations →
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CriteriaSet, EvaluateResult } from "@/lib/scoring/schema";
import { ApiKeyForm } from "./ApiKeyForm";
import { clearApiKey, loadApiKey, maskApiKey } from "./apiKeyStore";
import { EvaluateForm } from "./EvaluateForm";
import { ScoreReport } from "./ScoreReport";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

function KeyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <circle cx="5.5" cy="10.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7.7 8.3L13 3m-2 2l1.5 1.5M9.5 6.5L11 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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
  // undefined until mounted: the key lives in browser storage, which the server can't see.
  const [apiKey, setApiKey] = useState<string | null | undefined>(undefined);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [results, setResults] = useState<EvaluateResult[] | null>(null);
  const [replaceChoice, setReplaceChoice] = useState<"pending" | "kept" | "replaced" | null>(null);
  const [replacing, setReplacing] = useState(false);

  const singleRerunResult =
    rerunFrom && results?.length === 1 && results[0].company.trim().toLowerCase() === rerunFrom.company.trim().toLowerCase()
      ? results[0]
      : undefined;

  useEffect(() => {
    setApiKey(loadApiKey());
  }, []);

  function handleForgetKey(reason?: string) {
    clearApiKey();
    setApiKey(null);
    setApiKeyError(reason ?? null);
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
      {apiKey === undefined ? null : apiKey === null ? (
        <ApiKeyForm error={apiKeyError} onSaved={setApiKey} />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-ink-secondary">
              <span className="text-accent">
                <KeyIcon />
              </span>
              Using your Anthropic key <code className="text-xs text-ink-primary">{maskApiKey(apiKey)}</code>
            </span>
            <button type="button" onClick={() => handleForgetKey()} className="btn btn-ghost btn-sm">
              Change or forget
            </button>
          </div>
          <EvaluateForm
          apiKey={apiKey}
          criteriaSets={criteriaSets}
          onInvalidApiKey={handleForgetKey}
          onResult={handleResult}
          initialCompanies={initialCompanies}
          initialCriteriaSetId={initialCriteriaSetId}
          skipDraft={skipDraft}
          />
        </>
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

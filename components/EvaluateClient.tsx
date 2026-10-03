"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { EvaluateResult } from "@/lib/scoring/schema";
import { ApiKeyForm } from "./ApiKeyForm";
import { clearApiKey, loadApiKey, maskApiKey } from "./apiKeyStore";
import { EvaluateForm } from "./EvaluateForm";
import { ScoreReport } from "./ScoreReport";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

export function EvaluateClient({
  initialCompanies,
  initialCriteriaSetId,
  rerunFrom,
  skipDraft,
}: {
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
          <p className="-mb-3 text-xs text-ink-muted">
            Using your Anthropic key {maskApiKey(apiKey)} ·{" "}
            <button type="button" onClick={() => handleForgetKey()} className="hover:underline">
              Change or forget key
            </button>
          </p>
          <EvaluateForm
          apiKey={apiKey}
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

          {results.length === 1 && results[0].record ? (
            <ScoreReport record={results[0].record} />
          ) : (
            <div className="divide-y divide-gridline rounded-lg border border-border bg-surface">
              {results.map((r) => (
                <div key={r.company} className="flex items-center justify-between gap-3 px-5 py-4">
                  <span className="font-medium text-ink-primary">{r.company}</span>
                  {r.record ? (
                    <Link href={`/history/${r.record.id}`} className="flex items-center gap-3 hover:underline">
                      <span className="text-sm tabular-nums text-ink-secondary">{pct(r.record.overallScore)}</span>
                      <StatusChip score={r.record.overallScore} />
                    </Link>
                  ) : (
                    <span className="text-sm text-critical">{r.error ?? "Failed"}</span>
                  )}
                </div>
              ))}
            </div>
          )}
          <Link href="/history" className="text-sm text-ink-secondary hover:underline">
            View all saved evaluations →
          </Link>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CriteriaSet, EvaluateResult } from "@/lib/scoring/schema";
import { CompanyTagInput } from "./CompanyTagInput";
import { CriteriaSetPreview } from "./CriteriaSetPreview";

const DRAFT_KEY = "ethiscore:evaluate-draft";

interface EvaluateDraft {
  companies: string[];
  criteriaSetId: string | null;
}

function loadDraft(): EvaluateDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as EvaluateDraft) : null;
  } catch {
    return null;
  }
}

function saveDraft(draft: EvaluateDraft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // storage unavailable (e.g. private browsing) — draft persistence just won't work
  }
}

export function EvaluateForm({
  apiKey,
  onInvalidApiKey,
  onResult,
  initialCompanies,
  initialCriteriaSetId,
  skipDraft,
}: {
  apiKey: string;
  /** Called when Anthropic rejects the key, so the parent can ask for a new one. */
  onInvalidApiKey: (message: string) => void;
  onResult: (results: EvaluateResult[]) => void;
  initialCompanies?: string[];
  initialCriteriaSetId?: string | null;
  skipDraft?: boolean;
}) {
  const [companies, setCompanies] = useState<string[]>(initialCompanies ?? []);
  const [criteriaSetId, setCriteriaSetId] = useState<string | null>(initialCriteriaSetId ?? null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const loading = progress !== null;
  const [error, setError] = useState<string | null>(null);

  const [criteriaSets, setCriteriaSets] = useState<CriteriaSet[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fetch("/api/criteria-sets")
      .then((res) => res.json())
      .then((body) => setCriteriaSets(body.criteriaSets ?? []))
      .catch(() => {});
  }, []);

  // Restore an in-progress draft after mount (not during the initial render, so
  // server and client markup match on hydration). A fresh context — re-running a
  // past evaluation, or picking a specific criteria set — always wins over a stale
  // draft from browsing away and back (skipDraft is set by the page in that case).
  useEffect(() => {
    if (!skipDraft) {
      const draft = loadDraft();
      if (draft) {
        setCompanies(draft.companies);
        setCriteriaSetId(draft.criteriaSetId);
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the draft in sync so it survives navigating to another page and back.
  useEffect(() => {
    if (!hydrated) return;
    saveDraft({ companies, criteriaSetId });
  }, [hydrated, companies, criteriaSetId]);

  const selectedCriteriaSet = criteriaSets.find((s) => s.id === criteriaSetId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (companies.length === 0) {
      setError("Add at least one company.");
      return;
    }
    if (!criteriaSetId) {
      setError("Choose a criteria set.");
      return;
    }
    setError(null);
    setProgress({ done: 0, total: companies.length });

    // One request per company, so each evaluation gets the server's full time budget.
    const results: EvaluateResult[] = [];
    for (const company of companies) {
      try {
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company, criteriaSetId, apiKey }),
        });
        const body = await res.json().catch(() => ({}));
        if (body.code === "invalid_api_key") {
          setProgress(null);
          onInvalidApiKey(body.error);
          return;
        }
        if (!res.ok) throw new Error(body.error ?? "Evaluation failed");
        results.push({ company, record: body.record });
      } catch (err) {
        results.push({ company, error: (err as Error).message });
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    setProgress(null);
    if (results.length === 1 && results[0].error) {
      setError(results[0].error);
      return;
    }
    onResult(results);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 sm:p-8">
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-ink-secondary">Companies</label>
        <CompanyTagInput companies={companies} onChange={setCompanies} />
      </div>

      <div className="mb-6">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-ink-secondary">Criteria set:</label>
          <select
            value={criteriaSetId ?? ""}
            onChange={(e) => setCriteriaSetId(e.target.value || null)}
            className="rounded-md border border-border bg-page px-2 py-1.5 text-sm text-ink-primary outline-none focus:border-ink-muted"
          >
            <option value="" disabled>
              Choose a criteria set...
            </option>
            {criteriaSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Link href="/criteria" className="text-xs text-ink-secondary hover:underline">
            Edit criteria sets
          </Link>
        </div>
        {selectedCriteriaSet && <CriteriaSetPreview criteriaSet={selectedCriteriaSet} />}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-good px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {progress
          ? progress.total === 1
            ? "Evaluating... (this can take a few minutes)"
            : `Evaluating ${Math.min(progress.done + 1, progress.total)} of ${progress.total}...`
          : `Run evaluation${companies.length === 1 ? "" : companies.length > 1 ? "s" : ""}`}
      </button>
      {error && <p className="mt-3 text-sm text-critical">{error}</p>}
    </form>
  );
}

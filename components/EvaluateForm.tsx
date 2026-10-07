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

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

/** Shown while companies are being researched: which one, how far along, and for how long. */
function ProgressPanel({ progress }: { progress: Progress }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const elapsed = Math.max(0, Math.round((now - progress.startedAt) / 1000));
  const fraction = progress.total > 1 ? progress.done / progress.total : 0;

  return (
    <div className="rounded-lg border border-accent/25 bg-accent-soft/60 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-accent">
        <Spinner />
        Researching {progress.current}
        {progress.total > 1 && (
          <span className="font-normal opacity-80">
            ({Math.min(progress.done + 1, progress.total)} of {progress.total})
          </span>
        )}
      </div>
      {progress.total > 1 && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent/15">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${fraction * 100}%` }} />
        </div>
      )}
      <p className="mt-2 text-xs text-ink-secondary">
        {formatElapsed(elapsed)} elapsed. Each company usually takes under a minute. Keep this page open
        until it finishes.
      </p>
    </div>
  );
}

interface Progress {
  done: number;
  total: number;
  current: string;
  startedAt: number;
}

export function EvaluateForm({
  apiKey,
  criteriaSets,
  onInvalidApiKey,
  onResult,
  initialCompanies,
  initialCriteriaSetId,
  skipDraft,
}: {
  apiKey: string;
  criteriaSets: CriteriaSet[];
  /** Called when Anthropic rejects the key, so the parent can ask for a new one. */
  onInvalidApiKey: (message: string) => void;
  onResult: (results: EvaluateResult[]) => void;
  initialCompanies?: string[];
  initialCriteriaSetId?: string | null;
  skipDraft?: boolean;
}) {
  const [companies, setCompanies] = useState<string[]>(initialCompanies ?? []);
  const [criteriaSetId, setCriteriaSetId] = useState<string | null>(initialCriteriaSetId ?? null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const loading = progress !== null;
  const [error, setError] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);

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
    setProgress({ done: 0, total: companies.length, current: companies[0], startedAt: Date.now() });

    // One request per company, so each evaluation gets the server's full time budget.
    const results: EvaluateResult[] = [];
    for (const [i, company] of companies.entries()) {
      setProgress((p) => (p ? { ...p, done: i, current: company } : p));
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
    }

    setProgress(null);
    if (results.length === 1 && results[0].error) {
      setError(results[0].error);
      return;
    }
    onResult(results);
  }

  const builtIn = criteriaSets.filter((s) => s.builtIn);
  const own = criteriaSets.filter((s) => !s.builtIn);

  return (
    <form onSubmit={handleSubmit} className="card overflow-hidden">
      <fieldset disabled={loading} className="flex flex-col gap-8 p-6 sm:p-8">
        <div>
          <label className="mb-1 block text-sm font-semibold">Companies</label>
          <p className="mb-3 text-sm text-ink-secondary">Type a name and press Enter. Add as many as you like.</p>
          <CompanyTagInput companies={companies} onChange={setCompanies} />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <label htmlFor="criteria-set" className="mb-1 block text-sm font-semibold">
                Criteria set
              </label>
              <p className="text-sm text-ink-secondary">What each company is scored against.</p>
            </div>
            <Link href="/criteria" className="text-sm text-ink-secondary hover:text-ink-primary">
              Manage criteria sets
            </Link>
          </div>
          <select
            id="criteria-set"
            value={criteriaSetId ?? ""}
            onChange={(e) => setCriteriaSetId(e.target.value || null)}
            className="input mb-4"
          >
            <option value="" disabled>
              Choose a criteria set...
            </option>
            {own.length > 0 && (
              <optgroup label="Your criteria sets">
                {own.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Built-in">
              {builtIn.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </optgroup>
          </select>
          {selectedCriteriaSet && <CriteriaSetPreview criteriaSet={selectedCriteriaSet} />}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-gridline bg-subtle/50 px-6 py-5 sm:px-8">
        {progress && <ProgressPanel progress={progress} />}
        {error && <p className="text-sm text-critical">{error}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-ink-muted">
            {companies.length === 0
              ? "No companies added yet"
              : `${companies.length} compan${companies.length === 1 ? "y" : "ies"} · ${selectedCriteriaSet?.name ?? "no criteria set"}`}
          </span>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading
              ? "Evaluating..."
              : companies.length > 1
                ? `Evaluate ${companies.length} companies`
                : "Run evaluation"}
          </button>
        </div>
      </div>
    </form>
  );
}

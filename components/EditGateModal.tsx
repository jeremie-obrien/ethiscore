"use client";

import { useState } from "react";
import { ApiKeyForm } from "./ApiKeyForm";
import { useEvaluationAccess } from "./useEvaluationAccess";

interface StaleEvaluation {
  id: string;
  company: string;
  createdAt: string;
}

type RowChoice = "rerun" | "delete";

/**
 * Blocking modal: editing a criteria set makes its past evaluations
 * incomparable to future ones run under the new version. Every stale
 * evaluation must be re-run (under the new criteria) or deleted before this
 * closes, so a criteria set's evaluations always stay comparable to each other.
 */
export function EditGateModal({
  criteriaSetId,
  staleEvaluations,
  onDone,
}: {
  criteriaSetId: string;
  staleEvaluations: StaleEvaluation[];
  onDone: () => void;
}) {
  const [choices, setChoices] = useState<Record<string, RowChoice>>(() =>
    Object.fromEntries(staleEvaluations.map((e) => [e.id, "rerun" as RowChoice]))
  );
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const access = useEvaluationAccess();
  const { apiKey } = access;

  // Re-runs use the visitor's own key if set, otherwise their free evaluations. The modal
  // can't be left until every row is resolved, so a key can be added right here if needed.
  const rerunCount = staleEvaluations.filter((e) => choices[e.id] === "rerun").length;
  const freeRemaining = access.free?.available ? access.free.remaining : 0;
  const ready = apiKey !== undefined && access.free !== null;
  const needsApiKey = ready && !apiKey && rerunCount > freeRemaining;

  function setAll(choice: RowChoice) {
    setChoices(Object.fromEntries(staleEvaluations.map((e) => [e.id, choice])));
  }

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    setProgress({ done: 0, total: staleEvaluations.length });

    for (const evaluation of staleEvaluations) {
      const choice = choices[evaluation.id];
      try {
        if (choice === "delete") {
          const res = await fetch(`/api/evaluations/${evaluation.id}`, { method: "DELETE" });
          if (!res.ok) throw new Error(`Failed to delete evaluation for ${evaluation.company}`);
        } else {
          const res = await fetch("/api/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              apiKey ? { company: evaluation.company, criteriaSetId, apiKey } : { company: evaluation.company, criteriaSetId }
            ),
          });
          const body = await res.json().catch(() => ({}));
          if (body.code === "invalid_api_key") access.forgetApiKey();
          if (!apiKey) access.refreshFree();
          if (!res.ok) throw new Error(body.error ?? `Failed to re-run evaluation for ${evaluation.company}`);
          const delRes = await fetch(`/api/evaluations/${evaluation.id}`, { method: "DELETE" });
          if (!delRes.ok) throw new Error(`Re-ran ${evaluation.company} but failed to remove the old evaluation`);
        }
      } catch (err) {
        setError((err as Error).message);
        setBusy(false);
        return;
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }

    setBusy(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="card max-h-[85vh] w-full max-w-lg overflow-y-auto p-6 shadow-xl">
        <h2 className="text-lg font-semibold tracking-tight">Keep evaluations comparable</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          {staleEvaluations.length} evaluation{staleEvaluations.length === 1 ? "" : "s"} used this criteria
          set before your edit. Re-run each one under the new criteria, or delete it — evaluations under
          the same criteria set need to share the same criteria to stay comparable.
        </p>

        <div className="mt-4 flex items-center gap-3 text-xs">
          <button type="button" disabled={busy} onClick={() => setAll("rerun")} className="text-ink-secondary hover:underline disabled:opacity-50">
            Set all: Re-run
          </button>
          <button type="button" disabled={busy} onClick={() => setAll("delete")} className="text-critical hover:underline disabled:opacity-50">
            Set all: Delete
          </button>
        </div>

        <div className="mt-3 divide-y divide-gridline border-y border-gridline">
          {staleEvaluations.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink-primary">{e.company}</div>
                <div className="text-xs text-ink-muted">{new Date(e.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1 rounded-md border border-border p-0.5 text-xs">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setChoices((prev) => ({ ...prev, [e.id]: "rerun" }))}
                  className={`rounded px-2 py-1 font-medium ${
                    choices[e.id] === "rerun" ? "bg-ink-primary text-page" : "text-ink-secondary"
                  }`}
                >
                  Re-run
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setChoices((prev) => ({ ...prev, [e.id]: "delete" }))}
                  className={`rounded px-2 py-1 font-medium ${
                    choices[e.id] === "delete" ? "bg-critical text-white" : "text-ink-secondary"
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {needsApiKey && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-ink-secondary">
              {freeRemaining === 0
                ? "You have no free evaluations left this month."
                : `You have ${freeRemaining} free evaluation${freeRemaining === 1 ? "" : "s"} left this month, for ${rerunCount} re-runs.`}{" "}
              Delete some instead, or add your own API key:
            </p>
            <ApiKeyForm onSaved={access.keySaved} />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-critical">{error}</p>}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy || !ready || needsApiKey}
          className="btn btn-primary mt-5 w-full"
        >
          {busy
            ? `Working... ${progress ? `${progress.done}/${progress.total}` : ""}`
            : "Confirm"}
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import type { EvaluationRecord } from "@/lib/scoring/schema";

interface CriterionForm {
  name: string;
  description: string;
  weight: string;
}

const emptyCriterion: CriterionForm = { name: "", description: "", weight: "1" };

export function EvaluateForm({ onResult }: { onResult: (record: EvaluationRecord) => void }) {
  const [company, setCompany] = useState("");
  const [criteria, setCriteria] = useState<CriterionForm[]>([
    { ...emptyCriterion },
    { ...emptyCriterion },
    { ...emptyCriterion },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateCriterion(index: number, field: keyof CriterionForm, value: string) {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          criteria: criteria.map((c) => ({
            name: c.name,
            description: c.description,
            weight: Number(c.weight),
          })),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Evaluation failed");
      onResult(body.record as EvaluationRecord);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6 sm:p-8">
      <div className="mb-6">
        <label className="mb-1 block text-sm font-medium text-ink-secondary">Company name</label>
        <input
          type="text"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Tesla"
          className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
        />
      </div>

      <div className="flex flex-col gap-6">
        {criteria.map((c, i) => (
          <fieldset key={i} className="rounded-md border border-gridline p-4">
            <legend className="px-1 text-sm font-medium text-ink-secondary">Criterion {i + 1}</legend>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                required
                value={c.name}
                onChange={(e) => updateCriterion(i, "name", e.target.value)}
                placeholder="Name (e.g. Environment)"
                className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
              />
              <textarea
                required
                value={c.description}
                onChange={(e) => updateCriterion(i, "description", e.target.value)}
                placeholder="Description — what should score well vs. poorly here"
                rows={2}
                className="w-full resize-y rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-ink-muted">Weight</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={c.weight}
                  onChange={(e) => updateCriterion(i, "weight", e.target.value)}
                  className="w-24 rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
                />
                <span className="text-xs text-ink-muted">relative importance — doesn't need to sum to anything</span>
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-md bg-good px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? `Researching ${company || "company"}...` : "Run evaluation"}
      </button>
      {error && <p className="mt-3 text-sm text-critical">{error}</p>}
    </form>
  );
}

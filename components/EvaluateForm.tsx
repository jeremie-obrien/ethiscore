"use client";

import { useEffect, useState } from "react";
import type { EvaluationRecord, Preset } from "@/lib/scoring/schema";
import { SavePresetControl } from "./SavePresetControl";

interface CriterionForm {
  name: string;
  description: string;
  weight: string;
}

const emptyCriterion: CriterionForm = { name: "", description: "", weight: "1" };

/** Rows with no name are treated as if they were deleted — not sent to the API. */
function filledCriteria(list: CriterionForm[]): CriterionForm[] {
  return list.filter((c) => c.name.trim().length > 0);
}

export function EvaluateForm({ onResult }: { onResult: (record: EvaluationRecord) => void }) {
  const [company, setCompany] = useState("");
  const [criteria, setCriteria] = useState<CriterionForm[]>([
    { ...emptyCriterion },
    { ...emptyCriterion },
    { ...emptyCriterion },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetch("/api/presets")
      .then((res) => res.json())
      .then((body) => setPresets(body.presets ?? []))
      .catch(() => {});
  }, []);

  function mutateCriteria(next: CriterionForm[]) {
    setCriteria(next);
    setActivePreset(null);
  }

  function updateCriterion(index: number, field: keyof CriterionForm, value: string) {
    mutateCriteria(criteria.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function addCriterion() {
    mutateCriteria([...criteria, { ...emptyCriterion }]);
  }

  function removeCriterion(index: number) {
    if (criteria.length <= 1) return;
    mutateCriteria(criteria.filter((_, i) => i !== index));
  }

  function loadPreset(id: string) {
    if (!id) return;
    const preset = presets.find((p) => p.id === id);
    if (!preset) return;
    setCriteria(
      preset.criteria.map((c) => ({
        name: c.name,
        description: c.description ?? "",
        weight: String(c.weight),
      }))
    );
    setActivePreset({ id: preset.id, name: preset.name });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filled = filledCriteria(criteria);
    if (filled.length === 0) {
      setError("Add at least one criterion with a name.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          criteria: filled.map((c) => ({
            name: c.name,
            description: c.description.trim() || undefined,
            weight: Number(c.weight),
          })),
          presetId: activePreset?.id,
          presetName: activePreset?.name,
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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-ink-secondary">Load preset</label>
        <select
          value={activePreset?.id ?? ""}
          onChange={(e) => loadPreset(e.target.value)}
          className="rounded-md border border-border bg-page px-2 py-1.5 text-sm text-ink-primary outline-none focus:border-ink-muted"
        >
          <option value="">Custom (unsaved)</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {activePreset && (
          <span className="text-xs text-ink-muted">using &ldquo;{activePreset.name}&rdquo;</span>
        )}
        <div className="ml-auto">
          <SavePresetControl
            criteria={filledCriteria(criteria).map((c) => ({
              name: c.name,
              description: c.description,
              weight: Number(c.weight),
            }))}
            onSaved={(preset) => {
              setPresets((prev) => [preset, ...prev]);
              setActivePreset({ id: preset.id, name: preset.name });
            }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {criteria.map((c, i) => (
          <fieldset key={i} className="rounded-md border border-gridline p-4">
            <legend className="flex items-center gap-2 px-1 text-sm font-medium text-ink-secondary">
              Criterion {i + 1}
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCriterion(i)}
                  className="text-xs font-normal text-critical hover:underline"
                >
                  Remove
                </button>
              )}
            </legend>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateCriterion(i, "name", e.target.value)}
                placeholder="Name (e.g. Environment)"
                className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
              />
              <textarea
                value={c.description}
                onChange={(e) => updateCriterion(i, "description", e.target.value)}
                placeholder="Description (optional) — what should score well vs. poorly here"
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
        type="button"
        onClick={addCriterion}
        className="mt-4 w-full rounded-md border border-dashed border-gridline px-4 py-2 text-sm font-medium text-ink-secondary hover:border-ink-muted"
      >
        + Add criterion
      </button>

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

"use client";

import { useEffect, useState } from "react";
import type { EvaluationRecord, Preset } from "@/lib/scoring/schema";
import { SavePresetControl } from "./SavePresetControl";
import { CriteriaEditor, emptyCriterion, filledCriteria, type CriterionForm } from "./CriteriaEditor";

export function EvaluateForm({
  onResult,
  initialCriteria,
  initialActivePreset,
}: {
  onResult: (record: EvaluationRecord) => void;
  initialCriteria?: CriterionForm[];
  initialActivePreset?: { id: string; name: string } | null;
}) {
  const [company, setCompany] = useState("");
  const [criteria, setCriteria] = useState<CriterionForm[]>(
    initialCriteria && initialCriteria.length > 0
      ? initialCriteria
      : [{ ...emptyCriterion }, { ...emptyCriterion }, { ...emptyCriterion }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePreset, setActivePreset] = useState<{ id: string; name: string } | null>(
    initialActivePreset ?? null
  );

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

      <CriteriaEditor criteria={criteria} onChange={mutateCriteria} />

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

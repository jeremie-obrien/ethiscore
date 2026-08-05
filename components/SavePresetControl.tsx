"use client";

import { useEffect, useState } from "react";
import type { Preset } from "@/lib/scoring/schema";

interface PresetCriterionInput {
  name: string;
  description?: string;
  weight: number;
}

/** Order-independent content key, so a preset matches regardless of criteria order. */
function criteriaKey(criteria: PresetCriterionInput[]): string {
  return [...criteria]
    .map((c) => `${c.name.trim().toLowerCase()}|${(c.description ?? "").trim().toLowerCase()}|${c.weight}`)
    .sort()
    .join("::");
}

export function SavePresetControl({
  criteria,
  disabledReason,
  onSaved,
}: {
  criteria: PresetCriterionInput[];
  disabledReason?: string;
  onSaved?: (preset: Preset) => void;
}) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/presets")
      .then((res) => res.json())
      .then((body) => setPresets(body.presets ?? []))
      .catch(() => {});
  }, []);

  const isEmpty = criteria.every(
    (c) => c.name.trim().length === 0 && (c.description ?? "").trim().length === 0
  );
  const matchingPreset = presets.find((p) => criteriaKey(p.criteria) === criteriaKey(criteria));

  async function handleSave() {
    if (name.trim().length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), criteria }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to save preset");
      setPresets((prev) => [body.preset, ...prev]);
      setOpen(false);
      setName("");
      onSaved?.(body.preset as Preset);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (disabledReason) {
    return (
      <span className="text-xs text-ink-muted" title={disabledReason}>
        Save as preset (unavailable)
      </span>
    );
  }

  if (isEmpty) {
    return (
      <span className="rounded-md bg-track px-3 py-1.5 text-sm font-medium text-ink-muted">
        Nothing to save
      </span>
    );
  }

  if (matchingPreset) {
    return (
      <span
        className="rounded-md bg-track px-3 py-1.5 text-sm font-medium text-ink-muted"
        title={`Matches your saved preset "${matchingPreset.name}"`}
      >
        Already saved
      </span>
    );
  }

  if (open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSave())}
          placeholder="Preset name"
          className="rounded-md border border-border bg-page px-2 py-1.5 text-sm text-ink-primary outline-none focus:border-ink-muted"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || name.trim().length === 0}
          className="rounded-md bg-good px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-ink-secondary hover:underline"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-critical">{error}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="rounded-md bg-good px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
    >
      Save as preset
    </button>
  );
}

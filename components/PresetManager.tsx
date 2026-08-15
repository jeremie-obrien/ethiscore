"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { EvaluationRecord, Preset } from "@/lib/scoring/schema";
import { parseCsv } from "@/lib/csv";
import { CriteriaEditor, emptyCriterion, filledCriteria, type CriterionForm } from "./CriteriaEditor";

/** Expects a header row, then "Criterion name","Criterion description","Criterion weight" per row. */
function criteriaFromCsv(text: string): CriterionForm[] {
  const rows = parseCsv(text);
  const dataRows = rows.slice(1); // skip header
  return dataRows
    .map((r): CriterionForm => {
      const name = (r[0] ?? "").trim();
      const description = (r[1] ?? "").trim();
      const weightNum = Number(r[2]);
      const weight = Number.isFinite(weightNum) && weightNum > 0 ? String(weightNum) : "1";
      return { name, description, weight };
    })
    .filter((c) => c.name.length > 0);
}

function toCriteriaForm(preset: Preset): CriterionForm[] {
  return preset.criteria.map((c) => ({
    name: c.name,
    description: c.description ?? "",
    weight: String(c.weight),
  }));
}

function toApiCriteria(criteria: CriterionForm[]) {
  return filledCriteria(criteria).map((c) => ({
    name: c.name,
    description: c.description.trim() || undefined,
    weight: Number(c.weight),
  }));
}

export function PresetManager({ initialPresets }: { initialPresets: Preset[] }) {
  const [presets, setPresets] = useState<Preset[]>(initialPresets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCriteria, setEditCriteria] = useState<CriterionForm[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rerunSuggestion, setRerunSuggestion] = useState<{ presetId: string; count: number } | null>(null);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCriteria, setNewCriteria] = useState<CriterionForm[]>([{ ...emptyCriterion }]);
  const [creatingBusy, setCreatingBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const parsed = criteriaFromCsv(text);
      if (parsed.length === 0) {
        throw new Error(
          'No valid rows found. Expected a header row, then "Criterion name","Criterion description","Criterion weight" per row.'
        );
      }
      setNewCriteria(parsed);
      setNewName((prev) => prev || file.name.replace(/\.csv$/i, ""));
      setCreating(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import CSV");
    }
  }

  function startEdit(preset: Preset) {
    setEditingId(preset.id);
    setEditName(preset.name);
    setEditCriteria(toCriteriaForm(preset));
    setConfirmDeleteId(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    if (editName.trim().length === 0) {
      setError("Preset name can't be empty.");
      return;
    }
    const criteria = toApiCriteria(editCriteria);
    if (criteria.length === 0) {
      setError("Add at least one criterion with a name.");
      return;
    }
    setBusyId(id);
    setError(null);
    setRerunSuggestion(null);
    try {
      const res = await fetch(`/api/presets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), criteria }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to update preset");
      setPresets((prev) => prev.map((p) => (p.id === id ? (body.preset as Preset) : p)));
      setEditingId(null);

      try {
        const evalRes = await fetch("/api/evaluations");
        const evalBody = await evalRes.json();
        const count = ((evalBody.evaluations ?? []) as EvaluationRecord[]).filter(
          (e) => e.presetId === id
        ).length;
        if (count > 0) setRerunSuggestion({ presetId: id, count });
      } catch {
        // non-critical — just skip the suggestion if this fails
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/presets/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to delete preset");
      setPresets((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleDefault(preset: Preset) {
    const nextIsDefault = !preset.isDefault;
    setBusyId(preset.id);
    setError(null);
    try {
      const res = await fetch(`/api/presets/${preset.id}/default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: nextIsDefault }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to update default preset");
      setPresets((prev) =>
        prev.map((p) =>
          nextIsDefault ? { ...p, isDefault: p.id === preset.id } : p.id === preset.id ? { ...p, isDefault: false } : p
        )
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCreate() {
    if (newName.trim().length === 0) {
      setError("Preset name can't be empty.");
      return;
    }
    const criteria = toApiCriteria(newCriteria);
    if (criteria.length === 0) {
      setError("Add at least one criterion with a name.");
      return;
    }
    setCreatingBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), criteria }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to create preset");
      setPresets((prev) => [body.preset as Preset, ...prev]);
      setCreating(false);
      setNewName("");
      setNewCriteria([{ ...emptyCriterion }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreatingBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-critical">{error}</p>}

      <div className="rounded-lg border border-border bg-surface p-6">
        {creating ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-secondary">Preset name</label>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Consumer Goods"
              className="mb-4 w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
            />
            <CriteriaEditor criteria={newCriteria} onChange={setNewCriteria} />
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creatingBusy}
                className="rounded-md bg-good px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {creatingBusy ? "Saving..." : "Save preset"}
              </button>
              <button
                type="button"
                onClick={() => setCreating(false)}
                className="text-sm text-ink-secondary hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex-1 rounded-md border border-dashed border-gridline px-4 py-2 text-sm font-medium text-ink-secondary hover:border-ink-muted"
            >
              + New preset (manual)
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 rounded-md border border-dashed border-gridline px-4 py-2 text-sm font-medium text-ink-secondary hover:border-ink-muted"
              title='CSV columns: "Criterion name","Criterion description","Criterion weight"'
            >
              Import CSV
            </button>
          </div>
        )}
        {!creating && (
          <p className="mt-2 text-xs text-ink-muted">
            CSV format: header row, then one row per criterion — &ldquo;Criterion name&rdquo;,
            &ldquo;Criterion description&rdquo;, &ldquo;Criterion weight&rdquo;.
          </p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {presets.length === 0 && (
        <p className="text-sm text-ink-secondary">
          No presets saved yet. Create one above, or save one from the evaluate form.
        </p>
      )}

      {presets.map((preset) => (
        <div key={preset.id} className="rounded-lg border border-border bg-surface p-6">
          {editingId === preset.id ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-secondary">Preset name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mb-4 w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
              />
              <CriteriaEditor criteria={editCriteria} onChange={setEditCriteria} />
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveEdit(preset.id)}
                  disabled={busyId === preset.id}
                  className="rounded-md bg-good px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busyId === preset.id ? "Saving..." : "Save changes"}
                </button>
                <button type="button" onClick={cancelEdit} className="text-sm text-ink-secondary hover:underline">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink-primary">{preset.name}</span>
                  {preset.isDefault && (
                    <span className="rounded-full bg-good px-2 py-0.5 text-xs font-medium text-white">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => toggleDefault(preset)}
                    disabled={busyId === preset.id}
                    className="text-ink-secondary hover:underline disabled:opacity-50"
                  >
                    {preset.isDefault ? "Unset default" : "Set as default"}
                  </button>
                  <button type="button" onClick={() => startEdit(preset)} className="text-ink-secondary hover:underline">
                    Edit
                  </button>
                  {confirmDeleteId === preset.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-ink-muted">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(preset.id)}
                        disabled={busyId === preset.id}
                        className="font-medium text-critical hover:underline disabled:opacity-50"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-ink-secondary hover:underline"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(preset.id)}
                      className="text-critical hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-1">
                {preset.criteria.map((c) => (
                  <span
                    key={c.name}
                    className="rounded-full border border-gridline px-2 py-0.5 text-xs text-ink-secondary"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
              <div className="flex justify-end">
                <Link
                  href={`/evaluate?preset=${preset.id}`}
                  className="inline-block rounded-md bg-good px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  New evaluation with this preset
                </Link>
              </div>
              {rerunSuggestion?.presetId === preset.id && (
                <p className="mt-3 text-sm text-ink-secondary">
                  {rerunSuggestion.count} past evaluation{rerunSuggestion.count === 1 ? "" : "s"} used
                  this preset before the edit.{" "}
                  <Link href={`/history?preset=${preset.id}`} className="font-medium text-ink-primary hover:underline">
                    Review and re-run them →
                  </Link>
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

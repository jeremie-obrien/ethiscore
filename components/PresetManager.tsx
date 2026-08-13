"use client";

import { useState } from "react";
import type { Preset } from "@/lib/scoring/schema";
import { CriteriaEditor, emptyCriterion, filledCriteria, type CriterionForm } from "./CriteriaEditor";

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

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCriteria, setNewCriteria] = useState<CriterionForm[]>([{ ...emptyCriterion }]);
  const [creatingBusy, setCreatingBusy] = useState(false);

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
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="w-full rounded-md border border-dashed border-gridline px-4 py-2 text-sm font-medium text-ink-secondary hover:border-ink-muted"
          >
            + New preset
          </button>
        )}
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
              <div className="flex flex-wrap gap-1">
                {preset.criteria.map((c) => (
                  <span
                    key={c.name}
                    className="rounded-full border border-gridline px-2 py-0.5 text-xs text-ink-secondary"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { EvaluationRecord, CriteriaSet } from "@/lib/scoring/schema";
import { parseCsv } from "@/lib/csv";
import { CriteriaEditor, emptyCriterion, filledCriteria, type CriterionForm } from "./CriteriaEditor";
import { EditGateModal } from "./EditGateModal";

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

function toCriteriaForm(set: CriteriaSet): CriterionForm[] {
  return set.criteria.map((c) => ({
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

export function CriteriaSetManager({ initialCriteriaSets }: { initialCriteriaSets: CriteriaSet[] }) {
  const [criteriaSets, setCriteriaSets] = useState<CriteriaSet[]>(initialCriteriaSets);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCriteria, setEditCriteria] = useState<CriterionForm[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editGate, setEditGate] = useState<{
    criteriaSetId: string;
    staleEvaluations: { id: string; company: string; createdAt: string }[];
  } | null>(null);

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

  function startEdit(set: CriteriaSet) {
    setEditingId(set.id);
    setEditName(set.name);
    setEditCriteria(toCriteriaForm(set));
    setConfirmDeleteId(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    if (editName.trim().length === 0) {
      setError("Criteria set name can't be empty.");
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
      const res = await fetch(`/api/criteria-sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), criteria }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to update criteria set");
      setCriteriaSets((prev) => prev.map((s) => (s.id === id ? (body.criteriaSet as CriteriaSet) : s)));
      setEditingId(null);

      try {
        const evalRes = await fetch("/api/evaluations");
        const evalBody = await evalRes.json();
        const stale = ((evalBody.evaluations ?? []) as EvaluationRecord[])
          .filter((e) => e.criteriaSetId === id)
          .map((e) => ({ id: e.id, company: e.company, createdAt: e.createdAt }));
        if (stale.length > 0) setEditGate({ criteriaSetId: id, staleEvaluations: stale });
      } catch {
        // non-critical — if this fails the stale evaluations just won't be caught here
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
      const res = await fetch(`/api/criteria-sets/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to delete criteria set");
      setCriteriaSets((prev) => prev.filter((s) => s.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleDefault(set: CriteriaSet) {
    const nextIsDefault = !set.isDefault;
    setBusyId(set.id);
    setError(null);
    try {
      const res = await fetch(`/api/criteria-sets/${set.id}/default`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: nextIsDefault }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to update default criteria set");
      setCriteriaSets((prev) =>
        prev.map((s) =>
          nextIsDefault ? { ...s, isDefault: s.id === set.id } : s.id === set.id ? { ...s, isDefault: false } : s
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
      setError("Criteria set name can't be empty.");
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
      const res = await fetch("/api/criteria-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), criteria }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Failed to create criteria set");
      setCriteriaSets((prev) => [body.criteriaSet as CriteriaSet, ...prev]);
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
            <label className="mb-1 block text-sm font-medium text-ink-secondary">Criteria set name</label>
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
                {creatingBusy ? "Saving..." : "Save criteria set"}
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
              + New criteria set (manual)
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

      {criteriaSets.length === 0 && (
        <p className="text-sm text-ink-secondary">No criteria sets yet. Create one above.</p>
      )}

      {criteriaSets.map((set) => (
        <div key={set.id} className="rounded-lg border border-border bg-surface p-6">
          {editingId === set.id ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-secondary">Criteria set name</label>
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
                  onClick={() => saveEdit(set.id)}
                  disabled={busyId === set.id}
                  className="rounded-md bg-good px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {busyId === set.id ? "Saving..." : "Save changes"}
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
                  <span className="font-medium text-ink-primary">{set.name}</span>
                  {set.isDefault && (
                    <span className="rounded-full bg-good px-2 py-0.5 text-xs font-medium text-white">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => toggleDefault(set)}
                    disabled={busyId === set.id}
                    className="text-ink-secondary hover:underline disabled:opacity-50"
                  >
                    {set.isDefault ? "Unset default" : "Set as default"}
                  </button>
                  <button type="button" onClick={() => startEdit(set)} className="text-ink-secondary hover:underline">
                    Edit
                  </button>
                  {confirmDeleteId === set.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-ink-muted">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(set.id)}
                        disabled={busyId === set.id}
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
                      onClick={() => setConfirmDeleteId(set.id)}
                      className="text-critical hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-1">
                {set.criteria.map((c) => (
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
                  href={`/evaluate?criteriaSet=${set.id}`}
                  className="inline-block rounded-md bg-good px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
                >
                  New evaluation with this criteria set
                </Link>
              </div>
            </div>
          )}
        </div>
      ))}

      {editGate && (
        <EditGateModal
          criteriaSetId={editGate.criteriaSetId}
          staleEvaluations={editGate.staleEvaluations}
          onDone={() => setEditGate(null)}
        />
      )}
    </div>
  );
}

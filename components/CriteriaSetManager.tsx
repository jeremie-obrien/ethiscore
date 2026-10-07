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

  /** Built-in sets are read-only, so customizing one starts a new set from a copy of it. */
  function startCopy(set: CriteriaSet) {
    setNewName(`${set.name} (copy)`);
    setNewCriteria(toCriteriaForm(set));
    setCreating(true);
    setEditingId(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      <div className={creating ? "card p-6 sm:p-8" : ""}>
        {creating ? (
          <div>
            <h2 className="mb-5 text-lg font-semibold tracking-tight">New criteria set</h2>
            <label className="mb-1.5 block text-sm font-medium">Name</label>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Consumer goods"
              className="input mb-6"
            />
            <CriteriaEditor criteria={newCriteria} onChange={setNewCriteria} />
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-gridline pt-5">
              <button type="button" onClick={() => setCreating(false)} className="btn btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleCreate} disabled={creatingBusy} className="btn btn-primary">
                {creatingBusy ? "Saving..." : "Save criteria set"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setCreating(true)} className="btn btn-primary">
              New criteria set
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              title='CSV columns: "Criterion name","Criterion description","Criterion weight"'
            >
              Import from CSV
            </button>
            <span className="text-xs text-ink-muted">
              CSV: header row, then name, description, weight per row
            </span>
          </div>
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

      {[
        { title: "Your criteria sets", sets: criteriaSets.filter((x) => !x.builtIn) },
        { title: "Built-in", sets: criteriaSets.filter((x) => x.builtIn) },
      ].map((group) =>
        group.sets.length === 0 ? null : (
          <section key={group.title} className="mt-4 flex flex-col gap-3">
            <h2 className="text-xs font-semibold tracking-wider text-ink-muted uppercase">{group.title}</h2>
            {group.sets.map((set) => (
        <div key={set.id} className="card p-6">
          {editingId === set.id ? (
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input mb-6"
              />
              <CriteriaEditor criteria={editCriteria} onChange={setEditCriteria} />
              <div className="mt-6 flex items-center justify-end gap-2 border-t border-gridline pt-5">
                <button type="button" onClick={cancelEdit} className="btn btn-ghost">
                  Cancel
                </button>
                <button type="button" onClick={() => saveEdit(set.id)} disabled={busyId === set.id} className="btn btn-primary">
                  {busyId === set.id ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{set.name}</h3>
                {set.isDefault && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent">Default</span>
                )}
                <span className="text-xs text-ink-muted">
                  {set.criteria.length} criteri{set.criteria.length === 1 ? "on" : "a"}
                </span>
              </div>
              <div className="mb-5 flex flex-wrap gap-1.5">
                {set.criteria.map((c) => (
                  <span key={c.name} className="rounded-md bg-subtle px-2 py-0.5 text-xs text-ink-secondary">
                    {c.name}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gridline pt-4">
                <div className="flex flex-wrap items-center gap-1">
                  {set.builtIn ? (
                    <button type="button" onClick={() => startCopy(set)} className="btn btn-ghost btn-sm">
                      Make a copy
                    </button>
                  ) : (
                    <button type="button" onClick={() => startEdit(set)} className="btn btn-ghost btn-sm">
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleDefault(set)}
                    disabled={busyId === set.id}
                    className="btn btn-ghost btn-sm"
                  >
                    {set.isDefault ? "Unset default" : "Set as default"}
                  </button>
                  {set.builtIn ? null : confirmDeleteId === set.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDelete(set.id)}
                        disabled={busyId === set.id}
                        className="btn btn-danger btn-sm"
                      >
                        Delete set
                      </button>
                      <button type="button" onClick={() => setConfirmDeleteId(null)} className="btn btn-ghost btn-sm">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(set.id)}
                      className="btn btn-ghost btn-sm hover:text-critical"
                    >
                      Delete
                    </button>
                  )}
                </div>
                <Link href={`/evaluate?criteriaSet=${set.id}`} className="btn btn-secondary btn-sm">
                  Evaluate with this set
                </Link>
              </div>
            </div>
          )}
        </div>
            ))}
          </section>
        )
      )}

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

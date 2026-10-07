"use client";

import Link from "next/link";
import { useState } from "react";
import type { EvaluationRecord } from "@/lib/scoring/schema";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

export function EvaluationList({
  evaluations: initialEvaluations,
  showRank = false,
  emptyMessage,
}: {
  evaluations: EvaluationRecord[];
  showRank?: boolean;
  emptyMessage?: React.ReactNode;
}) {
  const [evaluations, setEvaluations] = useState(initialEvaluations);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setEvaluations((prev) => prev.filter((e) => e.id !== id));
      setConfirmDeleteId(null);
    } catch {
      // leave the confirm open so the user can retry
    } finally {
      setBusyId(null);
    }
  }

  if (evaluations.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <p className="text-sm text-ink-secondary">{emptyMessage ?? "No evaluations yet."}</p>
        <Link href="/evaluate?reset=1" className="btn btn-primary mt-4">
          Run an evaluation
        </Link>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-gridline">
      {evaluations.map((record, i) => (
        <div
          key={record.id}
          className="group flex items-center gap-4 px-5 py-3.5 transition first:rounded-t-xl last:rounded-b-xl hover:bg-subtle"
        >
          {showRank && (
            <span className="w-6 shrink-0 text-right text-sm font-medium tabular-nums text-ink-muted">{i + 1}</span>
          )}
          <Link href={`/history/${record.id}`} className="min-w-0 flex-1">
            <div className="truncate font-medium">{record.company}</div>
            <div className="truncate text-xs text-ink-muted">
              {record.criteriaSetName} · {new Date(record.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </div>
          </Link>

          <div className="hidden shrink-0 items-center gap-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 sm:flex">
            {confirmDeleteId === record.id ? (
              <>
                <button
                  type="button"
                  onClick={() => handleDelete(record.id)}
                  disabled={busyId === record.id}
                  className="btn btn-danger btn-sm"
                >
                  {busyId === record.id ? "Deleting..." : "Delete"}
                </button>
                <button type="button" onClick={() => setConfirmDeleteId(null)} className="btn btn-ghost btn-sm">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <Link href={`/evaluate?rerunFrom=${record.id}`} className="btn btn-ghost btn-sm">
                  Re-run
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(record.id)}
                  className="btn btn-ghost btn-sm hover:text-critical"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          <Link href={`/history/${record.id}`} className="flex shrink-0 items-center gap-3" tabIndex={-1}>
            <span className="w-10 text-right text-sm font-semibold tabular-nums">{pct(record.overallScore)}</span>
            <span className="hidden w-16 sm:block">
              <StatusChip score={record.overallScore} />
            </span>
          </Link>
        </div>
      ))}
    </div>
  );
}

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
      <p className="text-sm text-ink-secondary">
        {emptyMessage ?? (
          <>
            No evaluations saved yet.{" "}
            <Link href="/evaluate?reset=1" className="hover:underline">
              Run one
            </Link>
            .
          </>
        )}
      </p>
    );
  }

  return (
    <div className="divide-y divide-gridline rounded-lg border border-border bg-surface">
      {evaluations.map((record, i) => (
        <div key={record.id} className="flex flex-wrap items-start justify-between gap-2 px-5 py-4 hover:bg-page">
          <Link href={`/history/${record.id}`} className="flex min-w-0 flex-1 items-start gap-3">
            {showRank && (
              <span className="w-6 shrink-0 pt-0.5 text-right text-sm tabular-nums text-ink-muted">
                {i + 1}
              </span>
            )}
            <div className="min-w-0">
              <div className="font-medium text-ink-primary">{record.company}</div>
              <div className="text-xs text-ink-muted">
                {new Date(record.createdAt).toLocaleString()}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="rounded-full bg-page px-2 py-0.5 text-xs font-medium text-ink-secondary">
                  {record.criteriaSetName}
                </span>
                {record.criteria.map((c) => (
                  <span
                    key={c.name}
                    className="rounded-full border border-gridline px-2 py-0.5 text-xs text-ink-secondary"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          </Link>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 pt-0.5">
              <span className="text-sm tabular-nums text-ink-secondary">{pct(record.overallScore)}</span>
              <StatusChip score={record.overallScore} />
            </div>
            <div className="flex items-center gap-3 text-xs">
              <Link href={`/evaluate?rerunFrom=${record.id}`} className="text-ink-secondary hover:underline">
                Re-run
              </Link>
              {confirmDeleteId === record.id ? (
                <span className="flex items-center gap-2">
                  <span className="text-ink-muted">Delete?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(record.id)}
                    disabled={busyId === record.id}
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
                  onClick={() => setConfirmDeleteId(record.id)}
                  className="text-critical hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

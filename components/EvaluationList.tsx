import Link from "next/link";
import type { EvaluationRecord } from "@/lib/scoring/schema";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

export function EvaluationList({
  evaluations,
  showRank = false,
  emptyMessage,
}: {
  evaluations: EvaluationRecord[];
  showRank?: boolean;
  emptyMessage?: React.ReactNode;
}) {
  if (evaluations.length === 0) {
    return (
      <p className="text-sm text-ink-secondary">
        {emptyMessage ?? (
          <>
            No evaluations saved yet.{" "}
            <Link href="/evaluate" className="hover:underline">
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
        <Link
          key={record.id}
          href={`/history/${record.id}`}
          className="flex flex-wrap items-start justify-between gap-2 px-5 py-4 hover:bg-page"
        >
          <div className="flex items-start gap-3">
            {showRank && (
              <span className="w-6 shrink-0 pt-0.5 text-right text-sm tabular-nums text-ink-muted">
                {i + 1}
              </span>
            )}
            <div>
              <div className="font-medium text-ink-primary">{record.company}</div>
              <div className="text-xs text-ink-muted">
                {new Date(record.createdAt).toLocaleString()}
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                {record.presetName && (
                  <span className="rounded-full bg-page px-2 py-0.5 text-xs font-medium text-ink-secondary">
                    {record.presetName}
                  </span>
                )}
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
          </div>
          <div className="flex items-center gap-3 pt-0.5">
            <span className="text-sm tabular-nums text-ink-secondary">{pct(record.overallScore)}</span>
            <StatusChip score={record.overallScore} />
          </div>
        </Link>
      ))}
    </div>
  );
}

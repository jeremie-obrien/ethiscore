import Link from "next/link";
import type { EvaluationRecord } from "@/lib/scoring/schema";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

export function EvaluationList({ evaluations }: { evaluations: EvaluationRecord[] }) {
  if (evaluations.length === 0) {
    return (
      <p className="text-sm text-ink-secondary">
        No evaluations saved yet.{" "}
        <Link href="/" className="hover:underline">
          Run one from the home page
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="divide-y divide-gridline rounded-lg border border-border bg-surface">
      {evaluations.map((record) => (
        <Link
          key={record.id}
          href={`/history/${record.id}`}
          className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-page"
        >
          <div>
            <div className="font-medium text-ink-primary">{record.company}</div>
            <div className="text-xs text-ink-muted">
              {new Date(record.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums text-ink-secondary">{pct(record.overallScore)}</span>
            <StatusChip score={record.overallScore} />
          </div>
        </Link>
      ))}
    </div>
  );
}

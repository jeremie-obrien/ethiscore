import type { EvaluationRecord } from "@/lib/scoring/schema";
import { Meter } from "./Meter";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

export function ScoreReport({ record }: { record: EvaluationRecord }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="text-xl font-semibold text-ink-primary">{record.company}</h2>
        <span className="text-sm text-ink-muted">{record.model}</span>
      </div>

      <h3 className="mb-3 text-sm font-medium text-ink-secondary">Criteria breakdown</h3>
      <div className="mb-8 divide-y divide-gridline border-y border-gridline">
        {record.criteria.map((c) => (
          <div key={c.name} className="py-4 first:pt-0 last:pb-0">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink-primary">{c.name}</span>
                <StatusChip score={c.score} />
                <span className="text-xs text-ink-muted">
                  weight {(c.normalizedWeight * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-sm tabular-nums text-ink-secondary">{pct(c.score)}</span>
            </div>
            <Meter score={c.score} />
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{c.rationale}</p>
            {c.sources.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-muted">
                {c.sources.map((src) => (
                  <li key={src} className="max-w-full truncate">
                    <a href={src} target="_blank" rel="noreferrer" className="hover:underline">
                      {src}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-sm font-medium text-ink-secondary">Overall ethics score</div>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-semibold text-ink-primary">{pct(record.overallScore)}</span>
            <StatusChip score={record.overallScore} />
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-secondary">{record.overallSummary}</p>

      <div className="mt-6 text-xs text-ink-muted">
        Evaluated {new Date(record.createdAt).toLocaleString()} · id {record.id}
      </div>
    </div>
  );
}

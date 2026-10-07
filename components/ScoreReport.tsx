import Link from "next/link";
import type { EvaluationRecord } from "@/lib/scoring/schema";
import { Meter } from "./Meter";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

/** "https://www.example.com/report.pdf" → "example.com", for compact source links. */
function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function ScoreReport({ record }: { record: EvaluationRecord }) {
  return (
    <article className="card overflow-hidden">
      <header className="border-b border-gridline p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-xs text-ink-muted">
              {record.criteriaSetName} · {new Date(record.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </div>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{record.company}</h2>
          </div>
          <div className="text-right">
            <div className="text-5xl font-semibold tracking-tight tabular-nums">{pct(record.overallScore)}</div>
            <div className="mt-1.5 flex items-center justify-end gap-2 text-xs text-ink-muted">
              Overall <StatusChip score={record.overallScore} />
            </div>
          </div>
        </div>
        <div className="mt-6">
          <Meter score={record.overallScore} height={8} />
        </div>
        <p className="mt-5 leading-relaxed text-ink-secondary">{record.overallSummary}</p>
      </header>

      <div className="divide-y divide-gridline">
        {record.criteria.map((c) => (
          <section key={c.name} className="p-6 sm:px-8">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{c.name}</h3>
                <StatusChip score={c.score} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs text-ink-muted">weight {Math.round(c.normalizedWeight * 100)}%</span>
                <span className="w-11 text-right font-semibold tabular-nums">{pct(c.score)}</span>
              </div>
            </div>
            <Meter score={c.score} height={6} />
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">{c.rationale}</p>
            {c.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.sources.map((src) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noreferrer"
                    title={src}
                    className="inline-flex max-w-full items-center gap-1 truncate rounded-md border border-gridline px-2 py-0.5 text-xs text-ink-secondary transition hover:border-ink-muted hover:text-ink-primary"
                  >
                    <svg viewBox="0 0 12 12" className="h-3 w-3 shrink-0" aria-hidden="true">
                      <path d="M4.5 2.5h-2v7h7v-2M7 2.5h2.5V5M9.5 2.5 5.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {sourceLabel(src)}
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gridline bg-subtle/50 px-6 py-4 text-xs text-ink-muted sm:px-8">
        <span>
          Researched by {record.model} · {new Date(record.createdAt).toLocaleString()}
        </span>
        <Link href={`/evaluate?rerunFrom=${record.id}`} className="btn btn-secondary btn-sm">
          Re-run evaluation
        </Link>
      </footer>
    </article>
  );
}

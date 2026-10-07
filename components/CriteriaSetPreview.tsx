import type { CriteriaSet } from "@/lib/scoring/schema";

export function CriteriaSetPreview({ criteriaSet }: { criteriaSet: CriteriaSet }) {
  const totalWeight = criteriaSet.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="divide-y divide-gridline rounded-lg border border-gridline">
      {criteriaSet.criteria.map((c) => {
        const share = totalWeight > 0 ? c.weight / totalWeight : 0;
        return (
          <div key={c.name} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium">{c.name}</span>
              <span className="flex shrink-0 items-center gap-2 text-xs text-ink-muted">
                <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-track sm:block">
                  <span className="block h-full rounded-full bg-ink-muted" style={{ width: `${share * 100}%` }} />
                </span>
                <span className="w-8 text-right tabular-nums">{Math.round(share * 100)}%</span>
              </span>
            </div>
            {c.description && <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{c.description}</p>}
          </div>
        );
      })}
    </div>
  );
}

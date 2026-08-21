import type { CriteriaSet } from "@/lib/scoring/schema";

export function CriteriaSetPreview({ criteriaSet }: { criteriaSet: CriteriaSet }) {
  const totalWeight = criteriaSet.criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="flex flex-col gap-3">
      {criteriaSet.criteria.map((c) => (
        <div key={c.name} className="rounded-md border border-gridline p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink-primary">{c.name}</span>
            <span className="text-xs text-ink-muted">
              weight {totalWeight > 0 ? Math.round((c.weight / totalWeight) * 100) : 0}%
            </span>
          </div>
          {c.description && <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{c.description}</p>}
        </div>
      ))}
    </div>
  );
}

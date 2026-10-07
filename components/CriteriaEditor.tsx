"use client";

export interface CriterionForm {
  name: string;
  description: string;
  weight: string;
}

export const emptyCriterion: CriterionForm = { name: "", description: "", weight: "1" };

/** Rows with no name are treated as if they were deleted — not sent to the API. */
export function filledCriteria(list: CriterionForm[]): CriterionForm[] {
  return list.filter((c) => c.name.trim().length > 0);
}

export function CriteriaEditor({
  criteria,
  onChange,
}: {
  criteria: CriterionForm[];
  onChange: (next: CriterionForm[]) => void;
}) {
  function updateCriterion(index: number, field: keyof CriterionForm, value: string) {
    onChange(criteria.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function addCriterion() {
    onChange([...criteria, { ...emptyCriterion }]);
  }

  function removeCriterion(index: number) {
    if (criteria.length <= 1) return;
    onChange(criteria.filter((_, i) => i !== index));
  }

  const totalWeight = filledCriteria(criteria).reduce((sum, c) => sum + (Number(c.weight) > 0 ? Number(c.weight) : 0), 0);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium">Criteria</span>
        <span className="text-xs text-ink-muted">Weights are relative: they don&rsquo;t need to add up to anything</span>
      </div>
      <div className="flex flex-col gap-3">
        {criteria.map((c, i) => {
          const weight = Number(c.weight);
          const share = totalWeight > 0 && c.name.trim() && weight > 0 ? Math.round((weight / totalWeight) * 100) : null;
          return (
            <div key={i} className="rounded-lg border border-gridline bg-subtle/40 p-4">
              <div className="flex items-start gap-3">
                <span className="mt-2.5 w-5 shrink-0 text-xs font-medium tabular-nums text-ink-muted">{i + 1}.</span>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => updateCriterion(i, "name", e.target.value)}
                      placeholder="Name, e.g. Labor practices"
                      aria-label={`Criterion ${i + 1} name`}
                      className="input font-medium"
                    />
                    <div className="relative w-28 shrink-0">
                      <input
                        type="number"
                        required
                        min="0"
                        step="any"
                        value={c.weight}
                        onChange={(e) => updateCriterion(i, "weight", e.target.value)}
                        aria-label={`Criterion ${i + 1} weight`}
                        className="input pr-14"
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-ink-muted">
                        {share === null ? "weight" : `${share}%`}
                      </span>
                    </div>
                  </div>
                  <textarea
                    value={c.description}
                    onChange={(e) => updateCriterion(i, "description", e.target.value)}
                    placeholder="Description (optional): what should score well or poorly here"
                    aria-label={`Criterion ${i + 1} description`}
                    rows={2}
                    className="input resize-y"
                  />
                </div>
                {criteria.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(i)}
                    aria-label={`Remove criterion ${i + 1}`}
                    title="Remove"
                    className="btn btn-ghost btn-sm mt-1 h-8 w-8 px-0 hover:text-critical"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addCriterion}
        className="mt-3 w-full rounded-lg border border-dashed border-gridline px-4 py-2.5 text-sm font-medium text-ink-secondary transition hover:border-ink-muted hover:text-ink-primary"
      >
        + Add criterion
      </button>
    </div>
  );
}

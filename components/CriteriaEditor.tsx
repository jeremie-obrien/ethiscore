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

  return (
    <div>
      <div className="flex flex-col gap-6">
        {criteria.map((c, i) => (
          <fieldset key={i} className="rounded-md border border-gridline p-4">
            <legend className="flex items-center gap-2 px-1 text-sm font-medium text-ink-secondary">
              Criterion {i + 1}
              {criteria.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCriterion(i)}
                  className="text-xs font-normal text-critical hover:underline"
                >
                  Remove
                </button>
              )}
            </legend>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateCriterion(i, "name", e.target.value)}
                placeholder="Name (e.g. Environment)"
                className="w-full rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
              />
              <textarea
                value={c.description}
                onChange={(e) => updateCriterion(i, "description", e.target.value)}
                placeholder="Description (optional) — what should score well vs. poorly here"
                rows={2}
                className="w-full resize-y rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-ink-muted">Weight</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={c.weight}
                  onChange={(e) => updateCriterion(i, "weight", e.target.value)}
                  className="w-24 rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
                />
                <span className="text-xs text-ink-muted">relative importance — doesn't need to sum to anything</span>
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      <button
        type="button"
        onClick={addCriterion}
        className="mt-4 w-full rounded-md border border-dashed border-gridline px-4 py-2 text-sm font-medium text-ink-secondary hover:border-ink-muted"
      >
        + Add criterion
      </button>
    </div>
  );
}

import { listCriteriaSets } from "@/lib/storage/criteriaSets";
import { listEvaluations } from "@/lib/storage/store";
import { CriteriaSetManager } from "@/components/CriteriaSetManager";

export default async function CriteriaPage() {
  const [criteriaSets, entries] = await Promise.all([listCriteriaSets(), listEvaluations()]);

  const usageCounts = new Map<string, number>();
  for (const { record } of entries) {
    usageCounts.set(record.criteriaSetId, (usageCounts.get(record.criteriaSetId) ?? 0) + 1);
  }

  const sorted = [...criteriaSets].sort((a, b) => {
    const countDiff = (usageCounts.get(b.id) ?? 0) - (usageCounts.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold text-ink-primary">Criteria management</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        View, edit, and delete your criteria sets, and choose the one that pre-selects by default
        when starting a new evaluation. Every evaluation is run against one of these sets — edit
        one here to change how future evaluations under it are scored.
      </p>
      <CriteriaSetManager initialCriteriaSets={sorted} />
    </main>
  );
}

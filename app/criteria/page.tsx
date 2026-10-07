import { listCriteriaSets } from "@/lib/storage/criteriaSets";
import { listEvaluations } from "@/lib/storage/store";
import { CriteriaSetManager } from "@/components/CriteriaSetManager";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Criteria sets" };

export default async function CriteriaPage() {
  const supabase = await createClient();
  const [criteriaSets, evaluations] = await Promise.all([listCriteriaSets(supabase), listEvaluations(supabase)]);

  const usageCounts = new Map<string, number>();
  for (const record of evaluations) {
    usageCounts.set(record.criteriaSetId, (usageCounts.get(record.criteriaSetId) ?? 0) + 1);
  }

  const sorted = [...criteriaSets].sort((a, b) => {
    const countDiff = (usageCounts.get(b.id) ?? 0) - (usageCounts.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="Criteria sets"
        description="What companies are scored against. Built-in sets are shared and read-only: make a copy to customize one. Your own sets are private to you."
      />
      <CriteriaSetManager initialCriteriaSets={sorted} />
    </main>
  );
}

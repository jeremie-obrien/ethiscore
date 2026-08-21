import Link from "next/link";
import { listEvaluations, sortEvaluationRecords, type EvaluationSort } from "@/lib/storage/store";
import { listCriteriaSets } from "@/lib/storage/criteriaSets";
import { EvaluationList } from "@/components/EvaluationList";
import { SortSelect } from "@/components/SortSelect";
import { CriteriaSetFilterSelect } from "@/components/CriteriaSetFilterSelect";

function isValidSort(value: string | undefined): value is EvaluationSort {
  return value === "date" || value === "score";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; criteriaSet?: string }>;
}) {
  const { sort: rawSort, criteriaSet: criteriaSetId } = await searchParams;
  const sort: EvaluationSort = isValidSort(rawSort) ? rawSort : "score";

  const [entries, criteriaSets] = await Promise.all([listEvaluations(), listCriteriaSets()]);
  const allEvaluations = entries.map((e) => e.record);
  const filtered = criteriaSetId
    ? allEvaluations.filter((r) => r.criteriaSetId === criteriaSetId)
    : allEvaluations;
  const evaluations = sortEvaluationRecords(filtered, sort);

  const activeCriteriaSetName = criteriaSetId
    ? criteriaSets.find((s) => s.id === criteriaSetId)?.name
    : undefined;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-ink-primary">Past evaluations</h1>
        <Link href="/evaluate?reset=1" className="text-sm text-ink-secondary hover:underline">
          New evaluation
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-ink-secondary">Rank by</span>
          <SortSelect value={sort} />
        </div>
        {criteriaSets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-ink-secondary">Criteria set</span>
            <CriteriaSetFilterSelect value={criteriaSetId ?? ""} criteriaSets={criteriaSets} />
          </div>
        )}
      </div>
      <EvaluationList
        key={`${sort}-${criteriaSetId ?? "all"}`}
        evaluations={evaluations}
        showRank={sort === "score"}
        emptyMessage={
          criteriaSetId ? (
            <>No evaluations match the &ldquo;{activeCriteriaSetName ?? "selected"}&rdquo; criteria set.</>
          ) : undefined
        }
      />
    </main>
  );
}

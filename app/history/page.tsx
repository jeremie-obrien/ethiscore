import Link from "next/link";
import { listEvaluations, sortEvaluationRecords, type EvaluationSort } from "@/lib/storage/store";
import { listCriteriaSets } from "@/lib/storage/criteriaSets";
import { EvaluationList } from "@/components/EvaluationList";
import { SortSelect } from "@/components/SortSelect";
import { CriteriaSetFilterSelect } from "@/components/CriteriaSetFilterSelect";
import { PageHeader } from "@/components/PageHeader";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Evaluations" };

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

  const supabase = await createClient();
  const [allEvaluations, criteriaSets] = await Promise.all([
    listEvaluations(supabase),
    listCriteriaSets(supabase),
  ]);
  const filtered = criteriaSetId
    ? allEvaluations.filter((r) => r.criteriaSetId === criteriaSetId)
    : allEvaluations;
  const evaluations = sortEvaluationRecords(filtered, sort);

  const activeCriteriaSetName = criteriaSetId
    ? criteriaSets.find((s) => s.id === criteriaSetId)?.name
    : undefined;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="Evaluations"
        description="Everything you've evaluated. Rank by score to compare companies scored against the same criteria."
        actions={
          <Link href="/evaluate?reset=1" className="btn btn-primary">
            New evaluation
          </Link>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-ink-secondary">Sort</span>
          <SortSelect value={sort} />
        </label>
        {criteriaSets.length > 0 && (
          <label className="flex items-center gap-2">
            <span className="text-ink-secondary">Criteria set</span>
            <CriteriaSetFilterSelect value={criteriaSetId ?? ""} criteriaSets={criteriaSets} />
          </label>
        )}
        <span className="ml-auto text-xs text-ink-muted">
          {evaluations.length} evaluation{evaluations.length === 1 ? "" : "s"}
        </span>
      </div>
      {sort === "score" && !criteriaSetId && new Set(allEvaluations.map((r) => r.criteriaSetId)).size > 1 && (
        <p className="mb-4 rounded-lg border border-border bg-surface px-4 py-2.5 text-xs text-ink-secondary">
          These evaluations use different criteria sets, so their scores aren&rsquo;t directly comparable. Pick a
          criteria set above for a like-for-like ranking.
        </p>
      )}
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

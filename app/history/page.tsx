import Link from "next/link";
import { listEvaluations, sortEvaluationRecords, type EvaluationSort } from "@/lib/storage/store";
import { EvaluationList } from "@/components/EvaluationList";
import { SortSelect } from "@/components/SortSelect";

function isValidSort(value: string | undefined): value is EvaluationSort {
  return value === "date" || value === "score";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const { sort: rawSort } = await searchParams;
  const sort: EvaluationSort = isValidSort(rawSort) ? rawSort : "score";

  const entries = await listEvaluations();
  const evaluations = sortEvaluationRecords(
    entries.map((e) => e.record),
    sort
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-ink-primary">History</h1>
        <Link href="/" className="text-sm text-ink-secondary hover:underline">
          New evaluation
        </Link>
      </div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <span className="text-ink-secondary">Rank by</span>
        <SortSelect value={sort} />
      </div>
      <EvaluationList evaluations={evaluations} showRank={sort === "score"} />
    </main>
  );
}

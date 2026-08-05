import Link from "next/link";
import { listEvaluations, sortEvaluationRecords, type EvaluationSort } from "@/lib/storage/store";
import { listPresets } from "@/lib/storage/presets";
import { EvaluationList } from "@/components/EvaluationList";
import { SortSelect } from "@/components/SortSelect";
import { PresetFilterSelect } from "@/components/PresetFilterSelect";

function isValidSort(value: string | undefined): value is EvaluationSort {
  return value === "date" || value === "score";
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; preset?: string }>;
}) {
  const { sort: rawSort, preset: presetId } = await searchParams;
  const sort: EvaluationSort = isValidSort(rawSort) ? rawSort : "score";

  const [entries, presets] = await Promise.all([listEvaluations(), listPresets()]);
  const allEvaluations = entries.map((e) => e.record);
  const filtered = presetId
    ? allEvaluations.filter((r) => r.presetId === presetId)
    : allEvaluations;
  const evaluations = sortEvaluationRecords(filtered, sort);

  const activePresetName = presetId ? presets.find((p) => p.id === presetId)?.name : undefined;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-ink-primary">History</h1>
        <Link href="/" className="text-sm text-ink-secondary hover:underline">
          New evaluation
        </Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-ink-secondary">Rank by</span>
          <SortSelect value={sort} />
        </div>
        {presets.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-ink-secondary">Preset</span>
            <PresetFilterSelect value={presetId ?? ""} presets={presets} />
          </div>
        )}
      </div>
      <EvaluationList
        evaluations={evaluations}
        showRank={sort === "score"}
        emptyMessage={
          presetId ? (
            <>No evaluations match the &ldquo;{activePresetName ?? "selected"}&rdquo; preset.</>
          ) : undefined
        }
      />
    </main>
  );
}

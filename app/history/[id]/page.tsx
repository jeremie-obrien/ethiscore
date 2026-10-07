import Link from "next/link";
import { notFound } from "next/navigation";
import { findEvaluation } from "@/lib/storage/store";
import { DeleteEvaluationButton } from "@/components/DeleteEvaluationButton";
import { ScoreReport } from "@/components/ScoreReport";
import { createClient } from "@/lib/supabase/server";

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const record = await findEvaluation(await createClient(), id);
  if (!record) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link href="/history" className="text-sm text-ink-secondary hover:text-ink-primary">
          ← All evaluations
        </Link>
        <DeleteEvaluationButton id={record.id} />
      </div>
      <ScoreReport record={record} />
    </main>
  );
}

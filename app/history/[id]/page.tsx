import Link from "next/link";
import { notFound } from "next/navigation";
import { findEvaluation } from "@/lib/storage/store";
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
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-8">
        <Link href="/history" className="text-sm text-ink-secondary hover:underline">
          ← Back to history
        </Link>
      </div>
      <ScoreReport record={record} />
    </main>
  );
}

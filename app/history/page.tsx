import Link from "next/link";
import { listEvaluations } from "@/lib/storage/store";
import { EvaluationList } from "@/components/EvaluationList";

export default async function HistoryPage() {
  const entries = await listEvaluations();
  const evaluations = entries
    .map((e) => e.record)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-ink-primary">History</h1>
        <Link href="/" className="text-sm text-ink-secondary hover:underline">
          New evaluation
        </Link>
      </div>
      <EvaluationList evaluations={evaluations} />
    </main>
  );
}

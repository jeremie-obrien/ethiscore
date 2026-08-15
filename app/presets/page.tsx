import { listPresets } from "@/lib/storage/presets";
import { listEvaluations } from "@/lib/storage/store";
import { PresetManager } from "@/components/PresetManager";

export default async function PresetsPage() {
  const [presets, entries] = await Promise.all([listPresets(), listEvaluations()]);

  const usageCounts = new Map<string, number>();
  for (const { record } of entries) {
    if (!record.presetId) continue;
    usageCounts.set(record.presetId, (usageCounts.get(record.presetId) ?? 0) + 1);
  }

  const sorted = [...presets].sort((a, b) => {
    const countDiff = (usageCounts.get(b.id) ?? 0) - (usageCounts.get(a.id) ?? 0);
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name);
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold text-ink-primary">Criteria management</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        View, edit, and delete your saved criteria presets, and choose the one that pre-loads by
        default when starting a new evaluation.
      </p>
      <PresetManager initialPresets={sorted} />
    </main>
  );
}

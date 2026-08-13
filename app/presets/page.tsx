import { listPresets } from "@/lib/storage/presets";
import { PresetManager } from "@/components/PresetManager";

export default async function PresetsPage() {
  const presets = await listPresets();
  const sorted = [...presets].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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

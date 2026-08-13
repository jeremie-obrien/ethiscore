import { getApiKey } from "@/lib/config";
import { listPresets } from "@/lib/storage/presets";
import { EvaluateClient } from "@/components/EvaluateClient";
import type { CriterionForm } from "@/components/CriteriaEditor";

export default async function EvaluatePage() {
  const [apiKey, presets] = await Promise.all([getApiKey(), listPresets()]);
  const defaultPreset = presets.find((p) => p.isDefault);

  const initialCriteria: CriterionForm[] | undefined = defaultPreset?.criteria.map((c) => ({
    name: c.name,
    description: c.description ?? "",
    weight: String(c.weight),
  }));
  const initialActivePreset = defaultPreset ? { id: defaultPreset.id, name: defaultPreset.name } : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-semibold text-ink-primary">New evaluation</h1>
      <EvaluateClient
        initialHasApiKey={Boolean(apiKey)}
        initialCriteria={initialCriteria}
        initialActivePreset={initialActivePreset}
      />
    </main>
  );
}

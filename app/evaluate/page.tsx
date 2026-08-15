import { getApiKey } from "@/lib/config";
import { findPreset, listPresets } from "@/lib/storage/presets";
import { findEvaluation } from "@/lib/storage/store";
import { EvaluateClient } from "@/components/EvaluateClient";
import type { CriterionForm } from "@/components/CriteriaEditor";

export default async function EvaluatePage({
  searchParams,
}: {
  searchParams: Promise<{ rerunFrom?: string; preset?: string; reset?: string }>;
}) {
  const { rerunFrom, preset: presetIdParam, reset } = await searchParams;
  const [apiKey, presets, rerunEntry, explicitPreset] = await Promise.all([
    getApiKey(),
    listPresets(),
    rerunFrom ? findEvaluation(rerunFrom) : Promise.resolve(undefined),
    presetIdParam ? findPreset(presetIdParam) : Promise.resolve(undefined),
  ]);
  const defaultPreset = presets.find((p) => p.isDefault);
  const chosenPreset = explicitPreset ?? defaultPreset;

  const initialCriteria: CriterionForm[] | undefined = chosenPreset?.criteria.map((c) => ({
    name: c.name,
    description: c.description ?? "",
    weight: String(c.weight),
  }));
  const initialActivePreset = chosenPreset ? { id: chosenPreset.id, name: chosenPreset.name } : null;

  // An explicit context (re-running a past evaluation, picking a specific
  // preset, or an explicit "start fresh" link) always wins over a stale
  // in-progress draft from browsing away and back.
  const skipDraft = Boolean(rerunEntry) || Boolean(explicitPreset) || reset !== undefined;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-semibold text-ink-primary">New evaluation</h1>
      <EvaluateClient
        initialHasApiKey={Boolean(apiKey)}
        initialCriteria={initialCriteria}
        initialActivePreset={initialActivePreset}
        initialCompany={rerunEntry?.record.company}
        rerunFrom={rerunEntry ? { id: rerunEntry.record.id, company: rerunEntry.record.company } : undefined}
        skipDraft={skipDraft}
      />
    </main>
  );
}

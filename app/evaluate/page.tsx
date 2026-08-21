import { getApiKey } from "@/lib/config";
import { findCriteriaSet, listCriteriaSets } from "@/lib/storage/criteriaSets";
import { findEvaluation } from "@/lib/storage/store";
import { EvaluateClient } from "@/components/EvaluateClient";

export default async function EvaluatePage({
  searchParams,
}: {
  searchParams: Promise<{ rerunFrom?: string; criteriaSet?: string; reset?: string }>;
}) {
  const { rerunFrom, criteriaSet: criteriaSetIdParam, reset } = await searchParams;
  const [apiKey, criteriaSets, rerunEntry, explicitCriteriaSet] = await Promise.all([
    getApiKey(),
    listCriteriaSets(),
    rerunFrom ? findEvaluation(rerunFrom) : Promise.resolve(undefined),
    criteriaSetIdParam ? findCriteriaSet(criteriaSetIdParam) : Promise.resolve(undefined),
  ]);
  const defaultCriteriaSet = criteriaSets.find((s) => s.isDefault);
  const rerunCriteriaSet = rerunEntry
    ? criteriaSets.find((s) => s.id === rerunEntry.record.criteriaSetId)
    : undefined;
  const chosenCriteriaSet = explicitCriteriaSet ?? rerunCriteriaSet ?? defaultCriteriaSet;

  const initialCompanies = rerunEntry ? [rerunEntry.record.company] : undefined;
  const initialCriteriaSetId = chosenCriteriaSet?.id ?? null;

  // An explicit context (re-running a past evaluation, picking a specific
  // criteria set, or an explicit "start fresh" link) always wins over a stale
  // in-progress draft from browsing away and back.
  const skipDraft = Boolean(rerunEntry) || Boolean(explicitCriteriaSet) || reset !== undefined;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="mb-8 text-2xl font-semibold text-ink-primary">New evaluation</h1>
      <EvaluateClient
        initialHasApiKey={Boolean(apiKey)}
        initialCompanies={initialCompanies}
        initialCriteriaSetId={initialCriteriaSetId}
        rerunFrom={rerunEntry ? { id: rerunEntry.record.id, company: rerunEntry.record.company } : undefined}
        skipDraft={skipDraft}
      />
    </main>
  );
}

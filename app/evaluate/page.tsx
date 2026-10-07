import { findCriteriaSet, listCriteriaSets } from "@/lib/storage/criteriaSets";
import { findEvaluation } from "@/lib/storage/store";
import { createClient } from "@/lib/supabase/server";
import { EvaluateClient } from "@/components/EvaluateClient";
import { PageHeader } from "@/components/PageHeader";

export const metadata = { title: "New evaluation" };

export default async function EvaluatePage({
  searchParams,
}: {
  searchParams: Promise<{ rerunFrom?: string; criteriaSet?: string; reset?: string }>;
}) {
  const { rerunFrom, criteriaSet: criteriaSetIdParam, reset } = await searchParams;
  const supabase = await createClient();
  const [criteriaSets, rerunEntry, explicitCriteriaSet] = await Promise.all([
    listCriteriaSets(supabase),
    rerunFrom ? findEvaluation(supabase, rerunFrom) : Promise.resolve(undefined),
    criteriaSetIdParam ? findCriteriaSet(supabase, criteriaSetIdParam) : Promise.resolve(undefined),
  ]);
  const defaultCriteriaSet = criteriaSets.find((s) => s.isDefault);
  const rerunCriteriaSet = rerunEntry
    ? criteriaSets.find((s) => s.id === rerunEntry.criteriaSetId)
    : undefined;
  const chosenCriteriaSet = explicitCriteriaSet ?? rerunCriteriaSet ?? defaultCriteriaSet;

  const initialCompanies = rerunEntry ? [rerunEntry.company] : undefined;
  const initialCriteriaSetId = chosenCriteriaSet?.id ?? null;

  // An explicit context (re-running a past evaluation, picking a specific
  // criteria set, or an explicit "start fresh" link) always wins over a stale
  // in-progress draft from browsing away and back.
  const skipDraft = Boolean(rerunEntry) || Boolean(explicitCriteriaSet) || reset !== undefined;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title={rerunEntry ? `Re-run ${rerunEntry.company}` : "New evaluation"}
        description="Claude researches each company live on the web and scores it against your chosen criteria, with sources."
      />
      <EvaluateClient
        criteriaSets={criteriaSets}
        initialCompanies={initialCompanies}
        initialCriteriaSetId={initialCriteriaSetId}
        rerunFrom={rerunEntry ? { id: rerunEntry.id, company: rerunEntry.company } : undefined}
        skipDraft={skipDraft}
      />
    </main>
  );
}

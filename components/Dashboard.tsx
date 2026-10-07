import Link from "next/link";
import type { CriteriaSet, EvaluationRecord } from "@/lib/scoring/schema";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ActionCard({
  href,
  title,
  description,
  stat,
  primary,
}: {
  href: string;
  title: string;
  description: string;
  stat?: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex flex-col justify-between rounded-xl border p-5 shadow-xs transition ${
        primary
          ? "border-transparent bg-ink-primary text-page hover:opacity-90"
          : "border-border bg-surface hover:border-ink-muted"
      }`}
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{title}</h2>
          <span className={`transition group-hover:translate-x-0.5 ${primary ? "" : "text-ink-muted"}`}>
            <ArrowIcon />
          </span>
        </div>
        <p className={`mt-1 text-sm ${primary ? "opacity-75" : "text-ink-secondary"}`}>{description}</p>
      </div>
      {stat && <div className={`mt-4 text-xs ${primary ? "opacity-60" : "text-ink-muted"}`}>{stat}</div>}
    </Link>
  );
}

function GettingStarted() {
  const steps = [
    {
      title: "Get an Anthropic API key",
      body: (
        <>
          Create one in a workspace at{" "}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="link">
            console.anthropic.com
          </a>
          . Evaluations run on your own account.
        </>
      ),
    },
    {
      title: "Pick your criteria",
      body: (
        <>
          Use a built-in set like ESG, or{" "}
          <Link href="/criteria" className="link">
            create your own
          </Link>{" "}
          with the weights you care about.
        </>
      ),
    },
    {
      title: "Run your first evaluation",
      body: <>Enter one or more company names. Each takes a minute or so while Claude researches it.</>,
    },
  ];
  return (
    <div className="card p-6">
      <h2 className="font-semibold">Getting started</h2>
      <ol className="mt-4 flex flex-col gap-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-medium">{s.title}</div>
              <p className="mt-0.5 text-sm text-ink-secondary">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <Link href="/evaluate?reset=1" className="btn btn-primary mt-6">
        Start an evaluation
      </Link>
    </div>
  );
}

export function Dashboard({
  email,
  evaluations,
  criteriaSets,
}: {
  email: string | undefined;
  /** Newest first. */
  evaluations: EvaluationRecord[];
  criteriaSets: CriteriaSet[];
}) {
  const recent = evaluations.slice(0, 5);
  const ownSets = criteriaSets.filter((s) => !s.builtIn).length;
  const defaultSet = criteriaSets.find((s) => s.isDefault);
  const companies = new Set(evaluations.map((e) => e.company.trim().toLowerCase())).size;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {evaluations.length === 0 ? "Welcome to EthiScore" : "Welcome back"}
        </h1>
        {email && <p className="mt-1 text-sm text-ink-secondary">Signed in as {email}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <ActionCard
          primary
          href="/evaluate?reset=1"
          title="New evaluation"
          description="Score one or more companies against a criteria set."
          stat={defaultSet ? `Default set: ${defaultSet.name}` : undefined}
        />
        <ActionCard
          href="/history"
          title="Evaluations"
          description="Browse, rank and re-run your past evaluations."
          stat={
            evaluations.length === 0
              ? "None yet"
              : `${evaluations.length} evaluation${evaluations.length === 1 ? "" : "s"} · ${companies} compan${companies === 1 ? "y" : "ies"}`
          }
        />
        <ActionCard
          href="/criteria"
          title="Criteria sets"
          description="Create and tune the criteria companies are scored on."
          stat={`${ownSets} of your own · ${criteriaSets.length - ownSets} built-in`}
        />
      </div>

      <section className="mt-10">
        {recent.length === 0 ? (
          <GettingStarted />
        ) : (
          <>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-semibold">Recent evaluations</h2>
              <Link href="/history?sort=date" className="text-sm text-ink-secondary hover:text-ink-primary">
                View all
              </Link>
            </div>
            <div className="card divide-y divide-gridline">
              {recent.map((r) => (
                <Link
                  key={r.id}
                  href={`/history/${r.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition first:rounded-t-xl last:rounded-b-xl hover:bg-subtle"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{r.company}</div>
                    <div className="truncate text-xs text-ink-muted">
                      {r.criteriaSetName} · {timeAgo(r.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-medium tabular-nums">{pct(r.overallScore)}</span>
                    <StatusChip score={r.overallScore} />
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

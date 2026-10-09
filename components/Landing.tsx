import Link from "next/link";
import { Meter } from "./Meter";
import { StatusChip } from "./StatusChip";
import { pct } from "./scoreStatus";

// A fictional company on purpose: invented scores for a real one would be a factual claim.
const SAMPLE = {
  company: "Northwind Outdoor Co.",
  criteriaSet: "ESG",
  overall: 0.71,
  criteria: [
    { name: "Environmental practices", score: 0.82, note: "Science-based emissions targets; B Corp certified since 2021." },
    { name: "Social responsibility", score: 0.74, note: "Fair Trade supply chain; one open labor dispute (2025)." },
    { name: "Governance quality", score: 0.58, note: "Founder holds majority voting control; independent audit committee." },
  ],
};

function SampleReport() {
  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-ink-muted">Example report · {SAMPLE.criteriaSet}</div>
          <div className="mt-0.5 text-lg font-semibold tracking-tight">{SAMPLE.company}</div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tracking-tight tabular-nums">{pct(SAMPLE.overall)}</div>
          <StatusChip score={SAMPLE.overall} />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {SAMPLE.criteria.map((c) => (
          <div key={c.name}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{c.name}</span>
              <span className="tabular-nums text-ink-secondary">{pct(c.score)}</span>
            </div>
            <Meter score={c.score} height={6} />
            <p className="mt-1.5 text-xs text-ink-muted">{c.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-gridline pt-4 text-xs text-ink-muted">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        12 sources cited · researched live by Claude
      </div>
    </div>
  );
}

const STEPS = [
  {
    title: "Choose what matters",
    body: "Start from a built-in set (ESG, Environment, Innovation) or write your own criteria and weights.",
  },
  {
    title: "Claude does the research",
    body: "It searches the web for each company's actual conduct, policies and controversies: evidence, not reputation.",
  },
  {
    title: "Get a scored report",
    body: "A score per criterion with the reasoning and sources behind it, plus an overall score you can rank and compare.",
  },
];

const FEATURES = [
  {
    title: "Weak spots count",
    body: "The overall score is a weighted geometric mean, so a company can't hide a serious failing behind strengths elsewhere.",
  },
  {
    title: "Private by default",
    body: "Your criteria and evaluations are visible only to you, enforced by the database itself.",
  },
  {
    title: "Free to start",
    body: "Get 3 free evaluations every month. Need more? Use your own Anthropic API key: it stays in your browser, never on our servers.",
  },
  {
    title: "Compare and re-run",
    body: "Rank companies scored against the same criteria, and re-run them when things change.",
  },
];

export function Landing() {
  return (
    <main>
      <section className="mx-auto grid max-w-5xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <div className="eyebrow mb-4">Company ethics, researched for you</div>
          <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
            How ethical is that company, really?
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-secondary text-pretty">
            EthiScore researches any company live on the web and scores it against the criteria you care
            about, showing the evidence and sources behind every score.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="btn btn-primary btn-lg">
              Get started, it&rsquo;s free
            </Link>
            <a href="#how-it-works" className="btn btn-secondary btn-lg">
              How it works
            </a>
          </div>
          <p className="mt-4 text-sm text-ink-muted">
            Sign in with just your email. 3 free evaluations every month, no card needed.
          </p>
        </div>
        <SampleReport />
      </section>

      <section id="how-it-works" className="scroll-mt-20 border-y border-gridline bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="eyebrow mb-3">How it works</div>
          <h2 className="mb-10 text-2xl font-semibold tracking-tight sm:text-3xl">From a company name to a scored report</h2>
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title}>
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {i + 1}
                </div>
                <h3 className="mb-1.5 font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-secondary">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <h3 className="mb-1.5 font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-ink-secondary">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Score your first company in a few minutes</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              All you need is an email address: your first 3 evaluations each month are free.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary btn-lg">
            Get started
          </Link>
        </div>
      </section>
    </main>
  );
}

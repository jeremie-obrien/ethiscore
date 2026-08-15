import Link from "next/link";

const DESTINATIONS = [
  {
    href: "/evaluate",
    title: "New evaluation",
    description: "Score a company against a set of weighted criteria.",
  },
  {
    href: "/history",
    title: "Past evaluations",
    description: "Browse, rank, and filter evaluations you've already run.",
  },
  {
    href: "/presets",
    title: "Criteria management",
    description: "Create, edit and delete criteria presets.",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold text-ink-primary">EthiScore</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        Score a company against custom weighted criteria using Claude.
      </p>
      <div className="flex flex-col gap-4">
        {DESTINATIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="rounded-lg border border-border bg-surface p-6 hover:border-ink-muted"
          >
            <div className="text-lg font-medium text-ink-primary">{d.title}</div>
            <p className="mt-1 text-sm text-ink-secondary">{d.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

const DESTINATIONS = [
  {
    href: "/evaluate",
    title: "New evaluation",
    description: "Score one or more companies against a criteria set.",
  },
  {
    href: "/history",
    title: "Past evaluations",
    description: "Browse, rank, and filter evaluations you've already run.",
  },
  {
    href: "/criteria",
    title: "Criteria management",
    description: "Create, edit and delete criteria sets.",
  },
];

export default async function HomePage() {
  const user = await getCurrentUser(await createClient());

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
        <h1 className="mb-2 text-2xl font-semibold text-ink-primary">EthiScore</h1>
        <p className="mb-6 text-sm text-ink-secondary">
          Score companies against weighted ethics criteria using Claude. Claude researches each company
          live on the web and returns a per-criterion breakdown with rationale and sources.
        </p>
        <ul className="mb-8 list-disc space-y-1 pl-5 text-sm text-ink-secondary">
          <li>Start from built-in criteria sets (ESG, Environment, Innovation) or create your own.</li>
          <li>Your criteria sets and evaluations are private to your account.</li>
          <li>
            Bring your own Anthropic API key: it stays in your browser and is never stored on our
            servers.
          </li>
        </ul>
        <Link
          href="/login"
          className="inline-block rounded-md bg-good px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Sign in to get started
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold text-ink-primary">EthiScore</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        Score companies against weighted ethics criteria using Claude.
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

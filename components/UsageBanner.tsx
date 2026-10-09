"use client";

import Link from "next/link";
import { maskApiKey } from "./apiKeyStore";
import type { EvaluationAccess } from "./useEvaluationAccess";

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const GIFT = "M2.5 6.5h11v2h-11zM3.5 8.5v5h9v-5M8 6.5v7M8 6.5S6.8 3 5.2 3.4C3.8 3.8 4.6 6.5 8 6.5zm0 0s1.2-3.5 2.8-3.1c1.4.4.6 3.1-2.8 3.1z";
const KEY = "M7.7 8.3L13 3m-2 2l1.5 1.5M9.5 6.5L11 8M8.5 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0z";
const ALERT = "M8 2.5l6 10.5H2zM8 7v2.5M8 11.3v.2";

/** One line saying how evaluations will be paid for, with a way to add a key when needed. */
export function UsageBanner({ access }: { access: EvaluationAccess }) {
  const { apiKey, free } = access;
  if (apiKey === undefined || free === null) {
    return <div className="h-[46px] animate-pulse rounded-lg bg-subtle" aria-hidden="true" />;
  }

  if (apiKey) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 text-ink-secondary">
          <span className="text-accent">
            <Icon path={KEY} />
          </span>
          Using your own Anthropic key <code className="text-xs text-ink-primary">{maskApiKey(apiKey)}</code>
        </span>
        <Link href="/profile" className="btn btn-ghost btn-sm">
          Manage
        </Link>
      </div>
    );
  }

  if (free.available && free.remaining > 0) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-accent/25 bg-accent-soft/50 px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 text-ink-secondary">
          <span className="text-accent">
            <Icon path={GIFT} />
          </span>
          <span>
            You have{" "}
            <strong className="font-semibold text-ink-primary">
              {free.remaining} of {free.limit} free evaluations
            </strong>{" "}
            left this month.
          </span>
        </span>
        <Link href="/profile" className="text-sm text-ink-secondary hover:text-ink-primary">
          Want more? Add your own API key
        </Link>
      </div>
    );
  }

  const message = free.available
    ? "You've used this month's free evaluations. Enter your own API key to do more evaluations this month."
    : free.message || "Enter your own API key to run evaluations.";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
      <span className="flex items-start gap-2 text-ink-primary">
        <span className="mt-0.5 text-warning-ink">
          <Icon path={ALERT} />
        </span>
        {message}
      </span>
      <Link href="/profile" className="btn btn-primary btn-sm">
        Add your API key
      </Link>
    </div>
  );
}

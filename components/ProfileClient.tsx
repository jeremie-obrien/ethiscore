"use client";

import { ApiKeyForm } from "./ApiKeyForm";
import { maskApiKey } from "./apiKeyStore";
import { useEvaluationAccess } from "./useEvaluationAccess";

function firstOfNextMonth(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });
}

export function ProfileClient() {
  const access = useEvaluationAccess();
  const { apiKey, free } = access;

  return (
    <div className="flex flex-col gap-6">
      <section className="card p-6 sm:p-8">
        <h2 className="text-lg font-semibold tracking-tight">Free evaluations</h2>
        {free === null ? (
          <div className="mt-3 h-5 w-48 animate-pulse rounded bg-subtle" />
        ) : free.available ? (
          <>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-semibold tabular-nums">{free.remaining}</span>
              <span className="text-sm text-ink-secondary">of {free.limit} left this month</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-track">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(free.remaining / free.limit) * 100}%` }} />
            </div>
            <p className="mt-3 text-sm text-ink-secondary">
              Renews on {firstOfNextMonth()}.{" "}
              {apiKey ? "While your own key is set, evaluations use it instead." : "For more, add your own API key below."}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink-secondary">{free.message || "Free evaluations aren't available right now."}</p>
        )}
      </section>

      {apiKey === undefined ? null : apiKey ? (
        <section className="card p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Your Anthropic API key</h2>
          <p className="mt-2 text-sm text-ink-secondary">
            Evaluations run on your own Anthropic account, without limits, while this key is set. It&rsquo;s stored only in
            this browser.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <code className="text-sm">{maskApiKey(apiKey)}</code>
            <button type="button" onClick={access.forgetApiKey} className="btn btn-secondary btn-sm">
              Remove key
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-muted">
            To use a different key, remove this one first. Removing it only affects this browser.
          </p>
        </section>
      ) : (
        <ApiKeyForm onSaved={access.keySaved} />
      )}
    </div>
  );
}

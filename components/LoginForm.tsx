"use client";

import { useActionState } from "react";
import { sendMagicLink, type SendLinkState } from "@/app/login/actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<SendLinkState, FormData>(sendMagicLink, {});

  if (state.sentTo) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-1 text-base font-medium text-ink-primary">Check your email</h2>
        <p className="text-sm text-ink-secondary">
          We sent a sign-in link to <span className="font-medium text-ink-primary">{state.sentTo}</span>. Open it
          in this browser to finish signing in.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-lg border border-border bg-surface p-6">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink-secondary">
        Email
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="flex-1 rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-good px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Sending..." : "Send sign-in link"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-critical">{state.error}</p>}
    </form>
  );
}

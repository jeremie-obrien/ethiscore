"use client";

import { useActionState } from "react";
import {
  sendMagicLink,
  verifyCode,
  type SendLinkState,
  type VerifyCodeState,
} from "@/app/login/actions";

function CodeForm({ email, next }: { email: string; next: string }) {
  const [state, formAction, pending] = useActionState<VerifyCodeState, FormData>(verifyCode, {});

  return (
    <form action={formAction} className="rounded-lg border border-border bg-surface p-6">
      <h2 className="mb-1 text-base font-medium text-ink-primary">Check your email</h2>
      <p className="mb-4 text-sm text-ink-secondary">
        We sent an email to <span className="font-medium text-ink-primary">{email}</span>. Click the link in
        it, or, if you&rsquo;re reading it on another device, enter its code here to sign in on this one.
      </p>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <label htmlFor="code" className="mb-1 block text-sm font-medium text-ink-secondary">
        Code
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={12}
          placeholder="123456"
          className="flex-1 rounded-md border border-border bg-page px-3 py-2 text-sm tracking-widest text-ink-primary outline-none focus:border-ink-muted"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-good px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Checking..." : "Sign in"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-critical">{state.error}</p>}
      <p className="mt-4 text-xs text-ink-muted">
        No email? Check your spam folder, or{" "}
        <a href={`/login?next=${encodeURIComponent(next)}`} className="underline">
          start again
        </a>
        .
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<SendLinkState, FormData>(sendMagicLink, {});

  if (state.sentTo) {
    return <CodeForm email={state.sentTo} next={next} />;
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
          {pending ? "Sending..." : "Email me a sign-in link"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-critical">{state.error}</p>}
    </form>
  );
}

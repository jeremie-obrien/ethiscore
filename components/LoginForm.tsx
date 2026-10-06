"use client";

import { useActionState, useEffect, useState } from "react";
import {
  sendMagicLink,
  verifyCode,
  type SendLinkState,
  type VerifyCodeState,
} from "@/app/login/actions";
import { isTurnstileEnabled, Turnstile } from "./Turnstile";

const inputClass =
  "flex-1 rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted";
const buttonClass = "rounded-md bg-good px-4 py-2 text-sm font-medium text-white disabled:opacity-50";

/**
 * Signs in with the one-time code from the email. With `email` it follows a request made
 * here; without it ("Already have a code?") it also asks for the address, e.g. when the email
 * was requested on another device.
 */
function CodeForm({ email, next, onBack }: { email?: string; next: string; onBack: () => void }) {
  const [state, formAction, pending] = useActionState<VerifyCodeState, FormData>(verifyCode, {});

  return (
    <form action={formAction} className="rounded-lg border border-border bg-surface p-6">
      {email ? (
        <>
          <h2 className="mb-1 text-base font-medium text-ink-primary">Check your email</h2>
          <p className="mb-4 text-sm text-ink-secondary">
            We sent an email to <span className="font-medium text-ink-primary">{email}</span>. Click the link
            in it, or, if you&rsquo;re reading it on another device, enter its code here to sign in on this one.
          </p>
          <input type="hidden" name="email" value={email} />
        </>
      ) : (
        <>
          <h2 className="mb-1 text-base font-medium text-ink-primary">Enter your code</h2>
          <p className="mb-4 text-sm text-ink-secondary">
            Already requested a sign-in email, here or on another device? Enter the address it was sent to and
            the code it contains.
          </p>
          <label htmlFor="code-email" className="mb-1 block text-sm font-medium text-ink-secondary">
            Email
          </label>
          <input
            id="code-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={`${inputClass} mb-3 w-full`}
          />
        </>
      )}
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
          className={`${inputClass} tracking-widest`}
        />
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Checking..." : "Sign in"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-critical">{state.error}</p>}
      <p className="mt-4 text-xs text-ink-muted">
        {email ? "No email? Check your spam folder, or " : "Need a new email? "}
        <button type="button" onClick={onBack} className="underline">
          {email ? "start again" : "Request one"}
        </button>
        .
      </p>
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState<SendLinkState, FormData>(sendMagicLink, {});
  const [mode, setMode] = useState<"request" | "code">("request");
  const [sentTo, setSentTo] = useState<string | null>(null);

  // Decided after mount (it depends on the hostname), so server and client markup match.
  const [captchaEnabled, setCaptchaEnabled] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  useEffect(() => {
    setCaptchaEnabled(isTurnstileEnabled());
  }, []);

  // Each response means Supabase has consumed the bot-check token, so get a fresh one.
  useEffect(() => {
    if (state.sentTo) setSentTo(state.sentTo);
    if (state.sentTo || state.error) setCaptchaResetKey((k) => k + 1);
  }, [state]);

  function backToRequest() {
    setSentTo(null);
    setMode("request");
  }

  if (sentTo) return <CodeForm email={sentTo} next={next} onBack={backToRequest} />;
  if (mode === "code") return <CodeForm next={next} onBack={backToRequest} />;

  const waitingForCaptcha = captchaEnabled && !captchaToken;

  return (
    <form action={formAction} className="rounded-lg border border-border bg-surface p-6">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="captchaToken" value={captchaToken ?? ""} />
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
          className={inputClass}
        />
        <button type="submit" disabled={pending || waitingForCaptcha} className={buttonClass}>
          {pending ? "Sending..." : "Email me a sign-in link"}
        </button>
      </div>
      {captchaEnabled && <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />}
      {state.error && <p className="mt-2 text-sm text-critical">{state.error}</p>}
      <p className="mt-4 text-xs text-ink-muted">
        <button type="button" onClick={() => setMode("code")} className="underline">
          Already have a code?
        </button>
      </p>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import {
  sendMagicLink,
  verifyCode,
  type SendLinkState,
  type VerifyCodeState,
} from "@/app/login/actions";
import { isTurnstileEnabled, Turnstile } from "./Turnstile";


/**
 * Signs in with the one-time code from the email. With `email` it follows a request made
 * here; without it ("Already have a code?") it also asks for the address, e.g. when the email
 * was requested on another device.
 */
function CodeForm({ email, next, onBack }: { email?: string; next: string; onBack: () => void }) {
  const [state, formAction, pending] = useActionState<VerifyCodeState, FormData>(verifyCode, {});

  return (
    <form action={formAction} className="card p-6 sm:p-8">
      {email ? (
        <>
          <h2 className="mb-1 text-lg font-semibold tracking-tight">Check your email</h2>
          <p className="mb-6 text-sm text-ink-secondary">
            We sent an email to <span className="font-medium text-ink-primary">{email}</span>. Click the link
            in it, or, if you&rsquo;re reading it on another device, enter its code here to sign in on this one.
          </p>
          <input type="hidden" name="email" value={email} />
        </>
      ) : (
        <>
          <h2 className="mb-1 text-lg font-semibold tracking-tight">Enter your code</h2>
          <p className="mb-6 text-sm text-ink-secondary">
            Already requested a sign-in email, here or on another device? Enter the address it was sent to and
            the code it contains.
          </p>
          <label htmlFor="code-email" className="mb-1.5 block text-sm font-medium">
            Email
          </label>
          <input
            id="code-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="input mb-4"
          />
        </>
      )}
      <input type="hidden" name="next" value={next} />
      <label htmlFor="code" className="mb-1.5 block text-sm font-medium">
        Code
      </label>
      <div className="flex flex-col gap-3">
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          required
          maxLength={12}
          placeholder="123456"
          className="input h-12 text-center text-lg font-medium tracking-[0.4em]"
        />
        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Checking..." : "Sign in"}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm text-critical">{state.error}</p>}
      <p className="mt-5 text-center text-xs text-ink-muted">
        {email ? "No email? Check your spam folder, or " : "Need a new email? "}
        <button type="button" onClick={onBack} className="underline underline-offset-2 hover:text-ink-primary">
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
    <form action={formAction} className="card p-6 sm:p-8">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="captchaToken" value={captchaToken ?? ""} />
      <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
        Email address
      </label>
      <div className="flex flex-col gap-3">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="input h-11"
        />
        {captchaEnabled && <Turnstile onToken={setCaptchaToken} resetKey={captchaResetKey} />}
        <button type="submit" disabled={pending || waitingForCaptcha} className="btn btn-primary h-11 w-full">
          {pending ? "Sending..." : waitingForCaptcha ? "Checking you're human..." : "Email me a sign-in link"}
        </button>
      </div>
      {state.error && <p className="mt-3 text-sm text-critical">{state.error}</p>}
      <div className="mt-6 border-t border-gridline pt-5 text-center text-sm text-ink-secondary">
        Already have a code?{" "}
        <button type="button" onClick={() => setMode("code")} className="link">
          Enter it here
        </button>
      </div>
    </form>
  );
}

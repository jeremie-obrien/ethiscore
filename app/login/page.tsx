import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { LogoMark } from "@/components/Logo";
import { safeNextPath } from "@/lib/supabase/env";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata = { title: "Sign in" };

const POINTS = [
  "Score companies against built-in or custom ethics criteria",
  "Every score backed by Claude's live research and sources",
  "Your evaluations stay private to your account",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next: rawNext, error } = await searchParams;
  const next = safeNextPath(rawNext);

  const supabase = await createClient();
  if (await getCurrentUser(supabase)) redirect(next);

  return (
    <main className="mx-auto grid max-w-5xl items-start gap-10 px-4 py-12 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-16">
      <div className="lg:pt-6">
        <LogoMark className="mb-6 h-10 w-10" />
        <h1 className="text-3xl font-semibold tracking-tight">Sign in to EthiScore</h1>
        <p className="mt-3 text-ink-secondary">
          No password needed: we&rsquo;ll email you a sign-in link and code. New here? Your account is created
          automatically.
        </p>
        <ul className="mt-8 hidden flex-col gap-3 lg:flex">
          {POINTS.map((p) => (
            <li key={p} className="flex items-start gap-3 text-sm text-ink-secondary">
              <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true">
                <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {p}
            </li>
          ))}
        </ul>
      </div>

      <div className="w-full">
        {error && (
          <p className="mb-4 rounded-lg border border-critical/30 bg-critical/5 px-4 py-3 text-sm text-critical">
            That sign-in link is invalid or has expired. Request a new one below.
          </p>
        )}
        <LoginForm next={next} />
        <p className="mt-4 text-xs text-ink-muted">
          We use your email only to sign you in. See{" "}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink-primary">
            how we handle your data
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

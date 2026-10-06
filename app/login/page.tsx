import Link from "next/link";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/supabase/env";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";

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
    <main className="mx-auto max-w-md px-6 py-12 sm:py-16">
      <h1 className="mb-2 text-2xl font-semibold text-ink-primary">Sign in</h1>
      <p className="mb-8 text-sm text-ink-secondary">
        Enter your email and we&rsquo;ll send you a sign-in link. No password needed — new accounts are
        created automatically.
      </p>
      {error && (
        <p className="mb-4 text-sm text-critical">
          That sign-in link is invalid or has expired. Request a new one below.
        </p>
      )}
      <LoginForm next={next} />
      <p className="mt-4 text-xs text-ink-muted">
        We use your email only to sign you in. See{" "}
        <Link href="/privacy" className="underline">
          how we handle your data
        </Link>
        .
      </p>
    </main>
  );
}

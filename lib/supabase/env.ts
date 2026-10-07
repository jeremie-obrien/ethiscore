/**
 * Read at runtime (not NEXT_PUBLIC_*, which is baked in at build time), so one build or
 * Docker image works against any Supabase project. The publishable/anon key is safe to
 * expose — row-level security in supabase/migrations decides what it can access.
 */
export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set (see README).");
  }
  return { url, key };
}

/** Only allow same-site relative redirects, so a crafted ?next= can't send users elsewhere. */
export function safeNextPath(value: unknown): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

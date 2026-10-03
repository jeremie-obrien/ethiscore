import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseEnv } from "./env";

/** Per-request client acting as the signed-in user, so row-level security applies to every query. */
export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, key } = getSupabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can't set cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}

export interface CurrentUser {
  id: string;
  email?: string;
}

export async function getCurrentUser(supabase: SupabaseClient): Promise<CurrentUser | null> {
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { id: claims.sub, email: typeof claims.email === "string" ? claims.email : undefined };
}

/** For API routes: the signed-in user, or a 401 response to return as-is. */
export async function requireUser(
  supabase: SupabaseClient
): Promise<{ user: CurrentUser; response?: never } | { user?: never; response: NextResponse }> {
  const user = await getCurrentUser(supabase);
  if (!user) return { response: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  return { user };
}

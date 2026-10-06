import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for the emailed sign-in link. The "Confirm signup" and "Magic Link" email
 * templates in Supabase link here with `token_hash` + `type` (see README), which works from
 * any browser or device. Supabase's default templates send a one-time `code` instead, which
 * only works in the browser that requested the link (it needs a cookie set at request time).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  // Supabase adds error_code itself when it rejects the link before redirecting here.
  let failure: string | null = searchParams.get("error_code") ?? (code || tokenHash ? null : "missing_token");
  if (!failure && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) failure = error.code ?? error.message;
  } else if (!failure && tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) failure = error.code ?? error.message;
  }

  if (failure) {
    console.error(`Sign-in link rejected (${code ? "code" : tokenHash ? "token_hash" : "none"}): ${failure}`);
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "link");
    loginUrl.searchParams.set("reason", failure.slice(0, 100));
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.redirect(new URL(next, request.url));
}

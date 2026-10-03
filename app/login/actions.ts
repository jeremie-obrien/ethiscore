"use server";

import { headers } from "next/headers";
import { safeNextPath } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export interface SendLinkState {
  sentTo?: string;
  error?: string;
}

export async function sendMagicLink(_prev: SendLinkState, formData: FormData): Promise<SendLinkState> {
  const email = String(formData.get("email") ?? "").trim();
  const next = safeNextPath(formData.get("next"));
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  // Server Actions already reject cross-site requests, so Origin is this site. Supabase
  // additionally only redirects to URLs on its allowlist (Authentication → URL Configuration).
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error) return { error: error.message };
  return { sentTo: email };
}

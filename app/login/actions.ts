"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
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

export interface VerifyCodeState {
  error?: string;
}

/**
 * The emails carry a one-time code ({{ .Token }}) as well as the link, so someone who reads
 * the email on their phone can type the code here and sign in on this device instead.
 */
export async function verifyCode(_prev: VerifyCodeState, formData: FormData): Promise<VerifyCodeState> {
  const email = String(formData.get("email") ?? "").trim();
  const token = String(formData.get("code") ?? "").replace(/\s/g, "");
  const next = safeNextPath(formData.get("next"));
  if (!/^\d{6,10}$/.test(token)) {
    return { error: "Enter the code from the email: digits only." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { error: "That code is invalid or has expired. Check it, or request a new one." };
  redirect(next);
}

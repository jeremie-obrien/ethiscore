import "server-only";

import { createHmac, randomUUID } from "node:crypto";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { canonicalEmail, isAliasEmail } from "./auth/email";
import { getSupabaseEnv } from "./supabase/env";

// Free evaluations run on EthiScore's own Anthropic key. Every secret below is read from
// server-side environment variables only (Vercel → Settings → Environment Variables, marked
// Sensitive): never NEXT_PUBLIC_*, never committed, never logged or returned in a response.
// The "server-only" import above makes the build fail if browser code ever imports this file.

const BROWSER_COOKIE = "es_bid";
const BROWSER_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

interface FreeTierConfig {
  anthropicApiKey: string;
  supabaseSecretKey: string;
  hashSecret: string;
  monthlyLimit: number;
  dailyCap: number;
}

function positiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

/** Undefined when any secret is missing: free evaluations are then simply switched off. */
function config(): FreeTierConfig | undefined {
  const anthropicApiKey = process.env.FREE_TIER_ANTHROPIC_API_KEY;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;
  const hashSecret = process.env.FREE_TIER_HASH_SECRET;
  if (!anthropicApiKey || !supabaseSecretKey || !hashSecret) return undefined;
  return {
    anthropicApiKey,
    supabaseSecretKey,
    hashSecret,
    monthlyLimit: positiveInt(process.env.FREE_TIER_MONTHLY_LIMIT, 3),
    dailyCap: positiveInt(process.env.FREE_TIER_DAILY_CAP, 30),
  };
}

function adminClient(cfg: FreeTierConfig): SupabaseClient {
  return createSupabaseClient(getSupabaseEnv().url, cfg.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function keyedHash(cfg: FreeTierConfig, kind: string, value: string): string {
  return createHmac("sha256", cfg.hashSecret).update(`${kind}:${value}`).digest("base64url");
}

/** Expands an IPv6 address to 8 full hextets, or returns null if it isn't one. */
function expandIPv6(ip: string): string[] | null {
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - tail.length;
  if (missing < 0 || (halves.length === 1 && missing !== 0)) return null;
  const parts = [...head, ...Array(missing).fill("0"), ...tail];
  return parts.every((p) => /^[0-9a-f]{1,4}$/i.test(p)) ? parts.map((p) => p.padStart(4, "0").toLowerCase()) : null;
}

/**
 * The client's network: the full address for IPv4, the /56 block for IPv6 (devices rotate
 * the rest of their address, and a home usually gets a /56 or /64 of its own).
 */
export function networkOf(ip: string): string {
  const v4 = ip.match(/^(?:::ffff:)?(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (v4) return v4[1];
  const v6 = expandIPv6(ip.split("%")[0]);
  if (!v6) return ip;
  return `${v6.slice(0, 3).join(":")}:${v6[3].slice(0, 2)}::/56`;
}

async function clientIp(): Promise<string> {
  // Vercel sets both headers itself and overwrites any client-supplied value. On another host,
  // check how it reports the client IP before relying on these.
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** A random id for this browser in an httpOnly cookie (strictly necessary: abuse prevention). */
async function browserId(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(BROWSER_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  try {
    jar.set(BROWSER_COOKIE, id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: BROWSER_COOKIE_MAX_AGE,
    });
  } catch {
    // Not settable from a Server Component render; it's set on the next API call instead.
  }
  return id;
}

async function identityKeys(cfg: FreeTierConfig, email: string) {
  return {
    email: keyedHash(cfg, "email", canonicalEmail(email)),
    network: keyedHash(cfg, "network", networkOf(await clientIp())),
    browser: keyedHash(cfg, "browser", await browserId()),
  };
}

export type FreeTierStatus =
  | { available: false; reason: "disabled" | "alias" }
  | { available: true; limit: number; remaining: number };

export async function freeTierStatus(email: string | undefined): Promise<FreeTierStatus> {
  const cfg = config();
  if (!cfg || !email) return { available: false, reason: "disabled" };
  if (isAliasEmail(email)) return { available: false, reason: "alias" };
  const keys = await identityKeys(cfg, email);
  const { data, error } = await adminClient(cfg).rpc("free_evaluations_used", {
    p_email: keys.email,
    p_network: keys.network,
    p_browser: keys.browser,
  });
  if (error) throw new Error("Couldn't check free evaluations");
  return { available: true, limit: cfg.monthlyLimit, remaining: Math.max(0, cfg.monthlyLimit - Number(data)) };
}

export type FreeClaim =
  | { ok: true; apiKey: string; confirm: () => Promise<void>; release: () => Promise<void> }
  | { ok: false; reason: "disabled" | "alias" | "monthly_limit" | "daily_cap" };

/** Reserves one free evaluation; call confirm() after it succeeds or release() if it fails. */
export async function claimFreeEvaluation(userId: string, email: string | undefined): Promise<FreeClaim> {
  const cfg = config();
  if (!cfg || !email) return { ok: false, reason: "disabled" };
  if (isAliasEmail(email)) return { ok: false, reason: "alias" };

  const keys = await identityKeys(cfg, email);
  const admin = adminClient(cfg);
  const { data, error } = await admin.rpc("claim_free_evaluation", {
    p_user: userId,
    p_email: keys.email,
    p_network: keys.network,
    p_browser: keys.browser,
    p_monthly_limit: cfg.monthlyLimit,
    p_daily_cap: cfg.dailyCap,
  });
  if (error) throw new Error("Couldn't reserve a free evaluation");
  const result = data as { claim_id?: string; reason?: "monthly_limit" | "daily_cap" };
  if (!result.claim_id) return { ok: false, reason: result.reason ?? "monthly_limit" };

  const claimId = result.claim_id;
  return {
    ok: true,
    apiKey: cfg.anthropicApiKey,
    confirm: async () => {
      await admin.rpc("confirm_free_evaluation", { p_claim: claimId });
    },
    release: async () => {
      await admin.rpc("release_free_evaluation", { p_claim: claimId });
    },
  };
}

export const FREE_TIER_MESSAGES: Record<"disabled" | "alias" | "monthly_limit" | "daily_cap", string> = {
  disabled: "Free evaluations aren't available right now. Add your own API key to continue.",
  alias:
    "Free evaluations aren't available for email aliases (addresses with a \"+\"). Sign in with your main address, or add your own API key.",
  monthly_limit:
    "You've used this month's free evaluations. They renew on the 1st, or add your own API key to keep going now.",
  daily_cap:
    "Today's free evaluations are all used up across EthiScore. Try again tomorrow, or add your own API key.",
};

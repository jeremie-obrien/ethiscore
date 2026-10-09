import { DISPOSABLE_DOMAINS } from "./disposableDomains";

let disposable: Set<string> | null = null;

function disposableSet(): Set<string> {
  disposable ??= new Set(DISPOSABLE_DOMAINS.split("\n").filter(Boolean));
  return disposable;
}

function splitEmail(email: string): { local: string; domain: string } | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return { local: email.slice(0, at).toLowerCase(), domain: email.slice(at + 1).toLowerCase() };
}

/** True for throwaway-inbox domains, including their subdomains (e.g. x.mailinator.com). */
export function isDisposableEmail(email: string): boolean {
  const parts = splitEmail(email);
  if (!parts) return false;
  const labels = parts.domain.split(".");
  const set = disposableSet();
  for (let i = 0; i < labels.length - 1; i++) {
    if (set.has(labels.slice(i).join("."))) return true;
  }
  return false;
}

/**
 * Plus-addressing ("name+tag@example.com") delivers to the same inbox as "name@example.com",
 * so such addresses could be used to collect extra free evaluations. They can still sign up.
 */
export function isAliasEmail(email: string): boolean {
  return splitEmail(email)?.local.includes("+") ?? false;
}

const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/**
 * One identity per inbox, for counting free evaluations: lowercase, without "+tag", and for
 * Gmail without dots (Gmail ignores them: j.doe@gmail.com and jdoe@gmail.com are one inbox).
 */
export function canonicalEmail(email: string): string {
  const parts = splitEmail(email.trim());
  if (!parts) return email.trim().toLowerCase();
  let local = parts.local.split("+")[0];
  let domain = parts.domain;
  if (GMAIL_DOMAINS.has(domain)) {
    local = local.replaceAll(".", "");
    domain = "gmail.com";
  }
  return `${local}@${domain}`;
}

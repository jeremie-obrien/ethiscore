"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const DISMISSED_KEY = "ethiscore:cookie-notice-dismissed";

/**
 * Information notice, not a consent banner: every cookie EthiScore sets is strictly necessary
 * (sign-in session, free-evaluation abuse prevention), which EU rules exempt from consent.
 * If a non-essential cookie is ever added (analytics, ads), this must become a real
 * accept/reject choice before setting it.
 */
export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(localStorage.getItem(DISMISSED_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // storage unavailable: the notice just shows again next visit
    }
  }

  if (!visible) return null;
  return (
    <div role="region" aria-label="Cookie notice" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="card mx-auto flex max-w-3xl flex-col gap-3 p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-secondary">
          EthiScore only uses essential cookies: to keep you signed in and to prevent abuse of free evaluations. No
          tracking, no advertising.{" "}
          <Link href="/privacy#cookies" className="link">
            Learn more
          </Link>
        </p>
        <button type="button" onClick={dismiss} className="btn btn-primary btn-sm shrink-0">
          OK
        </button>
      </div>
    </div>
  );
}

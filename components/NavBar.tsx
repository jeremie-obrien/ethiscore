"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", exact: true },
  { href: "/evaluate", label: "New evaluation" },
  { href: "/history", label: "Evaluations" },
  { href: "/criteria", label: "Criteria sets" },
];

export function NavBar({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-gridline bg-surface/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="EthiScore home">
          <Logo />
        </Link>

        {userEmail && (
          <nav className="order-last -mx-2 flex w-full gap-1 overflow-x-auto sm:order-none sm:mx-0 sm:w-auto">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition ${
                    active
                      ? "bg-subtle font-medium text-ink-primary"
                      : "text-ink-secondary hover:bg-subtle hover:text-ink-primary"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {userEmail ? (
            <>
              <Link
                href="/profile"
                title={`Profile: ${userEmail}`}
                className={`flex items-center gap-2 rounded-md px-1.5 py-1 transition hover:bg-subtle ${
                  pathname === "/profile" ? "bg-subtle" : ""
                }`}
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent uppercase"
                  aria-hidden="true"
                >
                  {userEmail.charAt(0)}
                </span>
                <span className="hidden max-w-48 truncate text-sm text-ink-secondary md:inline">{userEmail}</span>
                <span className="sr-only md:hidden">Profile</span>
              </Link>
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn btn-ghost btn-sm">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            pathname !== "/login" && (
              <Link href="/login" className="btn btn-primary btn-sm">
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}

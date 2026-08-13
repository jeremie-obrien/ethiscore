"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/evaluate", label: "New evaluation" },
  { href: "/history", label: "Past evaluations" },
  { href: "/presets", label: "Criteria management" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gridline bg-surface">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
        <Link href="/" className="text-base font-semibold text-ink-primary">
          EthiScore
        </Link>
        <nav className="flex flex-wrap gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "bg-gridline font-semibold text-ink-primary"
                    : "text-ink-secondary hover:bg-page hover:text-ink-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

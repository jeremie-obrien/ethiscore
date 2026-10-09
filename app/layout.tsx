import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { CookieNotice } from "@/components/CookieNotice";
import { NavBar } from "@/components/NavBar";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

// Self-hosted by next/font at build time: visitors' browsers never contact Google.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: { default: "EthiScore", template: "%s · EthiScore" },
  description:
    "Score any company against the ethics criteria you care about. Claude researches it live and shows the evidence behind every score.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser(await createClient());
  return (
    <html lang="en" className={geist.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <NavBar userEmail={user ? (user.email ?? "Signed in") : null} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gridline">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-xs text-ink-muted sm:px-6">
            <span>© {new Date().getFullYear()} EthiScore</span>
            <Link href="/privacy" className="hover:text-ink-primary">
              Privacy &amp; legal notice
            </Link>
            <a href="mailto:hello@advitam.dev" className="hover:text-ink-primary">
              hello@advitam.dev
            </a>
          </div>
        </footer>
        <CookieNotice />
      </body>
    </html>
  );
}

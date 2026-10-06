import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { createClient, getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "EthiScore",
  description: "Score a company against custom weighted ethics criteria using Claude.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser(await createClient());
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <NavBar userEmail={user ? (user.email ?? "Signed in") : null} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-gridline">
          <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-1 px-6 py-6 text-xs text-ink-muted">
            <Link href="/privacy" className="hover:underline">
              Privacy &amp; legal notice
            </Link>
            <a href="mailto:hello@advitam.dev" className="hover:underline">
              hello@advitam.dev
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}

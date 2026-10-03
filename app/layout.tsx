import type { Metadata } from "next";
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
      <body className="min-h-screen antialiased">
        <NavBar userEmail={user ? (user.email ?? "Signed in") : null} />
        {children}
      </body>
    </html>
  );
}

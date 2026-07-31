import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EthiScore",
  description: "Score a company against custom weighted ethics criteria using Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

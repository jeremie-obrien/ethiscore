import Link from "next/link";
import { getApiKey } from "@/lib/config";
import { HomeClient } from "@/components/HomeClient";

export default async function HomePage() {
  const apiKey = await getApiKey();

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-8 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold text-ink-primary">EthiScore</h1>
        <Link href="/history" className="text-sm text-ink-secondary hover:underline">
          History
        </Link>
      </div>
      <HomeClient initialHasApiKey={Boolean(apiKey)} />
    </main>
  );
}

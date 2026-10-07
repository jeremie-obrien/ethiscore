import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="text-5xl font-semibold tracking-tight text-ink-muted">404</div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        This page doesn&rsquo;t exist, or it belongs to another account.
      </p>
      <Link href="/" className="btn btn-primary mt-6">
        Go to the home page
      </Link>
    </main>
  );
}

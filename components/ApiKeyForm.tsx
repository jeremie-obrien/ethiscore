"use client";

import { useState } from "react";

export function ApiKeyForm({ onSaved }: { onSaved: () => void }) {
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save API key");
      }
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-surface p-6"
    >
      <h2 className="mb-1 text-base font-medium text-ink-primary">Set your Anthropic API key</h2>
      <p className="mb-4 text-sm text-ink-secondary">
        Stored locally in <code>~/.ethiscore/config.json</code>. It never leaves this machine.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          required
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="flex-1 rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
        />
        <button
          type="submit"
          disabled={saving || apiKey.length === 0}
          className="rounded-md bg-good px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save key"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-critical">{error}</p>}
    </form>
  );
}

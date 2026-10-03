"use client";

import { useState } from "react";
import { saveApiKey } from "./apiKeyStore";

export function ApiKeyForm({
  error,
  onSaved,
}: {
  error?: string | null;
  onSaved: (apiKey: string) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [remember, setRemember] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = apiKey.trim();
    if (!trimmed) return;
    saveApiKey(trimmed, remember);
    onSaved(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-6">
      <h2 className="mb-1 text-base font-medium text-ink-primary">Add your Anthropic API key</h2>
      <p className="mb-4 text-sm text-ink-secondary">
        Evaluations run on your own Anthropic account. Your key stays in this browser and is sent only
        with each evaluation, over an encrypted connection. It is never stored on our servers. Get a key
        at{" "}
        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          console.anthropic.com
        </a>
        . Create the key inside a workspace: keys that don&rsquo;t belong to a workspace are refused.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="password"
          required
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="flex-1 rounded-md border border-border bg-page px-3 py-2 text-sm text-ink-primary outline-none focus:border-ink-muted"
        />
        <button
          type="submit"
          disabled={apiKey.trim().length === 0}
          className="rounded-md bg-good px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Use key
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-critical">{error}</p>}
      <label className="mt-3 flex items-center gap-2 text-sm text-ink-secondary">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Remember on this device (otherwise it&rsquo;s forgotten when you close the tab)
      </label>
    </form>
  );
}

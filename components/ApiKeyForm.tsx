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
    <form onSubmit={handleSubmit} className="card p-6 sm:p-8">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-accent" aria-hidden="true">
          <svg viewBox="0 0 16 16" className="h-4 w-4">
            <circle cx="5.5" cy="10.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7.7 8.3L13 3m-2 2l1.5 1.5M9.5 6.5L11 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <h2 className="text-lg font-semibold tracking-tight">Add your Anthropic API key</h2>
      </div>
      <p className="mt-2 text-sm text-ink-secondary">
        Evaluations run on your own Anthropic account, so you only pay for what you use.
      </p>
      <ul className="mt-3 mb-6 flex flex-col gap-1.5 text-sm text-ink-secondary">
        <li>
          Create a key inside a workspace at{" "}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="link">
            console.anthropic.com
          </a>
          . Keys outside a workspace are refused.
        </li>
        <li>It stays in this browser and is only sent, encrypted, with each evaluation. It&rsquo;s never stored on our servers.</li>
      </ul>
      <label htmlFor="api-key" className="mb-1.5 block text-sm font-medium">
        API key
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="api-key"
          type="password"
          required
          autoComplete="off"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-..."
          className="input font-mono"
        />
        <button type="submit" disabled={apiKey.trim().length === 0} className="btn btn-primary">
          Use this key
        </button>
      </div>
      {error && <p className="mt-3 text-sm text-critical">{error}</p>}
      <label className="mt-4 flex items-center gap-2 text-sm text-ink-secondary">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        Remember on this device (otherwise it&rsquo;s forgotten when you close the tab)
      </label>
    </form>
  );
}

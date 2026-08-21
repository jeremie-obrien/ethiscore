"use client";

import { useRef, useState } from "react";
import { parseCsv } from "@/lib/csv";

/** Expects a header row, then one company name per row (first column). */
function companiesFromCsv(text: string): string[] {
  const rows = parseCsv(text);
  const dataRows = rows.slice(1); // skip header
  return dataRows.map((r) => (r[0] ?? "").trim()).filter((name) => name.length > 0);
}

export function CompanyTagInput({
  companies,
  onChange,
}: {
  companies: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addFromDraft() {
    const name = draft.trim();
    if (!name) return;
    if (!companies.some((c) => c.toLowerCase() === name.toLowerCase())) {
      onChange([...companies, name]);
    }
    setDraft("");
  }

  function removeAt(index: number) {
    onChange(companies.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addFromDraft();
    } else if (e.key === "Backspace" && draft.length === 0 && companies.length > 0) {
      removeAt(companies.length - 1);
    }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      const parsed = companiesFromCsv(text);
      if (parsed.length === 0) {
        throw new Error('No valid rows found. Expected a header row, then one company name per row.');
      }
      const merged = [...companies];
      for (const name of parsed) {
        if (!merged.some((c) => c.toLowerCase() === name.toLowerCase())) merged.push(name);
      }
      onChange(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import CSV");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-page px-2 py-2">
        {companies.map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="flex items-center gap-1 rounded-full bg-track px-2.5 py-1 text-sm text-ink-primary"
          >
            {c}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${c}`}
              className="text-ink-muted hover:text-critical"
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addFromDraft}
          placeholder={companies.length === 0 ? "e.g. Tesla — press Enter to add" : "Add another..."}
          className="min-w-[10rem] flex-1 bg-transparent px-1 py-1 text-sm text-ink-primary outline-none placeholder:text-ink-muted"
        />
      </div>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-xs text-ink-secondary hover:underline"
          title='CSV column: "Company name"'
        >
          Import CSV
        </button>
        <span className="text-xs text-ink-muted">header row, then one company name per row</span>
      </div>
      {error && <p className="mt-1 text-xs text-critical">{error}</p>}
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleImportFile} className="hidden" />
    </div>
  );
}

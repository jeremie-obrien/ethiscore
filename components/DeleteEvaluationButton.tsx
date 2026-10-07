"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEvaluationButton({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/history");
      router.refresh();
    } catch {
      setError("Couldn't delete it. Try again.");
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="btn btn-ghost btn-sm hover:text-critical">
        Delete
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      {error && <span className="mr-2 text-xs text-critical">{error}</span>}
      <button type="button" onClick={handleDelete} disabled={busy} className="btn btn-danger btn-sm">
        {busy ? "Deleting..." : "Delete evaluation"}
      </button>
      <button type="button" onClick={() => setConfirming(false)} className="btn btn-ghost btn-sm">
        Cancel
      </button>
    </span>
  );
}

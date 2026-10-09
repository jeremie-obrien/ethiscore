"use client";

import { useCallback, useEffect, useState } from "react";
import { clearApiKey, loadApiKey } from "./apiKeyStore";

export type FreeStatus =
  | { available: false; reason: string; message: string }
  | { available: true; limit: number; remaining: number };

export interface EvaluationAccess {
  /** undefined until mounted (the key lives in browser storage, invisible to the server). */
  apiKey: string | null | undefined;
  /** null while loading. */
  free: FreeStatus | null;
  /** Call after ApiKeyForm has stored a new key. */
  keySaved: (key: string) => void;
  forgetApiKey: () => void;
  refreshFree: () => void;
}

/** Whether evaluations run on the visitor's own key or on their free monthly allowance. */
export function useEvaluationAccess(): EvaluationAccess {
  const [apiKey, setKey] = useState<string | null | undefined>(undefined);
  const [free, setFree] = useState<FreeStatus | null>(null);

  const refreshFree = useCallback(() => {
    fetch("/api/free-tier")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((body: FreeStatus) => setFree(body))
      .catch(() => setFree({ available: false, reason: "disabled", message: "" }));
  }, []);

  useEffect(() => {
    setKey(loadApiKey());
    refreshFree();
  }, [refreshFree]);

  return {
    apiKey,
    free,
    keySaved: setKey,
    forgetApiKey: () => {
      clearApiKey();
      setKey(null);
    },
    refreshFree,
  };
}

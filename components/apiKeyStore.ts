// The visitor's Anthropic key lives only in their browser: sessionStorage by default
// (gone when the tab closes), localStorage if they choose "remember on this device".
// It's sent with each /api/evaluate request and never stored server-side.
const STORAGE_KEY = "ethiscore:anthropic-api-key";

export function loadApiKey(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveApiKey(apiKey: string, remember: boolean): void {
  clearApiKey();
  try {
    (remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, apiKey);
  } catch {
    // storage unavailable (e.g. private browsing) — the key just won't survive a reload
  }
}

export function clearApiKey(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}

/** "sk-ant-…abcd": enough to recognize which key is in use without showing it. */
export function maskApiKey(apiKey: string): string {
  return `${apiKey.slice(0, 7)}…${apiKey.slice(-4)}`;
}

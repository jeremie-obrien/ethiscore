/** Builds a /history URL, overriding one query param while preserving the rest. */
export function withHistoryParam(
  current: URLSearchParams,
  key: string,
  value: string
): string {
  const next = new URLSearchParams(current);
  if (value) {
    next.set(key, value);
  } else {
    next.delete(key);
  }
  const qs = next.toString();
  return qs ? `/history?${qs}` : "/history";
}

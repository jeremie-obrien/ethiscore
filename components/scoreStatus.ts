export type ScoreStatus = "good" | "warning" | "critical";

export function scoreStatus(score: number): ScoreStatus {
  if (score >= 0.7) return "good";
  if (score >= 0.4) return "warning";
  return "critical";
}

export const STATUS_LABEL: Record<ScoreStatus, string> = {
  good: "Strong",
  warning: "Mixed",
  critical: "Weak",
};

// warning's fill (#fab219) is light enough that white text fails contrast, and
// unlike ink-primary it doesn't flip in dark mode, so it needs a fixed dark text
// color rather than a theme-aware token. good/critical are dark enough for white text.
export const STATUS_CHIP_TEXT_CLASS: Record<ScoreStatus, string> = {
  good: "text-white",
  warning: "text-black",
  critical: "text-white",
};

export const STATUS_BG_CLASS: Record<ScoreStatus, string> = {
  good: "bg-good",
  warning: "bg-warning",
  critical: "bg-critical",
};

export function pct(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

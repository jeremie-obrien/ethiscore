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

// Chips are a light tint of the status color with darker (light mode) or lighter (dark
// mode) text, so the label stays readable without the chip shouting.
export const STATUS_CHIP_CLASS: Record<ScoreStatus, string> = {
  good: "bg-good/12 text-good-ink ring-good/25",
  warning: "bg-warning/15 text-warning-ink ring-warning/35",
  critical: "bg-critical/10 text-critical-ink ring-critical/25",
};

export const STATUS_BG_CLASS: Record<ScoreStatus, string> = {
  good: "bg-good",
  warning: "bg-warning",
  critical: "bg-critical",
};

/** Whole percentages: decimals would suggest more precision than a model's judgment has. */
export function pct(score: number): string {
  return `${Math.round(score * 100)}%`;
}

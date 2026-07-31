import { scoreStatus, STATUS_BG_CLASS } from "./scoreStatus";

export function Meter({ score, height = 10 }: { score: number; height?: number }) {
  const status = scoreStatus(score);
  const widthPct = Math.max(0, Math.min(1, score)) * 100;

  return (
    <div
      className="w-full rounded-sm bg-track overflow-hidden"
      style={{ height }}
      role="img"
      aria-label={`Score: ${(score * 100).toFixed(1)} out of 100`}
    >
      <div
        className={`h-full rounded-r-sm ${STATUS_BG_CLASS[status]}`}
        style={{ width: `${widthPct}%` }}
      />
    </div>
  );
}

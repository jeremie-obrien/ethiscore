import { scoreStatus, STATUS_LABEL, STATUS_BG_CLASS, STATUS_CHIP_TEXT_CLASS } from "./scoreStatus";

export function StatusChip({ score }: { score: number }) {
  const status = scoreStatus(score);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BG_CLASS[status]} ${STATUS_CHIP_TEXT_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

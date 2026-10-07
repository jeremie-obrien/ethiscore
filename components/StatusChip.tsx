import { scoreStatus, STATUS_CHIP_CLASS, STATUS_LABEL } from "./scoreStatus";

export function StatusChip({ score }: { score: number }) {
  const status = scoreStatus(score);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_CHIP_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

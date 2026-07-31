import chalk from "chalk";
import type { EvaluationRecord } from "../../lib/scoring/schema";

function scoreColor(score: number): (text: string) => string {
  if (score >= 0.7) return chalk.green;
  if (score >= 0.4) return chalk.yellow;
  return chalk.red;
}

function pct(score: number): string {
  return `${(score * 100).toFixed(1)}%`;
}

export function renderReport(record: EvaluationRecord): string {
  const lines: string[] = [];
  const color = scoreColor(record.overallScore);

  lines.push("");
  lines.push(chalk.bold(`  ${record.company}`) + chalk.dim(`  (${record.model})`));
  lines.push("");
  lines.push(chalk.bold("  Criteria breakdown"));
  lines.push(chalk.dim("  " + "─".repeat(60)));

  for (const c of record.criteria) {
    const cColor = scoreColor(c.score);
    const weightPct = (c.normalizedWeight * 100).toFixed(0);
    lines.push(`  ${chalk.bold(c.name)}  ${cColor(pct(c.score))}  ${chalk.dim(`(weight ${weightPct}%)`)}`);
    lines.push(`    ${c.rationale}`);
    if (c.sources.length > 0) {
      lines.push(chalk.dim(`    Sources: ${c.sources.join(", ")}`));
    }
    lines.push("");
  }

  lines.push(chalk.dim("  " + "─".repeat(60)));
  lines.push(chalk.bold(`  Overall ethics score: `) + color(chalk.bold(pct(record.overallScore))));
  lines.push("");
  lines.push(chalk.dim("  " + record.overallSummary));
  lines.push("");
  lines.push(chalk.dim(`  Evaluated ${record.createdAt} · id ${record.id}`));
  lines.push("");

  return lines.join("\n");
}

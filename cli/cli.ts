#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { resolveApiKey } from "./resolveApiKey";
import { collectInputs } from "./prompts/collectInputs";
import { evaluateCompany } from "../lib/scoring/evaluate";
import { saveEvaluation, listEvaluations, findEvaluation } from "../lib/storage/store";
import { renderReport } from "./render/report";
import { DEFAULT_MODEL } from "../lib/anthropic/client";

const program = new Command();

program
  .name("ethiscore")
  .description("Score a company against custom weighted ethics criteria using Claude.")
  .version("0.1.0");

program
  .command("evaluate")
  .description("Run a new ethics evaluation for a company")
  .option("--api-key <key>", "Anthropic API key (falls back to ANTHROPIC_API_KEY env var or saved config)")
  .option("--company <name>", "Company name")
  .option("--criterion <name...>", "Criterion name (repeat 3 times, or pass 3 values)")
  .option("--description <text...>", "Criterion description (must match --criterion count)")
  .option("--weight <number...>", "Criterion weight (must match --criterion count)")
  .option("--model <model>", "Anthropic model to use", DEFAULT_MODEL)
  .action(async (opts) => {
    try {
      const apiKey = await resolveApiKey(opts.apiKey);

      const weight = opts.weight?.map((w: string) => Number(w));
      const inputs = await collectInputs({
        company: opts.company,
        criterion: opts.criterion,
        description: opts.description,
        weight,
      });

      console.log(chalk.dim(`\n  Researching ${inputs.company} and scoring against ${inputs.criteria.length} criteria...\n`));

      const record = await evaluateCompany({
        apiKey,
        company: inputs.company,
        criteria: inputs.criteria,
        model: opts.model,
      });

      console.log(renderReport(record));

      const filePath = await saveEvaluation(record);
      console.log(chalk.dim(`  Saved to ${filePath}`));
    } catch (err) {
      console.error(chalk.red(`\n  Error: ${(err as Error).message}\n`));
      process.exitCode = 1;
    }
  });

program
  .command("list")
  .description("List past evaluations")
  .action(async () => {
    const entries = await listEvaluations();
    if (entries.length === 0) {
      console.log(chalk.dim("  No evaluations saved yet. Run `ethiscore evaluate` first."));
      return;
    }
    for (const { record } of entries) {
      const score = `${(record.overallScore * 100).toFixed(1)}%`;
      console.log(`  ${chalk.dim(record.createdAt)}  ${chalk.bold(record.company.padEnd(24))}  ${score}  ${chalk.dim(record.id)}`);
    }
  });

program
  .command("show <id>")
  .description("Show a saved evaluation by id or file name")
  .action(async (id: string) => {
    const entry = await findEvaluation(id);
    if (!entry) {
      console.error(chalk.red(`  No evaluation found matching "${id}". Run \`ethiscore list\` to see saved evaluations.`));
      process.exitCode = 1;
      return;
    }
    console.log(renderReport(entry.record));
  });

program.parseAsync(process.argv);

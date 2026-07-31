import { input, number } from "@inquirer/prompts";
import type { CriterionInput } from "../../lib/scoring/schema";

export interface EvaluateInputs {
  company: string;
  criteria: CriterionInput[];
}

export interface EvaluateFlags {
  company?: string;
  criterion?: string[];
  description?: string[];
  weight?: number[];
}

export async function collectInputs(flags: EvaluateFlags): Promise<EvaluateInputs> {
  const company =
    flags.company ??
    (await input({
      message: "Company name:",
      validate: (v) => v.trim().length > 0 || "Required",
    }));

  const flagsProvideAllCriteria =
    flags.criterion?.length === 3 &&
    flags.description?.length === 3 &&
    flags.weight?.length === 3;

  const criteria: CriterionInput[] = [];

  for (let i = 0; i < 3; i++) {
    if (flagsProvideAllCriteria) {
      criteria.push({
        name: flags.criterion![i],
        description: flags.description![i],
        weight: flags.weight![i],
      });
      continue;
    }

    const name = await input({
      message: `Criterion ${i + 1} name:`,
      validate: (v) => v.trim().length > 0 || "Required",
    });
    const description = await input({
      message: `Criterion ${i + 1} description:`,
      validate: (v) => v.trim().length > 0 || "Required",
    });
    const weight = await number({
      message: `Criterion ${i + 1} weight (relative importance, any positive number):`,
      validate: (v) => (v !== undefined && v > 0) || "Must be a positive number",
    });
    criteria.push({ name, description, weight: weight! });
  }

  return { company, criteria };
}

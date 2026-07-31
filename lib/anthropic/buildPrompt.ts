import type { CriterionInput } from "../scoring/schema";

export const SUBMIT_EVALUATION_TOOL_NAME = "submit_evaluation";

export function buildSystemPrompt(): string {
  return `You are an ethics research analyst. You evaluate companies against a set of \
user-defined ethical criteria using up-to-date, evidence-based research via web search.

For each criterion:
- Research the company's actual conduct, policies, controversies, and track record relevant to that criterion.
- Assign a score from 0.0 (worst) to 1.0 (best) reflecting how well the company performs on that criterion specifically.
- Write a concise, evidence-based rationale (2-5 sentences) citing specific facts.
- List source URLs you relied on for that criterion.

Be objective and evidence-based rather than reputational or vibes-based. If evidence is thin or mixed, say so \
in the rationale and score conservatively around the middle rather than guessing at extremes. The overall score \
is computed outside the model as a weighted geometric mean across criteria, which means a very low score on any \
one criterion drags the whole result down hard — reserve scores near 0.0 for cases with clear, well-evidenced \
findings of serious misconduct, not just thin or mixed evidence. Do not compute an overall score yourself — that \
is handled outside the model. Instead, once you have scored every criterion, call the \
"${SUBMIT_EVALUATION_TOOL_NAME}" tool with your findings and a one-paragraph overall_summary synthesizing \
the company's ethical profile across all criteria.`;
}

export function buildUserPrompt(company: string, criteria: CriterionInput[]): string {
  const criteriaBlock = criteria
    .map((c, i) => `${i + 1}. "${c.name}" (weight: ${c.weight}) — ${c.description}`)
    .join("\n");

  return `Company to evaluate: ${company}

Evaluate this company against the following criteria:
${criteriaBlock}

Use web search to ground your evaluation in current, real information about this specific company. \
When finished, submit your findings via the "${SUBMIT_EVALUATION_TOOL_NAME}" tool.`;
}

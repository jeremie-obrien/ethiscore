"use client";

import { UsageBanner } from "./UsageBanner";
import { useEvaluationAccess } from "./useEvaluationAccess";

/** UsageBanner for pages that don't otherwise track evaluation access (e.g. the dashboard). */
export function AccessBanner() {
  return <UsageBanner access={useEvaluationAccess()} />;
}

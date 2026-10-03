import Anthropic from "@anthropic-ai/sdk";

export interface FriendlyError {
  message: string;
  status: number;
  /** Set when the visitor needs to enter a different key. */
  code?: "invalid_api_key";
}

/** Anthropic's own explanation, from the error body ({ error: { message } }). */
function apiMessage(err: InstanceType<typeof Anthropic.APIError>): string | undefined {
  const body = err.error as { error?: { message?: unknown } } | undefined;
  return typeof body?.error?.message === "string" ? body.error.message : undefined;
}

/** Turns an Anthropic SDK error into a message a visitor can act on. */
export function toFriendlyError(err: unknown): FriendlyError {
  if (!(err instanceof Anthropic.APIError)) {
    return { message: (err as Error).message, status: 502 };
  }
  const detail = apiMessage(err);
  const withDetail = (message: string) => (detail ? `${message} (Anthropic said: “${detail}”)` : message);

  if (err instanceof Anthropic.AuthenticationError) {
    return {
      message: "Anthropic rejected this API key. Check that you copied the whole key, starting with sk-ant-.",
      status: 401,
      code: "invalid_api_key",
    };
  }
  if (err instanceof Anthropic.PermissionDeniedError) {
    return {
      message: withDetail(
        "This API key isn’t allowed to run evaluations. Create a key inside a workspace in the Anthropic Console, and check that web search is allowed for your organization."
      ),
      status: 403,
      code: "invalid_api_key",
    };
  }
  if (err instanceof Anthropic.RateLimitError) {
    return {
      message: withDetail("Your Anthropic account hit a rate or spending limit. Wait a minute and try again."),
      status: 429,
    };
  }
  if (err.status === 529 || err instanceof Anthropic.InternalServerError) {
    return { message: "Anthropic is temporarily overloaded. Try again in a minute.", status: 503 };
  }
  return { message: detail ?? err.message, status: 502 };
}

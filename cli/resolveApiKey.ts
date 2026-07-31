import { password, confirm } from "@inquirer/prompts";
import { getApiKey, saveApiKey, getConfigFilePath } from "../lib/config";

export async function resolveApiKey(flagValue?: string): Promise<string> {
  if (flagValue) return flagValue;

  const existing = await getApiKey();
  if (existing) return existing;

  const entered = await password({
    message: "Enter your Anthropic API key:",
    mask: "*",
  });

  const shouldSave = await confirm({
    message: `Save this key to ${getConfigFilePath()} (chmod 600) so you don't have to re-enter it?`,
    default: true,
  });
  if (shouldSave) {
    await saveApiKey(entered);
  }

  return entered;
}

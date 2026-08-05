import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".ethiscore");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface StoredConfig {
  anthropicApiKey?: string;
}

async function readStoredConfig(): Promise<StoredConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf8");
    return JSON.parse(raw) as StoredConfig;
  } catch {
    return {};
  }
}

export async function saveApiKey(apiKey: string): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  const existing = await readStoredConfig();
  await writeFile(
    CONFIG_FILE,
    JSON.stringify({ ...existing, anthropicApiKey: apiKey }, null, 2),
    { mode: 0o600 }
  );
}

/** Env var, then saved config file. Returns undefined rather than prompting — safe to call from a server route. */
export async function getApiKey(): Promise<string | undefined> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const stored = await readStoredConfig();
  return stored.anthropicApiKey;
}

export function getConfigFilePath(): string {
  return CONFIG_FILE;
}

export function getEvaluationsDir(): string {
  return path.join(CONFIG_DIR, "evaluations");
}

export function getPresetsDir(): string {
  return path.join(CONFIG_DIR, "presets");
}

import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPresetsDir } from "../config";
import { PresetSchema, type CriterionInput, type Preset } from "../scoring/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function filenameFor(preset: Preset): string {
  const stamp = preset.createdAt.replace(/[:.]/g, "-");
  return `${stamp}-${slugify(preset.name)}.json`;
}

export async function savePreset(preset: Preset): Promise<string> {
  const dir = getPresetsDir();
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filenameFor(preset));
  await writeFile(filePath, JSON.stringify(preset, null, 2), "utf8");
  return filePath;
}

interface PresetListEntry {
  filePath: string;
  preset: Preset;
}

async function listPresetEntries(): Promise<PresetListEntry[]> {
  const dir = getPresetsDir();
  let fileNames: string[];
  try {
    fileNames = await readdir(dir);
  } catch {
    return [];
  }

  const entries: PresetListEntry[] = [];
  for (const fileName of fileNames.filter((f) => f.endsWith(".json")).sort()) {
    const filePath = path.join(dir, fileName);
    try {
      const raw = await readFile(filePath, "utf8");
      entries.push({ filePath, preset: PresetSchema.parse(JSON.parse(raw)) });
    } catch {
      // skip unreadable/corrupt files
    }
  }
  return entries;
}

export async function listPresets(): Promise<Preset[]> {
  return (await listPresetEntries()).map((e) => e.preset);
}

export async function findPreset(id: string): Promise<Preset | undefined> {
  const presets = await listPresets();
  return presets.find((p) => p.id === id);
}

async function findPresetEntry(id: string): Promise<PresetListEntry | undefined> {
  const entries = await listPresetEntries();
  return entries.find((e) => e.preset.id === id);
}

export async function updatePreset(
  id: string,
  updates: { name?: string; criteria?: CriterionInput[] }
): Promise<Preset | undefined> {
  const entry = await findPresetEntry(id);
  if (!entry) return undefined;
  const updated: Preset = {
    ...entry.preset,
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.criteria !== undefined ? { criteria: updates.criteria } : {}),
  };
  await writeFile(entry.filePath, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

export async function deletePreset(id: string): Promise<boolean> {
  const entry = await findPresetEntry(id);
  if (!entry) return false;
  await unlink(entry.filePath);
  return true;
}

/** Only one preset can be default at a time; setting one clears any other. */
export async function setDefaultPreset(id: string, isDefault: boolean): Promise<Preset | undefined> {
  const entries = await listPresetEntries();
  let result: Preset | undefined;
  for (const entry of entries) {
    const shouldBeDefault = entry.preset.id === id ? isDefault : false;
    if (entry.preset.isDefault === shouldBeDefault) {
      if (entry.preset.id === id) result = entry.preset;
      continue;
    }
    const updated: Preset = { ...entry.preset, isDefault: shouldBeDefault };
    await writeFile(entry.filePath, JSON.stringify(updated, null, 2), "utf8");
    if (entry.preset.id === id) result = updated;
  }
  return result;
}

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getPresetsDir } from "../config";
import { PresetSchema, type Preset } from "../scoring/schema";

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

export async function listPresets(): Promise<Preset[]> {
  const dir = getPresetsDir();
  let fileNames: string[];
  try {
    fileNames = await readdir(dir);
  } catch {
    return [];
  }

  const presets: Preset[] = [];
  for (const fileName of fileNames.filter((f) => f.endsWith(".json")).sort()) {
    try {
      const raw = await readFile(path.join(dir, fileName), "utf8");
      presets.push(PresetSchema.parse(JSON.parse(raw)));
    } catch {
      // skip unreadable/corrupt files
    }
  }
  return presets;
}

export async function findPreset(id: string): Promise<Preset | undefined> {
  const presets = await listPresets();
  return presets.find((p) => p.id === id);
}

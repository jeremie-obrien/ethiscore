import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getCriteriaSetsDir } from "../config";
import { CriteriaSetSchema, type CriterionInput, type CriteriaSet } from "../scoring/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function filenameFor(set: CriteriaSet): string {
  const stamp = set.createdAt.replace(/[:.]/g, "-");
  return `${stamp}-${slugify(set.name)}.json`;
}

const SEED_SETS: Array<{ name: string; isDefault?: boolean; criteria: CriterionInput[] }> = [
  {
    name: "ESG",
    isDefault: true,
    criteria: [
      {
        name: "Environmental practices",
        description:
          "Sustainability initiatives, emissions reduction, and resource stewardship. Reward reputable environmental certifications (e.g. B Corp, LEED, ISO 14001).",
        weight: 1,
      },
      {
        name: "Social responsibility",
        description:
          "Labor practices, diversity & inclusion, community impact, and human rights record. Reward reputable social/labor certifications (e.g. Fair Trade, SA8000).",
        weight: 1,
      },
      {
        name: "Governance quality",
        description:
          "Board independence, executive accountability, transparency, and anti-corruption practices. Reward strong governance ratings and certifications (e.g. ISO 37001).",
        weight: 1,
      },
    ],
  },
  {
    name: "Innovation & advancing humanity",
    criteria: [
      {
        name: "R&D investment & output",
        description:
          "R&D spend relative to revenue, patents, publications, and breakthrough technologies produced.",
        weight: 1,
      },
      {
        name: "Scientific & open contribution",
        description:
          "Open-source contributions, published research, and tools or data shared with the broader field rather than kept proprietary.",
        weight: 1,
      },
      {
        name: "Long-term / frontier impact",
        description:
          "Work on hard, high-leverage problems (health, climate, fundamental science, education access) versus purely incremental commercial products.",
        weight: 1,
      },
    ],
  },
  {
    name: "Environment",
    criteria: [
      {
        name: "Carbon footprint & emissions",
        description:
          "Absolute and trending greenhouse gas emissions, and the credibility of any net-zero targets.",
        weight: 1,
      },
      {
        name: "Resource use & waste",
        description: "Water usage, waste management, circular economy practices, and resource efficiency.",
        weight: 1,
      },
      {
        name: "Environmental certifications & compliance",
        description:
          "Recognized certifications (e.g. ISO 14001, LEED) and regulatory compliance record, including violations or fines.",
        weight: 1,
      },
    ],
  },
];

async function seedDefaultCriteriaSets(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
  const now = Date.now();
  for (const [i, seed] of SEED_SETS.entries()) {
    const set: CriteriaSet = {
      id: randomUUID(),
      name: seed.name,
      createdAt: new Date(now + i).toISOString(),
      criteria: seed.criteria,
      isDefault: seed.isDefault ?? false,
    };
    await writeFile(path.join(dir, filenameFor(set)), JSON.stringify(set, null, 2), "utf8");
  }
}

export async function saveCriteriaSet(set: CriteriaSet): Promise<string> {
  const dir = getCriteriaSetsDir();
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filenameFor(set));
  await writeFile(filePath, JSON.stringify(set, null, 2), "utf8");
  return filePath;
}

interface CriteriaSetListEntry {
  filePath: string;
  set: CriteriaSet;
}

async function listCriteriaSetEntries(): Promise<CriteriaSetListEntry[]> {
  const dir = getCriteriaSetsDir();
  let fileNames: string[];
  try {
    fileNames = await readdir(dir);
  } catch {
    fileNames = [];
  }

  if (fileNames.filter((f) => f.endsWith(".json")).length === 0) {
    await seedDefaultCriteriaSets(dir);
    fileNames = await readdir(dir);
  }

  const entries: CriteriaSetListEntry[] = [];
  for (const fileName of fileNames.filter((f) => f.endsWith(".json")).sort()) {
    const filePath = path.join(dir, fileName);
    try {
      const raw = await readFile(filePath, "utf8");
      entries.push({ filePath, set: CriteriaSetSchema.parse(JSON.parse(raw)) });
    } catch {
      // skip unreadable/corrupt files
    }
  }
  return entries;
}

export async function listCriteriaSets(): Promise<CriteriaSet[]> {
  return (await listCriteriaSetEntries()).map((e) => e.set);
}

export async function findCriteriaSet(id: string): Promise<CriteriaSet | undefined> {
  const sets = await listCriteriaSets();
  return sets.find((s) => s.id === id);
}

async function findCriteriaSetEntry(id: string): Promise<CriteriaSetListEntry | undefined> {
  const entries = await listCriteriaSetEntries();
  return entries.find((e) => e.set.id === id);
}

export async function updateCriteriaSet(
  id: string,
  updates: { name?: string; criteria?: CriterionInput[] }
): Promise<CriteriaSet | undefined> {
  const entry = await findCriteriaSetEntry(id);
  if (!entry) return undefined;
  const updated: CriteriaSet = {
    ...entry.set,
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.criteria !== undefined ? { criteria: updates.criteria } : {}),
  };
  await writeFile(entry.filePath, JSON.stringify(updated, null, 2), "utf8");
  return updated;
}

export async function deleteCriteriaSet(id: string): Promise<boolean> {
  const entry = await findCriteriaSetEntry(id);
  if (!entry) return false;
  await unlink(entry.filePath);
  return true;
}

/** Only one criteria set can be default at a time; setting one clears any other. */
export async function setDefaultCriteriaSet(id: string, isDefault: boolean): Promise<CriteriaSet | undefined> {
  const entries = await listCriteriaSetEntries();
  let result: CriteriaSet | undefined;
  for (const entry of entries) {
    const shouldBeDefault = entry.set.id === id ? isDefault : false;
    if (entry.set.isDefault === shouldBeDefault) {
      if (entry.set.id === id) result = entry.set;
      continue;
    }
    const updated: CriteriaSet = { ...entry.set, isDefault: shouldBeDefault };
    await writeFile(entry.filePath, JSON.stringify(updated, null, 2), "utf8");
    if (entry.set.id === id) result = updated;
  }
  return result;
}

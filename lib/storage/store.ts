import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { getEvaluationsDir } from "../config";
import { EvaluationRecordSchema, type EvaluationRecord } from "../scoring/schema";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function filenameFor(record: EvaluationRecord): string {
  const stamp = record.createdAt.replace(/[:.]/g, "-");
  return `${stamp}-${slugify(record.company)}.json`;
}

export async function saveEvaluation(record: EvaluationRecord): Promise<string> {
  const dir = getEvaluationsDir();
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filenameFor(record));
  await writeFile(filePath, JSON.stringify(record, null, 2), "utf8");
  return filePath;
}

export interface EvaluationListEntry {
  fileName: string;
  filePath: string;
  record: EvaluationRecord;
}

export async function listEvaluations(): Promise<EvaluationListEntry[]> {
  const dir = getEvaluationsDir();
  let fileNames: string[];
  try {
    fileNames = await readdir(dir);
  } catch {
    return [];
  }

  const entries: EvaluationListEntry[] = [];
  for (const fileName of fileNames.filter((f) => f.endsWith(".json")).sort()) {
    const filePath = path.join(dir, fileName);
    try {
      const raw = await readFile(filePath, "utf8");
      const record = EvaluationRecordSchema.parse(JSON.parse(raw));
      entries.push({ fileName, filePath, record });
    } catch {
      // skip unreadable/corrupt files
    }
  }
  return entries;
}

export type EvaluationSort = "date" | "score";

/** Newest-first for "date"; highest-score-first for "score" (a leaderboard ranking). */
export function sortEvaluationRecords(
  records: EvaluationRecord[],
  sort: EvaluationSort
): EvaluationRecord[] {
  const sorted = [...records];
  if (sort === "score") {
    sorted.sort((a, b) => b.overallScore - a.overallScore);
  } else {
    sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
  return sorted;
}

export async function findEvaluation(idOrFileName: string): Promise<EvaluationListEntry | undefined> {
  const entries = await listEvaluations();
  return entries.find(
    (e) => e.record.id === idOrFileName || e.fileName === idOrFileName || e.fileName.startsWith(idOrFileName)
  );
}

export async function deleteEvaluation(id: string): Promise<boolean> {
  const entry = await findEvaluation(id);
  if (!entry) return false;
  await unlink(entry.filePath);
  return true;
}

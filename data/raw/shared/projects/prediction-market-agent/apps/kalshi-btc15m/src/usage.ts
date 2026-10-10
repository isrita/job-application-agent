import { readdir, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export function weeklyUsedPercentFromRecord(record: unknown): number | null {
  const payload = (record as { payload?: Record<string, unknown> })?.payload;
  const rates = payload?.rate_limits as Record<string, unknown> | undefined;
  if (!rates) return null;
  const rows = Object.entries(rates).flatMap(([name, value]) => {
    if (!value || typeof value !== "object") return [];
    const row = value as Record<string, unknown>;
    const used = Number(row.used_percent);
    const minutes = Number(row.window_minutes);
    return Number.isFinite(used) ? [{ name, used, minutes }] : [];
  });
  const weekly = rows.find((row) => row.minutes >= 7 * 24 * 60) ?? rows.find((row) => /week|secondary/i.test(row.name));
  return weekly?.used ?? null;
}

async function rolloutFiles(directory: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await rolloutFiles(full));
    else if (entry.isFile() && /^rollout-.*\.jsonl$/i.test(entry.name)) found.push(full);
  }
  return found;
}

export async function readWeeklyUsagePercent(sessionsRoot = path.join(os.homedir(), ".codex", "sessions")): Promise<number | null> {
  try {
    const files = await rolloutFiles(sessionsRoot);
    const dated = await Promise.all(files.map(async (file) => ({ file, mtime: (await stat(file)).mtimeMs })));
    const newest = dated.sort((a, b) => b.mtime - a.mtime)[0]?.file;
    if (!newest) return null;
    const lines = (await readFile(newest, "utf8")).trim().split(/\r?\n/).reverse();
    for (const line of lines) {
      try {
        const result = weeklyUsedPercentFromRecord(JSON.parse(line));
        if (result !== null) return result;
      } catch { /* malformed/partial rollout line */ }
    }
    return null;
  } catch {
    return null;
  }
}

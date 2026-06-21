import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import type { SavedAnnotations } from "../types";

const CATEGORIES_FILE = "categories.json";
const INITIATORS_FILE = "initiators.json";
const PROGRESS_DIR = "progress";
const opts = { baseDir: BaseDirectory.AppData } as const;

/**
 * Make sure the app-data directory (and an optional subdir) exists. Tauri's
 * writeTextFile does not create parent dirs, and the base dir may be absent on
 * first run, so we create it here. `recursive` makes re-running a no-op, but we
 * still swallow "already exists" to be safe across platforms.
 */
async function ensureDir(subdir?: string): Promise<void> {
  const path = subdir ?? ".";
  try {
    await mkdir(path, { ...opts, recursive: true });
  } catch {
    // Directory already exists (or a benign race) — ignore.
  }
}

/** Derive a filesystem-safe key from the absolute source path. */
function keyForPath(filePath: string): string {
  // Simple deterministic hash so different files don't collide, plus a readable
  // suffix from the file name to make the folder browsable.
  let hash = 0;
  for (let i = 0; i < filePath.length; i++) {
    hash = (hash * 31 + filePath.charCodeAt(i)) | 0;
  }
  const name = filePath.replace(/\\/g, "/").split("/").pop() ?? "file";
  const safe = name.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 40);
  return `${(hash >>> 0).toString(36)}_${safe}`;
}

// ---- Categories -----------------------------------------------------------

export async function loadCategories(): Promise<string[] | null> {
  try {
    if (!(await exists(CATEGORIES_FILE, opts))) return null;
    const text = await readTextFile(CATEGORIES_FILE, opts);
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.every((c) => typeof c === "string")) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveCategories(categories: string[]): Promise<void> {
  await ensureDir();
  await writeTextFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2), opts);
}

// ---- Initiators -----------------------------------------------------------

export async function loadInitiators(): Promise<string[] | null> {
  try {
    if (!(await exists(INITIATORS_FILE, opts))) return null;
    const text = await readTextFile(INITIATORS_FILE, opts);
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.every((c) => typeof c === "string")) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveInitiators(initiators: string[]): Promise<void> {
  await ensureDir();
  await writeTextFile(INITIATORS_FILE, JSON.stringify(initiators, null, 2), opts);
}

// ---- Per-file annotation progress -----------------------------------------

interface ProgressFile {
  filePath: string;
  annotations: SavedAnnotations;
}

export async function loadProgress(filePath: string): Promise<SavedAnnotations | null> {
  try {
    const path = `${PROGRESS_DIR}/${keyForPath(filePath)}.json`;
    if (!(await exists(path, opts))) return null;
    const text = await readTextFile(path, opts);
    const parsed = JSON.parse(text) as ProgressFile;
    return parsed.annotations ?? null;
  } catch {
    return null;
  }
}

export async function saveProgress(
  filePath: string,
  annotations: SavedAnnotations,
): Promise<void> {
  await ensureDir(PROGRESS_DIR);
  const path = `${PROGRESS_DIR}/${keyForPath(filePath)}.json`;
  const payload: ProgressFile = { filePath, annotations };
  await writeTextFile(path, JSON.stringify(payload), opts);
}

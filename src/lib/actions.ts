import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { Dataset } from "../types";
import { useStore } from "../store";
import { parseCsv, serializeCsv } from "./csv";
import { loadCategories, loadInitiators, loadProgress } from "./storage";

interface ReadResult {
  content: string;
  encoding: string;
}

function fileName(path: string): string {
  return path.replace(/\\/g, "/").split("/").pop() ?? path;
}

/** Read + parse a CSV at the given absolute path and load it into the store. */
export async function loadPath(path: string): Promise<void> {
  const store = useStore.getState();
  try {
    const { content, encoding } = await invoke<ReadResult>("read_csv", { path });
    const { headers, rows, skipped } = parseCsv(content);

    if (rows.length === 0) {
      store.pushToast("В файле не найдено ни одной строки данных.", "error");
      return;
    }

    const dataset: Dataset = {
      filePath: path,
      fileName: fileName(path),
      headers,
      encoding,
      rows,
      skipped,
    };

    // Categories and initiators persist globally across sessions. Both start
    // empty — the user builds the lists by hand; no auto-seeding from the bank.
    const categories = (await loadCategories()) ?? [];
    const initiators = (await loadInitiators()) ?? [];

    store.loadDataset(dataset, categories, initiators);

    // Resume any previously saved annotation progress for this exact file.
    const saved = await loadProgress(path);
    if (saved) {
      store.applySavedAnnotations(saved);
      store.gotoFirstUnannotated();
    }

    const skipMsg = skipped > 0 ? ` · пропущено битых строк: ${skipped}` : "";
    store.pushToast(`Загружено строк: ${rows.length}${skipMsg}`, "success");
  } catch (err) {
    store.pushToast(`Ошибка загрузки: ${String(err)}`, "error");
  }
}

/** Open the native file picker, then load the chosen CSV. */
export async function browseAndLoad(): Promise<void> {
  const selected = await open({
    multiple: false,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (typeof selected === "string") {
    await loadPath(selected);
  }
}

/** Serialize the current dataset and write it to a user-chosen path. */
export async function exportDataset(): Promise<void> {
  const store = useStore.getState();
  const dataset = store.dataset;
  if (!dataset) return;

  const base = dataset.fileName.replace(/\.csv$/i, "");
  const target = await save({
    defaultPath: `${base}_annotated.csv`,
    filters: [{ name: "CSV", extensions: ["csv"] }],
  });
  if (typeof target !== "string") return;

  try {
    const content = serializeCsv(dataset);
    await invoke("write_csv", { path: target, content, encoding: dataset.encoding });
    const exported = dataset.rows.filter((r) => !r.annotation.excluded).length;
    store.pushToast(`Экспортировано строк: ${exported} → ${fileName(target)}`, "success");
  } catch (err) {
    store.pushToast(`Ошибка экспорта: ${String(err)}`, "error");
  }
}

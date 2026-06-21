import { create } from "zustand";
import {
  emptyAnnotation,
  emptyFilters,
  type Annotation,
  type Dataset,
  type Filters,
  type NeedWant,
  type SavedAnnotations,
} from "./types";

type View = "focus" | "list";
type Theme = "dark" | "light";
/** Which text input currently owns focus. Hotkeys are dead unless "none". */
type Editing = "none" | "note" | "search";

interface Toast {
  id: number;
  message: string;
  kind: "success" | "error" | "info";
}

interface UndoEntry {
  rowId: number;
  prev: Annotation;
}

interface AppState {
  dataset: Dataset | null;
  categories: string[];
  initiators: string[];
  current: number;
  filters: Filters;
  view: View;
  theme: Theme;
  editing: Editing;
  showHelp: boolean;
  showCategories: boolean;
  showInitiators: boolean;
  undoStack: UndoEntry[];
  toast: Toast | null;

  // ---- lifecycle
  loadDataset: (dataset: Dataset, savedCategories: string[], savedInitiators: string[]) => void;
  applySavedAnnotations: (saved: SavedAnnotations) => void;
  reset: () => void;

  // ---- navigation
  setCurrent: (index: number) => void;
  next: () => void;
  prev: () => void;
  gotoFirstUnannotated: () => void;

  // ---- annotation
  assignCategoryByIndex: (n: number) => void;
  setTrueCategory: (cat: string) => void;
  assignInitiatorByIndex: (n: number) => void;
  setInitiator: (name: string) => void;
  toggleRecurring: () => void;
  setNeedWant: (value: NeedWant) => void;
  setNote: (note: string) => void;
  excludeAndAdvance: () => void;
  toggleExcluded: () => void;
  confirmAndAdvance: () => void;
  undo: () => void;

  // ---- categories
  addCategory: (name: string) => void;
  renameCategory: (index: number, name: string) => void;
  deleteCategory: (index: number) => void;
  moveCategory: (index: number, dir: -1 | 1) => void;

  // ---- initiators
  addInitiator: (name: string) => void;
  renameInitiator: (index: number, name: string) => void;
  deleteInitiator: (index: number) => void;
  moveInitiator: (index: number, dir: -1 | 1) => void;

  // ---- ui
  setFilters: (patch: Partial<Filters>) => void;
  setView: (view: View) => void;
  toggleTheme: () => void;
  setEditing: (editing: Editing) => void;
  toggleHelp: () => void;
  setShowCategories: (show: boolean) => void;
  setShowInitiators: (show: boolean) => void;
  pushToast: (message: string, kind?: Toast["kind"]) => void;
  clearToast: () => void;
}

let toastSeq = 0;

/** Replace one row's annotation immutably and record the previous value for undo. */
function mutateAnnotation(
  state: AppState,
  rowId: number,
  patch: Partial<Annotation>,
): Partial<AppState> {
  if (!state.dataset) return {};
  const rows = state.dataset.rows;
  const row = rows[rowId];
  if (!row) return {};

  const prev = row.annotation;
  const nextAnnotation: Annotation = { ...prev, ...patch, annotated: true };
  const nextRows = rows.slice();
  nextRows[rowId] = { ...row, annotation: nextAnnotation };

  const undoStack = [...state.undoStack, { rowId, prev }].slice(-50);

  return {
    dataset: { ...state.dataset, rows: nextRows },
    undoStack,
  };
}

export const useStore = create<AppState>((set, get) => ({
  dataset: null,
  categories: [],
  initiators: [],
  current: 0,
  filters: emptyFilters(),
  view: "focus",
  theme: (localStorage.getItem("theme") as Theme) ?? "dark",
  editing: "none",
  showHelp: false,
  showCategories: false,
  showInitiators: false,
  undoStack: [],
  toast: null,

  loadDataset: (dataset, savedCategories, savedInitiators) =>
    set({
      dataset,
      categories: savedCategories,
      initiators: savedInitiators,
      current: 0,
      filters: emptyFilters(),
      view: "focus",
      undoStack: [],
    }),

  applySavedAnnotations: (saved) =>
    set((state) => {
      if (!state.dataset) return {};
      const rows = state.dataset.rows.map((row) => {
        const a = saved[row.id];
        return a ? { ...row, annotation: { ...emptyAnnotation(), ...a } } : row;
      });
      return { dataset: { ...state.dataset, rows } };
    }),

  reset: () =>
    set({ dataset: null, current: 0, undoStack: [], view: "focus", filters: emptyFilters() }),

  setCurrent: (index) =>
    set((state) => {
      if (!state.dataset) return {};
      const max = state.dataset.rows.length - 1;
      return { current: Math.max(0, Math.min(index, max)) };
    }),

  next: () => get().setCurrent(get().current + 1),
  prev: () => get().setCurrent(get().current - 1),

  gotoFirstUnannotated: () =>
    set((state) => {
      if (!state.dataset) return {};
      const idx = state.dataset.rows.findIndex((r) => !r.annotation.annotated);
      return idx >= 0 ? { current: idx } : {};
    }),

  assignCategoryByIndex: (n) => {
    const { categories } = get();
    const cat = categories[n - 1];
    if (cat) get().setTrueCategory(cat);
  },

  setTrueCategory: (cat) =>
    set((state) => mutateAnnotation(state, state.current, { true_category: cat })),

  assignInitiatorByIndex: (n) => {
    const { initiators } = get();
    const name = initiators[n - 1];
    if (name) get().setInitiator(name);
  },

  setInitiator: (name) =>
    set((state) => mutateAnnotation(state, state.current, { initiator: name })),

  toggleRecurring: () =>
    set((state) => {
      if (!state.dataset) return {};
      const cur = state.dataset.rows[state.current]?.annotation.is_recurring ?? false;
      return mutateAnnotation(state, state.current, { is_recurring: !cur });
    }),

  setNeedWant: (value) =>
    set((state) => mutateAnnotation(state, state.current, { need_want: value })),

  setNote: (note) => set((state) => mutateAnnotation(state, state.current, { note })),

  excludeAndAdvance: () =>
    set((state) => {
      const patched = mutateAnnotation(state, state.current, { excluded: true });
      const max = (state.dataset?.rows.length ?? 1) - 1;
      return { ...patched, current: Math.min(state.current + 1, max) };
    }),

  toggleExcluded: () =>
    set((state) => {
      if (!state.dataset) return {};
      const cur = state.dataset.rows[state.current]?.annotation.excluded ?? false;
      return mutateAnnotation(state, state.current, { excluded: !cur });
    }),

  confirmAndAdvance: () =>
    set((state) => {
      const patched = mutateAnnotation(state, state.current, {});
      const max = (state.dataset?.rows.length ?? 1) - 1;
      return { ...patched, current: Math.min(state.current + 1, max) };
    }),

  undo: () =>
    set((state) => {
      if (!state.dataset || state.undoStack.length === 0) return {};
      const entry = state.undoStack[state.undoStack.length - 1];
      const rows = state.dataset.rows.slice();
      const row = rows[entry.rowId];
      if (row) rows[entry.rowId] = { ...row, annotation: entry.prev };
      return {
        dataset: { ...state.dataset, rows },
        undoStack: state.undoStack.slice(0, -1),
        current: entry.rowId,
      };
    }),

  addCategory: (name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed || state.categories.includes(trimmed)) return {};
      return { categories: [...state.categories, trimmed] };
    }),

  renameCategory: (index, name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed) return {};
      const categories = state.categories.slice();
      categories[index] = trimmed;
      return { categories };
    }),

  deleteCategory: (index) =>
    set((state) => ({ categories: state.categories.filter((_, i) => i !== index) })),

  moveCategory: (index, dir) =>
    set((state) => {
      const target = index + dir;
      if (target < 0 || target >= state.categories.length) return {};
      const categories = state.categories.slice();
      [categories[index], categories[target]] = [categories[target], categories[index]];
      return { categories };
    }),

  addInitiator: (name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed || state.initiators.includes(trimmed)) return {};
      return { initiators: [...state.initiators, trimmed] };
    }),

  renameInitiator: (index, name) =>
    set((state) => {
      const trimmed = name.trim();
      if (!trimmed) return {};
      const initiators = state.initiators.slice();
      initiators[index] = trimmed;
      return { initiators };
    }),

  deleteInitiator: (index) =>
    set((state) => ({ initiators: state.initiators.filter((_, i) => i !== index) })),

  moveInitiator: (index, dir) =>
    set((state) => {
      const target = index + dir;
      if (target < 0 || target >= state.initiators.length) return {};
      const initiators = state.initiators.slice();
      [initiators[index], initiators[target]] = [initiators[target], initiators[index]];
      return { initiators };
    }),

  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  setView: (view) => set({ view }),

  toggleTheme: () =>
    set((state) => {
      const theme = state.theme === "dark" ? "light" : "dark";
      localStorage.setItem("theme", theme);
      return { theme };
    }),

  setEditing: (editing) => set({ editing }),
  toggleHelp: () => set((state) => ({ showHelp: !state.showHelp })),
  setShowCategories: (show) => set({ showCategories: show }),
  setShowInitiators: (show) => set({ showInitiators: show }),

  pushToast: (message, kind = "info") => set({ toast: { id: ++toastSeq, message, kind } }),
  clearToast: () => set({ toast: null }),
}));

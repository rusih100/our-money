// Core domain types. No `any` anywhere in the app.

/** A single annotation the user attaches to a transaction row. */
export type NeedWant = "need" | "want" | "saving";

export interface Annotation {
  true_category: string;
  is_recurring: boolean;
  need_want: NeedWant | "";
  note: string;
  annotated: boolean;
}

/** A parsed transaction: the original CSV cells plus our annotation. */
export interface Transaction {
  /** Stable id for this row (index within the file). */
  id: number;
  /** Raw cell values keyed by the original CSV header. Never mutated. */
  raw: Record<string, string>;
  /** Parsed numeric amount of the payment, in the account currency. */
  amount: number;
  annotation: Annotation;
}

/** Everything we need to know about a loaded dataset. */
export interface Dataset {
  /** Absolute path of the source file, used as the persistence key. */
  filePath: string;
  fileName: string;
  /** Original header order, preserved for export. */
  headers: string[];
  /** Detected source encoding, so export round-trips it. */
  encoding: string;
  rows: Transaction[];
  /** How many malformed rows we skipped while parsing. */
  skipped: number;
}

/** The five new columns we append on export, in order. */
export const ANNOTATION_COLUMNS = [
  "true_category",
  "is_recurring",
  "need_want",
  "note",
  "annotated",
] as const;

export function emptyAnnotation(): Annotation {
  return {
    true_category: "",
    is_recurring: false,
    need_want: "",
    note: "",
    annotated: false,
  };
}

/** Persisted-to-disk shape of a single row's annotation (keyed by row id). */
export type SavedAnnotations = Record<number, Annotation>;

/** Filters for the list/review view. */
export interface Filters {
  status: "all" | "annotated" | "unannotated";
  category: string; // "" = any
  needWant: NeedWant | "all";
  recurring: "all" | "yes" | "no";
  query: string; // free text in description
}

export function emptyFilters(): Filters {
  return { status: "all", category: "", needWant: "all", recurring: "all", query: "" };
}

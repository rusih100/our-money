import Papa from "papaparse";
import {
  ANNOTATION_COLUMNS,
  emptyAnnotation,
  type Annotation,
  type Dataset,
  type Transaction,
} from "../types";

/** Columns we prefer for the focused display, when present. */
export const FIELD = {
  description: "Описание",
  payment: "Сумма платежа",
  operation: "Сумма операции",
  category: "Категория",
  paymentDate: "Дата платежа",
  opDate: "Дата операции",
  mcc: "MCC",
  status: "Статус",
} as const;

/**
 * Parse a money string from these bank exports into a number.
 *
 * Handles: comma decimal separator ("-51,00"), thousands grouping with regular
 * spaces, non-breaking ( ), narrow no-break ( ) and thin ( )
 * spaces, and a leading/trailing currency noise. Returns NaN when there is no
 * parseable number so callers can decide how to treat the row.
 */
export function parseAmount(raw: string | undefined): number {
  if (raw == null) return NaN;
  const cleaned = raw
    .replace(/[\s   ]/g, "") // drop all kinds of spaces
    .replace(/−/g, "-") // unicode minus → ascii
    .replace(/,/g, ".") // comma decimal → dot
    .replace(/[^0-9.+-]/g, ""); // strip currency symbols / stray chars
  if (cleaned === "" || cleaned === "-" || cleaned === "+") return NaN;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

/** Pick the best available amount field for a row. */
function rowAmount(raw: Record<string, string>): number {
  const payment = parseAmount(raw[FIELD.payment]);
  if (!Number.isNaN(payment)) return payment;
  return parseAmount(raw[FIELD.operation]);
}

export interface ParseResult {
  headers: string[];
  rows: Transaction[];
  skipped: number;
}

/**
 * Parse the decoded CSV text into transactions. Semicolon-delimited, fully
 * quoted fields. Malformed rows (no parseable header mapping, or empty) are
 * skipped and counted rather than throwing.
 */
export function parseCsv(text: string): ParseResult {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter: ";",
    quoteChar: '"',
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const headers =
    result.meta.fields?.map((f) => f.trim()).filter((f) => f.length > 0) ?? [];

  const rows: Transaction[] = [];
  let skipped = 0;

  for (const raw of result.data) {
    // A usable row must have at least one non-empty original cell.
    const hasContent =
      raw && typeof raw === "object" && Object.values(raw).some((v) => (v ?? "").trim() !== "");
    if (!hasContent) {
      skipped++;
      continue;
    }
    rows.push({
      id: rows.length,
      raw,
      amount: rowAmount(raw),
      annotation: emptyAnnotation(),
    });
  }

  // PapaParse surfaces structural errors too; count ones that dropped data.
  skipped += result.errors.filter((e) => e.code === "TooFewFields" || e.code === "TooManyFields")
    .length;

  return { headers, rows, skipped };
}

/** CSV-quote a single field: wrap in quotes, double any internal quotes. */
function quote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function annotationCell(col: (typeof ANNOTATION_COLUMNS)[number], a: Annotation): string {
  switch (col) {
    case "true_category":
      return a.true_category;
    case "initiator":
      return a.initiator;
    case "is_recurring":
      return a.is_recurring ? "true" : "false";
    case "need_want":
      return a.need_want;
    case "note":
      return a.note;
    case "annotated":
      return a.annotated ? "true" : "false";
  }
}

/**
 * Serialize a dataset back to CSV: original columns first (untouched), then the
 * annotation columns appended. Semicolon delimiter, every field quoted —
 * matching the input style. Original cell values are emitted verbatim, so the
 * comma decimals and formatting round-trip exactly. Rows flagged `excluded`
 * («не учитывать») are dropped entirely.
 */
export function serializeCsv(dataset: Dataset): string {
  const allHeaders = [...dataset.headers, ...ANNOTATION_COLUMNS];
  const lines: string[] = [allHeaders.map(quote).join(";")];

  for (const row of dataset.rows) {
    if (row.annotation.excluded) continue;
    const original = dataset.headers.map((h) => quote(row.raw[h] ?? ""));
    const annotations = ANNOTATION_COLUMNS.map((c) => quote(annotationCell(c, row.annotation)));
    lines.push([...original, ...annotations].join(";"));
  }

  // Windows-style line endings to match typical bank exports.
  return lines.join("\r\n") + "\r\n";
}

/** Dedupe the dataset's existing bank categories, preserving first-seen order. */
export function deriveCategories(rows: Transaction[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const cat = (row.raw[FIELD.category] ?? "").trim();
    if (cat && !seen.has(cat)) {
      seen.add(cat);
      out.push(cat);
    }
  }
  return out;
}

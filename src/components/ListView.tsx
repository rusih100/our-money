import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useStore } from "../store";
import { FIELD } from "../lib/csv";
import { formatAmount, shortDate } from "../lib/format";
import { SummaryPanel } from "./SummaryPanel";
import type { Transaction } from "../types";

const ROW_HEIGHT = 38;

function matches(row: Transaction, f: ReturnType<typeof useStore.getState>["filters"]): boolean {
  const a = row.annotation;
  if (f.status === "annotated" && !a.annotated) return false;
  if (f.status === "unannotated" && a.annotated) return false;
  if (f.category && a.true_category !== f.category) return false;
  if (f.needWant !== "all" && a.need_want !== f.needWant) return false;
  if (f.recurring === "yes" && !a.is_recurring) return false;
  if (f.recurring === "no" && a.is_recurring) return false;
  if (f.query) {
    const hay = (row.raw[FIELD.description] ?? "").toLowerCase();
    if (!hay.includes(f.query.toLowerCase())) return false;
  }
  return true;
}

export function ListView(): React.ReactElement | null {
  const dataset = useStore((s) => s.dataset);
  const filters = useStore((s) => s.filters);
  const categories = useStore((s) => s.categories);
  const current = useStore((s) => s.current);
  const setFilters = useStore((s) => s.setFilters);
  const setCurrent = useStore((s) => s.setCurrent);
  const setView = useStore((s) => s.setView);
  const setEditing = useStore((s) => s.setEditing);

  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () => (dataset ? dataset.rows.filter((r) => matches(r, filters)) : []),
    [dataset, filters],
  );

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  if (!dataset) return null;

  const selectClass =
    "rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs text-fg outline-none focus:border-accent";

  return (
    <div className="flex h-full min-h-0">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          <input
            id="search-field"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            onFocus={() => setEditing("search")}
            onBlur={() => setEditing("none")}
            placeholder="Поиск по описанию…  ( / )"
            className="min-w-[180px] flex-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-fg outline-none focus:border-accent"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as typeof filters.status })}
            className={selectClass}
          >
            <option value="all">Все</option>
            <option value="annotated">Размеченные</option>
            <option value="unannotated">Без разметки</option>
          </select>
          <select
            value={filters.category}
            onChange={(e) => setFilters({ category: e.target.value })}
            className={selectClass}
          >
            <option value="">Любая категория</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filters.needWant}
            onChange={(e) => setFilters({ needWant: e.target.value as typeof filters.needWant })}
            className={selectClass}
          >
            <option value="all">Need/Want: все</option>
            <option value="need">Need</option>
            <option value="want">Want</option>
          </select>
          <select
            value={filters.recurring}
            onChange={(e) => setFilters({ recurring: e.target.value as typeof filters.recurring })}
            className={selectClass}
          >
            <option value="all">Повтор: все</option>
            <option value="yes">Повторяющиеся</option>
            <option value="no">Разовые</option>
          </select>
          <span className="ml-auto text-xs text-fg-faint">{filtered.length} строк</span>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[88px_1fr_110px_130px_130px_120px_56px_56px] gap-2 border-b border-border px-4 py-2 text-xs font-medium text-fg-faint">
          <span>Дата</span>
          <span>Описание</span>
          <span className="text-right">Сумма</span>
          <span>Банк. категория</span>
          <span>Моя категория</span>
          <span>Инициатор</span>
          <span>N/W</span>
          <span className="text-right">Повт.</span>
        </div>

        {/* Virtualized body */}
        <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((vitem) => {
              const row = filtered[vitem.index];
              const a = row.annotation;
              const isCurrent = row.id === current;
              return (
                <div
                  key={row.id}
                  onClick={() => {
                    setCurrent(row.id);
                    setView("focus");
                  }}
                  className={`absolute left-0 right-0 grid cursor-pointer grid-cols-[88px_1fr_110px_130px_130px_120px_56px_56px] items-center gap-2 border-b border-border/60 px-4 text-xs hover:bg-surface ${
                    isCurrent ? "bg-surface" : ""
                  } ${a.excluded ? "text-fg-faint line-through" : ""}`}
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateY(${vitem.start}px)`,
                  }}
                >
                  <span className="text-fg-muted">{shortDate(row.raw[FIELD.paymentDate] || row.raw[FIELD.opDate])}</span>
                  <span className="truncate text-fg" title={row.raw[FIELD.description]}>
                    {a.excluded && <span className="mr-1 text-neg no-underline">✕</span>}
                    {!a.annotated && <span className="mr-1 text-accent">•</span>}
                    {row.raw[FIELD.description] || "—"}
                  </span>
                  <span
                    className={`text-right tabular-nums ${row.amount < 0 ? "text-neg" : row.amount > 0 ? "text-pos" : "text-fg-muted"}`}
                  >
                    {formatAmount(row.amount)}
                  </span>
                  <span className="truncate text-fg-muted" title={row.raw[FIELD.category]}>
                    {row.raw[FIELD.category] || "—"}
                  </span>
                  <span className="truncate text-fg" title={a.true_category}>
                    {a.true_category || <span className="text-fg-faint">—</span>}
                  </span>
                  <span className="truncate text-fg-muted" title={a.initiator}>
                    {a.initiator || <span className="text-fg-faint">—</span>}
                  </span>
                  <span className="uppercase text-fg-muted">{a.need_want || ""}</span>
                  <span className="text-right">{a.is_recurring ? "↻" : ""}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary sidebar */}
      <aside className="w-72 shrink-0 overflow-y-auto border-l border-border bg-bg p-4">
        <SummaryPanel />
      </aside>
    </div>
  );
}

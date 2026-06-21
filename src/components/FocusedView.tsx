import { useStore } from "../store";
import { FIELD } from "../lib/csv";
import { formatAmount, shortDate } from "../lib/format";
import type { NeedWant } from "../types";

const NEED_WANT: { value: NeedWant; label: string; key: string }[] = [
  { value: "need", label: "Need", key: "n" },
  { value: "want", label: "Want", key: "w" },
];

export function FocusedView(): React.ReactElement | null {
  const dataset = useStore((s) => s.dataset);
  const current = useStore((s) => s.current);
  const categories = useStore((s) => s.categories);
  const initiators = useStore((s) => s.initiators);
  const setTrueCategory = useStore((s) => s.setTrueCategory);
  const setInitiator = useStore((s) => s.setInitiator);
  const toggleRecurring = useStore((s) => s.toggleRecurring);
  const setNeedWant = useStore((s) => s.setNeedWant);
  const setNote = useStore((s) => s.setNote);
  const toggleExcluded = useStore((s) => s.toggleExcluded);
  const setEditing = useStore((s) => s.setEditing);
  const setShowCategories = useStore((s) => s.setShowCategories);
  const setShowInitiators = useStore((s) => s.setShowInitiators);

  if (!dataset) return null;
  const row = dataset.rows[current];
  if (!row) return null;

  const a = row.annotation;
  const amount = row.amount;
  const amountColor =
    amount < 0 ? "text-neg" : amount > 0 ? "text-pos" : "text-fg-muted";

  const description = row.raw[FIELD.description] || "(без описания)";
  const bankCategory = row.raw[FIELD.category] || "—";
  const date = shortDate(row.raw[FIELD.paymentDate] || row.raw[FIELD.opDate]);
  const mcc = row.raw[FIELD.mcc] || "—";
  const status = row.raw[FIELD.status] || "";

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-4 px-6 py-6">
      {/* Transaction card */}
      <div className="rounded-xl border border-border bg-surface px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate text-lg font-semibold text-fg" title={description}>
              {description}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
              <span className="rounded bg-surface-2 px-1.5 py-0.5">{bankCategory}</span>
              <span>{date}</span>
              <span>MCC {mcc}</span>
              {status && status !== "OK" && (
                <span className="rounded bg-neg/15 px-1.5 py-0.5 text-neg">{status}</span>
              )}
            </div>
          </div>
          <div className={`shrink-0 text-2xl font-bold tabular-nums ${amountColor}`}>
            {formatAmount(amount)}
          </div>
        </div>
      </div>

      {/* Category selector */}
      <div className="rounded-xl border border-border bg-surface px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-fg-faint">
            Категория
          </span>
          <button
            onClick={() => setShowCategories(true)}
            className="text-xs text-accent hover:underline"
          >
            управлять…
          </button>
        </div>
        {categories.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Список пуст —{" "}
            <button onClick={() => setShowCategories(true)} className="text-accent hover:underline">
              добавьте категории
            </button>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat, i) => {
              const active = a.true_category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setTrueCategory(cat)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm ${
                    active
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface-2 text-fg hover:border-accent"
                  }`}
                >
                  {i < 9 && (
                    <span
                      className={`kbd ${active ? "border-accent-fg/40 bg-transparent text-accent-fg" : ""}`}
                    >
                      {i + 1}
                    </span>
                  )}
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Initiator selector */}
      <div className="rounded-xl border border-border bg-surface px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-fg-faint">
            Инициатор
          </span>
          <button
            onClick={() => setShowInitiators(true)}
            className="text-xs text-accent hover:underline"
          >
            управлять…
          </button>
        </div>
        {initiators.length === 0 ? (
          <p className="text-sm text-fg-muted">
            Список пуст —{" "}
            <button onClick={() => setShowInitiators(true)} className="text-accent hover:underline">
              добавьте инициаторов
            </button>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {initiators.map((name, i) => {
              const active = a.initiator === name;
              return (
                <button
                  key={name}
                  onClick={() => setInitiator(name)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm ${
                    active
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-border bg-surface-2 text-fg hover:border-accent"
                  }`}
                >
                  {i < 9 && (
                    <span
                      className={`kbd ${active ? "border-accent-fg/40 bg-transparent text-accent-fg" : ""}`}
                    >
                      ⇧{i + 1}
                    </span>
                  )}
                  {name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Recurring + need/want */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-faint">
            Повторяющийся <span className="kbd ml-1">r</span>
          </div>
          <button
            onClick={toggleRecurring}
            className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              a.is_recurring
                ? "border-accent bg-accent text-accent-fg"
                : "border-border bg-surface-2 text-fg"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded border ${
                a.is_recurring ? "border-accent-fg bg-accent-fg/20" : "border-fg-faint"
              }`}
            >
              {a.is_recurring && "✓"}
            </span>
            {a.is_recurring ? "Повторяющийся" : "Разовый"}
          </button>
        </div>

        <div className="rounded-xl border border-border bg-surface px-5 py-4">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-faint">
            Need / Want
          </div>
          <div className="flex overflow-hidden rounded-lg border border-border">
            {NEED_WANT.map((opt) => {
              const active = a.need_want === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setNeedWant(opt.value)}
                  className={`flex-1 px-2 py-2 text-sm ${
                    active ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg hover:bg-surface"
                  }`}
                >
                  {opt.label} <span className="kbd ml-1">{opt.key}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exclude flag */}
      <div className="rounded-xl border border-border bg-surface px-5 py-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-faint">
          Не учитывать <span className="kbd ml-1">x</span>
          <span className="ml-2 normal-case text-fg-faint">
            x — пометить и перейти к следующей
          </span>
        </div>
        <button
          onClick={toggleExcluded}
          className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            a.excluded
              ? "border-neg bg-neg/15 text-neg"
              : "border-border bg-surface-2 text-fg"
          }`}
        >
          <span
            className={`flex h-4 w-4 items-center justify-center rounded border ${
              a.excluded ? "border-neg bg-neg/20" : "border-fg-faint"
            }`}
          >
            {a.excluded && "✓"}
          </span>
          {a.excluded ? "Исключена из экспорта" : "Учитывается"}
        </button>
      </div>

      {/* Note */}
      <div className="rounded-xl border border-border bg-surface px-5 py-4">
        <label
          htmlFor="note-field"
          className="mb-2 block text-xs font-medium uppercase tracking-wide text-fg-faint"
        >
          Заметка <span className="kbd ml-1">c</span>
          <span className="ml-2 normal-case text-fg-faint">Esc — назад в режим клавиш</span>
        </label>
        <textarea
          id="note-field"
          value={a.note}
          onChange={(e) => setNote(e.target.value)}
          onFocus={() => setEditing("note")}
          onBlur={() => setEditing("none")}
          rows={2}
          placeholder="Свободный текст…"
          className="w-full resize-none rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </div>

      <div className="text-center text-xs text-fg-faint">
        <span className="kbd">Enter</span> подтвердить и дальше ·{" "}
        <span className="kbd">j</span>/<span className="kbd">k</span> навигация ·{" "}
        <span className="kbd">u</span> отменить · <span className="kbd">?</span> помощь
      </div>
    </div>
  );
}

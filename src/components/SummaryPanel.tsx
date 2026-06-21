import { useMemo } from "react";
import { useStore } from "../store";
import { formatAmount } from "../lib/format";
import type { Transaction } from "../types";

interface Bucket {
  count: number;
  sum: number;
}

function emptyBucket(): Bucket {
  return { count: 0, sum: 0 };
}

/** Live-updating analytical breakdown of the annotated dataset. */
export function SummaryPanel(): React.ReactElement | null {
  const dataset = useStore((s) => s.dataset);

  const stats = useMemo(() => {
    const rows: Transaction[] = dataset?.rows ?? [];
    const needWant: Record<string, Bucket> = {
      need: emptyBucket(),
      want: emptyBucket(),
    };
    const recurring = { yes: emptyBucket(), no: emptyBucket() };
    const byCategory = new Map<string, Bucket>();
    const byInitiator = new Map<string, Bucket>();
    let annotated = 0;
    let excluded = 0;

    for (const r of rows) {
      const a = r.annotation;
      if (a.annotated) annotated++;
      if (a.excluded) excluded++;
      const amt = Number.isNaN(r.amount) ? 0 : r.amount;

      if (a.need_want) {
        needWant[a.need_want].count++;
        needWant[a.need_want].sum += amt;
      }
      const rec = a.is_recurring ? recurring.yes : recurring.no;
      if (a.annotated) {
        rec.count++;
        rec.sum += amt;
      }
      if (a.true_category) {
        const b = byCategory.get(a.true_category) ?? emptyBucket();
        b.count++;
        b.sum += amt;
        byCategory.set(a.true_category, b);
      }
      if (a.initiator) {
        const b = byInitiator.get(a.initiator) ?? emptyBucket();
        b.count++;
        b.sum += amt;
        byInitiator.set(a.initiator, b);
      }
    }

    const categories = [...byCategory.entries()].sort((x, y) => x[1].sum - y[1].sum);
    const initiators = [...byInitiator.entries()].sort((x, y) => x[1].sum - y[1].sum);
    return { total: rows.length, annotated, excluded, needWant, recurring, categories, initiators };
  }, [dataset]);

  if (!dataset) return null;

  return (
    <div className="flex flex-col gap-4 text-sm">
      <Section title="Прогресс">
        <Row label="Размечено" value={`${stats.annotated} / ${stats.total}`} />
        <Row label="Не учитываются" value={`${stats.excluded}`} />
      </Section>

      <Section title="Need / Want">
        {(["need", "want"] as const).map((k) => (
          <Row
            key={k}
            label={k[0].toUpperCase() + k.slice(1)}
            value={`${stats.needWant[k].count}`}
            amount={stats.needWant[k].sum}
          />
        ))}
      </Section>

      <Section title="Повторяемость">
        <Row label="Повторяющиеся" value={`${stats.recurring.yes.count}`} amount={stats.recurring.yes.sum} />
        <Row label="Разовые" value={`${stats.recurring.no.count}`} amount={stats.recurring.no.sum} />
      </Section>

      <Section title="По категориям">
        {stats.categories.length === 0 ? (
          <p className="px-1 py-1 text-xs text-fg-faint">Пока ничего не размечено.</p>
        ) : (
          stats.categories.map(([cat, b]) => (
            <Row key={cat} label={cat} value={`${b.count}`} amount={b.sum} />
          ))
        )}
      </Section>

      <Section title="По инициаторам">
        {stats.initiators.length === 0 ? (
          <p className="px-1 py-1 text-xs text-fg-faint">Пока никого не назначено.</p>
        ) : (
          stats.initiators.map(([name, b]) => (
            <Row key={name} label={name} value={`${b.count}`} amount={b.sum} />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-faint">{title}</div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  amount,
}: {
  label: string;
  value: string;
  amount?: number;
}): React.ReactElement {
  const color = amount == null ? "" : amount < 0 ? "text-neg" : amount > 0 ? "text-pos" : "";
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="min-w-0 truncate text-fg-muted" title={label}>
        {label}
      </span>
      <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
        <span className="text-fg">{value}</span>
        {amount != null && <span className={`text-xs ${color}`}>{formatAmount(amount)}</span>}
      </span>
    </div>
  );
}

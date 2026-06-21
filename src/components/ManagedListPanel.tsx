import { useState } from "react";
import { useStore } from "../store";

interface ManagedListPanelProps {
  show: boolean;
  title: string;
  items: string[];
  placeholder: string;
  /** Подсказка о хоткеях в подвале, например «1–9» или «⇧1–9». */
  hotkeyLabel: string;
  onClose: () => void;
  add: (name: string) => void;
  rename: (index: number, name: string) => void;
  remove: (index: number) => void;
  move: (index: number, dir: -1 | 1) => void;
}

/**
 * Переиспользуемая модалка управления упорядоченным списком (категории,
 * инициаторы). Порядок задаёт хоткеи назначения по позиции. Изменения
 * сохраняются автоматически вызывающей стороной.
 */
export function ManagedListPanel({
  show,
  title,
  items,
  placeholder,
  hotkeyLabel,
  onClose,
  add,
  rename,
  remove,
  move,
}: ManagedListPanelProps): React.ReactElement | null {
  const setEditing = useStore((s) => s.setEditing);
  const [draft, setDraft] = useState("");

  if (!show) return null;

  function submit(): void {
    add(draft);
    setDraft("");
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ background: "var(--overlay)" }}
      onMouseDown={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl border border-border bg-bg shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <button onClick={onClose} className="text-fg-faint hover:text-fg">
            ✕
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => setEditing("search")}
            onBlur={() => setEditing("none")}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder={placeholder}
            className="flex-1 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-sm text-fg outline-none focus:border-accent"
          />
          <button
            onClick={submit}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-fg hover:opacity-90"
          >
            Добавить
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
          {items.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-fg-muted">Список пуст.</p>
          ) : (
            items.map((item, i) => (
              <div
                key={`${item}-${i}`}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface"
              >
                <span className="kbd shrink-0">{i < 9 ? i + 1 : "·"}</span>
                <input
                  defaultValue={item}
                  onFocus={() => setEditing("search")}
                  onBlur={(e) => {
                    setEditing("none");
                    if (e.target.value.trim() && e.target.value !== item) {
                      rename(i, e.target.value);
                    }
                  }}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-2 py-1 text-sm text-fg outline-none hover:border-border focus:border-accent"
                />
                <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded px-1.5 py-1 text-fg-muted hover:bg-surface-2 disabled:opacity-30"
                    title="Вверх"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === items.length - 1}
                    className="rounded px-1.5 py-1 text-fg-muted hover:bg-surface-2 disabled:opacity-30"
                    title="Вниз"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => remove(i)}
                    className="rounded px-1.5 py-1 text-fg-muted hover:bg-surface-2 hover:text-neg"
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border px-5 py-2 text-xs text-fg-faint">
          Порядок задаёт хоткеи {hotkeyLabel}. Изменения сохраняются автоматически.
        </div>
      </div>
    </div>
  );
}

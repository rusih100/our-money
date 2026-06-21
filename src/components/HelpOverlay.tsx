import { useStore } from "../store";

const KEYS: { keys: string[]; desc: string }[] = [
  { keys: ["j", "↓"], desc: "Следующая транзакция" },
  { keys: ["k", "↑"], desc: "Предыдущая транзакция" },
  { keys: ["1", "–", "9"], desc: "Назначить категорию по позиции" },
  { keys: ["r"], desc: "Переключить «повторяющийся»" },
  { keys: ["n"], desc: "Need" },
  { keys: ["w"], desc: "Want" },
  { keys: ["s"], desc: "Saving" },
  { keys: ["c"], desc: "Фокус на заметку (Esc — назад)" },
  { keys: ["Enter"], desc: "Подтвердить и перейти к следующей" },
  { keys: ["u"], desc: "Отменить последнее действие" },
  { keys: ["/"], desc: "Поиск / фильтр по описанию" },
  { keys: ["g", "g"], desc: "К первой неразмеченной" },
  { keys: ["?"], desc: "Показать/скрыть эту шпаргалку" },
  { keys: ["Ctrl", "S"], desc: "Экспорт CSV" },
];

export function HelpOverlay(): React.ReactElement | null {
  const show = useStore((s) => s.showHelp);
  const toggleHelp = useStore((s) => s.toggleHelp);
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: "var(--overlay)" }}
      onMouseDown={toggleHelp}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-bg shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-fg">Горячие клавиши</h2>
          <button onClick={toggleHelp} className="text-fg-faint hover:text-fg">
            ✕
          </button>
        </div>
        <div className="grid grid-cols-1 gap-x-8 gap-y-1.5 px-5 py-4 sm:grid-cols-2">
          {KEYS.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-0.5">
              <span className="text-sm text-fg-muted">{row.desc}</span>
              <span className="flex shrink-0 items-center gap-1">
                {row.keys.map((k, j) =>
                  k === "–" ? (
                    <span key={j} className="text-fg-faint">
                      –
                    </span>
                  ) : (
                    <span key={j} className="kbd">
                      {k}
                    </span>
                  ),
                )}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-border px-5 py-2 text-center text-xs text-fg-faint">
          Клавиши не срабатывают, пока курсор в текстовом поле — нажмите Esc.
        </div>
      </div>
    </div>
  );
}

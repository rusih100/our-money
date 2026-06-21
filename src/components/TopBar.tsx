import { useMemo } from "react";
import { useStore } from "../store";
import { browseAndLoad, exportDataset } from "../lib/actions";

export function TopBar(): React.ReactElement {
  const dataset = useStore((s) => s.dataset);
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.theme);
  const setView = useStore((s) => s.setView);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const toggleHelp = useStore((s) => s.toggleHelp);
  const setShowCategories = useStore((s) => s.setShowCategories);

  const annotated = useMemo(
    () => dataset?.rows.filter((r) => r.annotation.annotated).length ?? 0,
    [dataset],
  );
  const total = dataset?.rows.length ?? 0;
  const pct = total > 0 ? Math.round((annotated / total) * 100) : 0;

  return (
    <header className="flex shrink-0 flex-col border-b border-border bg-bg">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className="text-sm font-semibold text-fg">Our Money</span>
        {dataset && (
          <span className="truncate text-xs text-fg-muted" title={dataset.filePath}>
            · {dataset.fileName}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {dataset && (
            <>
              <div className="mr-1 flex overflow-hidden rounded-lg border border-border text-xs">
                <button
                  onClick={() => setView("focus")}
                  className={`px-3 py-1.5 ${view === "focus" ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg"}`}
                >
                  Карточка
                </button>
                <button
                  onClick={() => setView("list")}
                  className={`px-3 py-1.5 ${view === "list" ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg"}`}
                >
                  Таблица
                </button>
              </div>
              <button
                onClick={() => setShowCategories(true)}
                className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-fg hover:border-accent"
              >
                Категории
              </button>
              <button
                onClick={() => void exportDataset()}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg hover:opacity-90"
                title="Ctrl+S"
              >
                Экспорт
              </button>
            </>
          )}
          <button
            onClick={() => void browseAndLoad()}
            className="rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-xs text-fg hover:border-accent"
          >
            Открыть…
          </button>
          <button
            onClick={toggleTheme}
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-fg hover:border-accent"
            title="Тема"
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button
            onClick={toggleHelp}
            className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-fg hover:border-accent"
            title="Горячие клавиши (?)"
          >
            ?
          </button>
        </div>
      </div>

      {dataset && (
        <div className="flex items-center gap-3 px-4 pb-2">
          <span className="shrink-0 text-xs tabular-nums text-fg-muted">
            {annotated} / {total} размечено
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-fg-faint">{pct}%</span>
        </div>
      )}
    </header>
  );
}

import { useEffect, useState } from "react";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { browseAndLoad, loadPath } from "../lib/actions";

/**
 * Initial drag-and-drop zone. Uses Tauri's native file-drop events (which give
 * us real filesystem paths) plus a Browse button as a fallback.
 */
export function EmptyState(): React.ReactElement {
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void getCurrentWebview()
      .onDragDropEvent((event) => {
        if (event.payload.type === "over" || event.payload.type === "enter") {
          setDragging(true);
        } else if (event.payload.type === "drop") {
          setDragging(false);
          const path = event.payload.paths.find((p) => p.toLowerCase().endsWith(".csv"));
          if (path) void loadPath(path);
        } else {
          setDragging(false);
        }
      })
      .then((fn) => {
        unlisten = fn;
      });
    return () => unlisten?.();
  }, []);

  return (
    <div className="flex h-full items-center justify-center p-8">
      <div
        className={`flex w-full max-w-xl flex-col items-center gap-5 rounded-xl border-2 border-dashed px-10 py-16 text-center ${
          dragging ? "border-accent bg-surface" : "border-border"
        }`}
      >
        <div className="text-fg-faint">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
            <path d="M12 11v6M9.5 13.5 12 11l2.5 2.5" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-semibold text-fg">Перетащите CSV-файл сюда</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Банковская выписка (разделитель «;», UTF-8 или Windows-1251)
          </p>
        </div>
        <button
          onClick={() => void browseAndLoad()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-fg hover:opacity-90"
        >
          Выбрать файл…
        </button>
        <p className="text-xs text-fg-faint">
          Нажмите <span className="kbd">?</span> в любой момент — список горячих клавиш
        </p>
      </div>
    </div>
  );
}

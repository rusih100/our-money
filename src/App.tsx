import { useEffect, useRef } from "react";
import { useStore } from "./store";
import { useHotkeys } from "./hooks/useHotkeys";
import { saveCategories, saveProgress } from "./lib/storage";
import type { SavedAnnotations } from "./types";
import { TopBar } from "./components/TopBar";
import { EmptyState } from "./components/EmptyState";
import { FocusedView } from "./components/FocusedView";
import { ListView } from "./components/ListView";
import { CategoryPanel } from "./components/CategoryPanel";
import { HelpOverlay } from "./components/HelpOverlay";
import { Toast } from "./components/Toast";
import "./styles.css";

function App(): React.ReactElement {
  const dataset = useStore((s) => s.dataset);
  const view = useStore((s) => s.view);
  const theme = useStore((s) => s.theme);
  const categories = useStore((s) => s.categories);

  useHotkeys();

  // Apply the theme class to <html>.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Persist the category list whenever it changes (skip the initial mount).
  const catLoaded = useRef(false);
  useEffect(() => {
    if (!catLoaded.current) {
      catLoaded.current = true;
      return;
    }
    void saveCategories(categories);
  }, [categories]);

  // Debounced autosave of annotation progress, keyed to the loaded file.
  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!dataset) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const saved: SavedAnnotations = {};
      for (const row of dataset.rows) {
        if (row.annotation.annotated) saved[row.id] = row.annotation;
      }
      void saveProgress(dataset.filePath, saved);
    }, 600);
    return () => window.clearTimeout(saveTimer.current);
  }, [dataset]);

  return (
    <div className="flex h-screen flex-col bg-bg text-fg">
      <TopBar />
      <main className="min-h-0 flex-1 overflow-hidden">
        {!dataset ? (
          <EmptyState />
        ) : view === "focus" ? (
          <div className="h-full overflow-y-auto">
            <FocusedView />
          </div>
        ) : (
          <ListView />
        )}
      </main>
      <CategoryPanel />
      <HelpOverlay />
      <Toast />
    </div>
  );
}

export default App;

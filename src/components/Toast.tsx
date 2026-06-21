import { useEffect } from "react";
import { useStore } from "../store";

export function Toast(): React.ReactElement | null {
  const toast = useStore((s) => s.toast);
  const clearToast = useStore((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3500);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  const accent =
    toast.kind === "success"
      ? "border-pos text-pos"
      : toast.kind === "error"
        ? "border-neg text-neg"
        : "border-accent text-accent";

  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
      <div
        className={`pointer-events-auto rounded-lg border bg-surface px-4 py-2.5 text-sm text-fg shadow-lg ${accent}`}
      >
        {toast.message}
      </div>
    </div>
  );
}

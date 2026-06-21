import { useEffect, useRef } from "react";
import { useStore } from "../store";
import { exportDataset } from "../lib/actions";

/** Is the event currently targeting an editable element? */
function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

function focusById(id: string): void {
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) el.focus();
}

/**
 * Global keyboard handler. The cardinal rule: when a text field is focused,
 * typing must never trigger a hotkey — only Escape is honored (to blur back
 * into hotkey mode). Everything else is live only when nothing editable holds
 * focus.
 */
export function useHotkeys(): void {
  // Tracks the pending leading "g" for the "g g" sequence.
  const lastG = useRef<number>(0);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      const s = useStore.getState();
      const editing = isEditable(e.target) || s.editing !== "none";

      // Escape always works: close overlays / blur inputs back to hotkey mode.
      if (e.key === "Escape") {
        if (s.showHelp) s.toggleHelp();
        else if (s.showCategories) s.setShowCategories(false);
        if (e.target instanceof HTMLElement) e.target.blur();
        s.setEditing("none");
        return;
      }

      // Export works regardless of focus.
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        if (s.dataset) void exportDataset();
        return;
      }

      // While typing, let everything else through to the field.
      if (editing) return;

      // From here down: hotkey mode (no text field focused).
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!s.dataset) {
        if (e.key === "?") {
          e.preventDefault();
          s.toggleHelp();
        }
        return;
      }

      // Category by position: keys 1..9.
      if (/^[1-9]$/.test(e.key)) {
        e.preventDefault();
        s.assignCategoryByIndex(Number(e.key));
        return;
      }

      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          s.next();
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          s.prev();
          break;
        case "r":
          e.preventDefault();
          s.toggleRecurring();
          break;
        case "n":
          e.preventDefault();
          s.setNeedWant("need");
          break;
        case "w":
          e.preventDefault();
          s.setNeedWant("want");
          break;
        case "s":
          e.preventDefault();
          s.setNeedWant("saving");
          break;
        case "c":
          e.preventDefault();
          s.setView("focus");
          s.setEditing("note");
          // Focus after the view paints.
          requestAnimationFrame(() => focusById("note-field"));
          break;
        case "Enter":
          e.preventDefault();
          s.confirmAndAdvance();
          break;
        case "u":
          e.preventDefault();
          s.undo();
          break;
        case "/":
          e.preventDefault();
          s.setView("list");
          s.setEditing("search");
          requestAnimationFrame(() => focusById("search-field"));
          break;
        case "g": {
          e.preventDefault();
          const now = Date.now();
          if (now - lastG.current < 500) {
            s.gotoFirstUnannotated();
            lastG.current = 0;
          } else {
            lastG.current = now;
          }
          break;
        }
        case "?":
          e.preventDefault();
          s.toggleHelp();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

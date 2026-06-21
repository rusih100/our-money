import { useStore } from "../store";
import { ManagedListPanel } from "./ManagedListPanel";

/** Modal for managing the category list. Order maps to the 1–9 hotkeys. */
export function CategoryPanel(): React.ReactElement | null {
  const show = useStore((s) => s.showCategories);
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const renameCategory = useStore((s) => s.renameCategory);
  const deleteCategory = useStore((s) => s.deleteCategory);
  const moveCategory = useStore((s) => s.moveCategory);
  const setShowCategories = useStore((s) => s.setShowCategories);

  return (
    <ManagedListPanel
      show={show}
      title="Категории"
      items={categories}
      placeholder="Новая категория…"
      hotkeyLabel="1–9"
      onClose={() => setShowCategories(false)}
      add={addCategory}
      rename={renameCategory}
      remove={deleteCategory}
      move={moveCategory}
    />
  );
}

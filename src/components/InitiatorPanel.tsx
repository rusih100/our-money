import { useStore } from "../store";
import { ManagedListPanel } from "./ManagedListPanel";

/** Modal for managing the initiator list. Order maps to the ⇧1–9 hotkeys. */
export function InitiatorPanel(): React.ReactElement | null {
  const show = useStore((s) => s.showInitiators);
  const initiators = useStore((s) => s.initiators);
  const addInitiator = useStore((s) => s.addInitiator);
  const renameInitiator = useStore((s) => s.renameInitiator);
  const deleteInitiator = useStore((s) => s.deleteInitiator);
  const moveInitiator = useStore((s) => s.moveInitiator);
  const setShowInitiators = useStore((s) => s.setShowInitiators);

  return (
    <ManagedListPanel
      show={show}
      title="Инициаторы"
      items={initiators}
      placeholder="Новый инициатор…"
      hotkeyLabel="⇧1–9"
      onClose={() => setShowInitiators(false)}
      add={addInitiator}
      rename={renameInitiator}
      remove={deleteInitiator}
      move={moveInitiator}
    />
  );
}

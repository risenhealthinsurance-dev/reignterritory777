import type { Account } from "../data/accounts";

interface FieldActionSheetProps {
  account: Account;
  onCall: () => void;
  onSchedule: () => void;
  onDisposition: () => void;
}

export function FieldActionSheet({ account, onCall, onSchedule, onDisposition }: FieldActionSheetProps) {
  return (
    <section className="field-action-sheet" aria-label={`Actions for ${account.name}`}>
      <div className="field-action-sheet__handle" aria-hidden="true" />
      <div className="field-action-sheet__assistant" aria-hidden="true">●</div>
      <p>How can I help on this stop?</p>
      <div className="field-action-sheet__actions">
        <button aria-label={`Call ${account.name}`} onClick={onCall}><span aria-hidden="true">⌕</span><strong>Call</strong></button>
        <button aria-label={`Schedule ${account.name}`} onClick={onSchedule}><span aria-hidden="true">▣</span><strong>Schedule</strong></button>
        <button aria-label={`Set disposition for ${account.name}`} onClick={onDisposition}><span aria-hidden="true">▤</span><strong>Disposition</strong></button>
      </div>
    </section>
  );
}

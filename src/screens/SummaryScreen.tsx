import { useMemo, useState } from "react";
import { accounts } from "../data/accounts";
import { getSyncQueue } from "../domain/repDay";
import type { CorrectionInput, RepDay, StopResolutionInput } from "../domain/repDay";

interface SummaryScreenProps {
  day: RepDay;
  isOffline?: boolean;
  onResolveStop: (accountId: string, resolution: StopResolutionInput) => void;
  onSync: () => void;
  onCloseDay: (isOffline: boolean) => void;
  onSendToManager: (summary: string) => void;
  onRecordCorrection: (correction: CorrectionInput) => void;
}

function nameFor(accountId: string) {
  return accounts.find((account) => account.id === accountId)?.name ?? accountId;
}

export function SummaryScreen({ day, isOffline = false, onResolveStop, onSync, onCloseDay, onSendToManager, onRecordCorrection }: SummaryScreenProps) {
  const [managerReviewOpen, setManagerReviewOpen] = useState(false);
  const [managerSent, setManagerSent] = useState(false);
  const [correctionAccountId, setCorrectionAccountId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [closeReasonFor, setCloseReasonFor] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const unfinished = day.stops.filter((stop) => stop.resolution === "unresolved");
  const unsynced = getSyncQueue(day);
  const completed = day.stops.filter((stop) => stop.resolution === "completed");
  const summary = useMemo(() => {
    const resolved = day.stops.length - unfinished.length;
    return `Fort Pierce 34950 field day: ${completed.length} visits completed; ${resolved} of ${day.stops.length} stops resolved. ${unsynced.length} record${unsynced.length === 1 ? "" : "s"} still waiting to sync. Priority handoff: follow through on every dated next action.`;
  }, [completed.length, day.stops.length, unfinished.length, unsynced.length]);

  return (
    <section className="screen" aria-labelledby="summary-title">
      <header className="screen-header">
        <div className="title-row"><div><div className="eyebrow">● CLOSEOUT & HANDOFF</div><h1 id="summary-title">Day Summary</h1></div><span className="tag">Fort Pierce 34950</span></div>
        <div className="metric-grid four summary-metrics">
          <div className="metric"><strong>{completed.length}</strong><span>VISITED</span></div>
          <div className="metric"><strong data-metric="unfinished">{unfinished.length}</strong><span>UNFINISHED</span></div>
          <div className="metric"><strong data-metric="unsynced">{unsynced.length}</strong><span>UNSYNCED</span></div>
          <div className="metric"><strong>{day.corrections.length}</strong><span>CORRECTIONS</span></div>
        </div>
        {day.closeoutSyncState === "closed_on_device" && <div className="closeout-state warning-state"><strong>Closed on this device</strong><span>Fully synced after connectivity returns.</span></div>}
        {day.closeoutSyncState === "fully_synced" && <div className="closeout-state success-state"><strong>Day closed and fully synced</strong><span>Any later correction will be added to the audit trail.</span></div>}
      </header>

      <div className="screen-scroll">
        <section className="summary-section" aria-labelledby="unfinished-title">
          <div className="section-heading"><div><div className="eyebrow">REVIEW CHECKPOINT</div><h2 id="unfinished-title">Resolve every unfinished stop</h2></div><span>{unfinished.length}</span></div>
          {unfinished.length === 0 ? <div className="success-banner">Every stop has a clear next home.</div> : <div className="stack compact">{unfinished.map((stop) => <article className="resolution-card" key={stop.accountId}><div><strong>{nameFor(stop.accountId)}</strong><small>{stop.status === "failed" ? "Visit failed · choose recovery" : "Not worked · choose disposition"}</small></div><div className="resolution-actions"><button onClick={() => onResolveStop(stop.accountId, { kind: "tomorrow" })}>Move to tomorrow</button><button onClick={() => onResolveStop(stop.accountId, { kind: "territory_pool" })}>Return to territory pool</button><button onClick={() => onResolveStop(stop.accountId, { kind: "reloop", date: "2026-10-05" })}>Reloop Oct 5</button><button onClick={() => setCloseReasonFor(stop.accountId)}>Close with reason</button></div>{closeReasonFor === stop.accountId && <div className="inline-reason"><label htmlFor={`reason-${stop.accountId}`}>Close reason</label><input id={`reason-${stop.accountId}`} value={closeReason} onChange={(event) => setCloseReason(event.target.value)} /><button disabled={!closeReason.trim()} onClick={() => { onResolveStop(stop.accountId, { kind: "closed", reason: closeReason.trim() }); setCloseReasonFor(null); setCloseReason(""); }}>Confirm close</button></div>}</article>)}</div>}
        </section>

        <section className="summary-section" aria-labelledby="sync-title">
          <div className="section-heading"><div><div className="eyebrow">DEVICE & SERVER</div><h2 id="sync-title">Sync queue</h2></div><span>{unsynced.length}</span></div>
          <p className="section-copy">Unfinished work is a planning decision. Unsynced work is already recorded locally and only needs transport.</p>
          {unsynced.map((stop) => <div className="sync-row" key={stop.accountId}><div><strong>{nameFor(stop.accountId)}</strong><small>{stop.syncStatus.replace("_", " ")}</small></div><span>{stop.syncStatus.toUpperCase()}</span></div>)}
          {unsynced.length > 0 && <button className="secondary-button full-button" onClick={onSync} disabled={isOffline}>{isOffline ? "Sync when online" : "Sync now"}</button>}
        </section>

        <section className="summary-section" aria-labelledby="handoff-title">
          <div className="eyebrow">AI-DRAFTED · REP-CONTROLLED</div><h2 id="handoff-title">Manager handoff</h2>
          <textarea aria-label="Manager summary draft" value={summary} readOnly rows={5} />
          {managerSent ? <div className="success-banner">Summary sent after your review.</div> : <button className="secondary-button full-button" onClick={() => setManagerReviewOpen(true)}>Review manager summary</button>}
        </section>

        {day.closedAt && <section className="summary-section" aria-labelledby="corrections-title"><div className="eyebrow">AUDITED AFTER CLOSE</div><h2 id="corrections-title">Corrections</h2><p className="section-copy">The original value stays in history. Every change records what changed, why, and when.</p>{completed.map((stop) => <button className="correction-row" key={stop.accountId} onClick={() => setCorrectionAccountId(stop.accountId)}>Correct {nameFor(stop.accountId)}<span>›</span></button>)}{day.corrections.map((correction) => <div className="audit-row" key={correction.id}><strong>{nameFor(correction.accountId)}</strong><span>{correction.before} → {correction.after}</span><small>{correction.reason}</small></div>)}</section>}
      </div>

      {!day.closedAt && <footer className="screen-footer"><button className="primary-button" disabled={unfinished.length > 0} onClick={() => onCloseDay(isOffline)}>Close day{isOffline ? " on this device" : ""}</button>{unfinished.length > 0 && <p className="footer-hint">Resolve {unfinished.length} unfinished stop{unfinished.length === 1 ? "" : "s"} before closing.</p>}</footer>}

      {managerReviewOpen && <div className="modal-backdrop"><section className="review-dialog" role="dialog" aria-modal="true" aria-label="Review manager handoff"><div className="eyebrow">FINAL REP REVIEW</div><h2>Send manager handoff?</h2><dl><div><dt>Destination</dt><dd>Territory manager · end-of-day handoff</dd></div><div><dt>Content</dt><dd>{summary}</dd></div></dl><p>This draft is not sent until you approve it.</p><div className="two-actions"><button className="secondary-button" onClick={() => setManagerReviewOpen(false)}>Keep editing</button><button className="primary-button" onClick={() => { onSendToManager(summary); setManagerSent(true); setManagerReviewOpen(false); }}>Send summary</button></div></section></div>}

      {correctionAccountId && <div className="modal-backdrop"><section className="review-dialog" role="dialog" aria-modal="true" aria-label="Record correction"><div className="eyebrow">AUDITED CORRECTION</div><h2>Correct {nameFor(correctionAccountId)}</h2><dl><div><dt>Field</dt><dd>Next action</dd></div><div><dt>Before</dt><dd>{day.stops.find((stop) => stop.accountId === correctionAccountId)?.nextAction || "No next action recorded"}</dd></div><div><dt>After</dt><dd>Manager-confirmed follow-up</dd></div></dl><label className="field-label" htmlFor="correction-reason">Correction reason</label><textarea id="correction-reason" value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} rows={3} /><div className="two-actions"><button className="secondary-button" onClick={() => setCorrectionAccountId(null)}>Cancel</button><button className="primary-button" disabled={!correctionReason.trim()} onClick={() => { const stop = day.stops.find((candidate) => candidate.accountId === correctionAccountId); onRecordCorrection({ accountId: correctionAccountId, field: "nextAction", before: stop?.nextAction || "No next action recorded", after: "Manager-confirmed follow-up", reason: correctionReason.trim() }); setCorrectionAccountId(null); setCorrectionReason(""); }}>Record audited correction</button></div></section></div>}
    </section>
  );
}

import { useState } from "react";
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
  onManagerDraftChange?: (summary: string) => void;
  onRecordCorrection: (correction: CorrectionInput) => void;
}

function nameFor(accountId: string) {
  return accounts.find((account) => account.id === accountId)?.name ?? accountId;
}

export function SummaryScreen({
  day,
  isOffline = false,
  onResolveStop,
  onSync,
  onCloseDay,
  onSendToManager,
  onManagerDraftChange,
  onRecordCorrection,
}: SummaryScreenProps) {
  const [managerReviewOpen, setManagerReviewOpen] = useState(false);
  const [correctionAccountId, setCorrectionAccountId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionAfter, setCorrectionAfter] = useState("");
  const [closeReasonFor, setCloseReasonFor] = useState<string | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const [reloopDates, setReloopDates] = useState<Record<string, string>>({});
  const [recordFilter, setRecordFilter] = useState<"completed" | "followups" | "reloops">(
    "completed",
  );
  const unfinished = day.stops.filter((stop) => stop.resolution === "unresolved");
  const unsynced = getSyncQueue(day);
  const completed = day.stops.filter((stop) => stop.resolution === "completed");
  const resolved = day.stops.length - unfinished.length;
  const followUps = day.stops.filter((stop) => stop.followUpDate);
  const reloops = day.stops.filter((stop) => stop.resolution === "reloop");
  const filteredRecords =
    recordFilter === "completed" ? completed : recordFilter === "followups" ? followUps : reloops;
  const nonCommitmentUnfinished = unfinished.filter((stop) => !stop.hardCommitment);
  const hardCommitmentUnfinished = unfinished.filter((stop) => stop.hardCommitment);

  return (
    <section className="screen" aria-labelledby="summary-title">
      <header className="screen-header">
        <div className="title-row">
          <div>
            <div className="eyebrow">● CLOSEOUT & HANDOFF</div>
            <h1 id="summary-title">Day Summary</h1>
          </div>
          <span className="tag">Fort Pierce 34950</span>
        </div>
        <div className="metric-grid four summary-metrics">
          <div className="metric">
            <strong>{completed.length}</strong>
            <span>VISITED</span>
          </div>
          <div className="metric">
            <strong data-metric="unfinished">{unfinished.length}</strong>
            <span>UNFINISHED</span>
          </div>
          <div className="metric">
            <strong data-metric="unsynced">{unsynced.length}</strong>
            <span>UNSYNCED</span>
          </div>
          <div className="metric">
            <strong>{day.corrections.length}</strong>
            <span>CORRECTIONS</span>
          </div>
        </div>
        {day.closeoutSyncState === "closed_on_device" && (
          <div className="closeout-state warning-state">
            <strong>Closed on this device</strong>
            <span>Fully synced after connectivity returns.</span>
          </div>
        )}
        {day.closeoutSyncState === "fully_synced" && (
          <div className="closeout-state success-state">
            <strong>Day closed and fully synced</strong>
            <span>Any later correction will be added to the audit trail.</span>
          </div>
        )}
      </header>

      <div className="screen-scroll">
        <section className="summary-section" aria-labelledby="unfinished-title">
          <div className="section-heading">
            <div>
              <div className="eyebrow">REVIEW CHECKPOINT</div>
              <h2 id="unfinished-title">Resolve every unfinished stop</h2>
            </div>
            <span>{unfinished.length}</span>
          </div>
          {unfinished.length === 0 ? (
            <div className="success-banner">Every stop has a clear next home.</div>
          ) : (
            <>
              {hardCommitmentUnfinished.length > 0 && (
                <p className="warning">
                  ⚠ {hardCommitmentUnfinished.length} protected commitment
                  {hardCommitmentUnfinished.length === 1 ? " requires" : "s require"} individual
                  confirmation.
                </p>
              )}
              {nonCommitmentUnfinished.length > 1 && (
                <button
                  className="secondary-button full-button"
                  onClick={() =>
                    nonCommitmentUnfinished.forEach((stop) =>
                      onResolveStop(stop.accountId, { kind: "tomorrow" }),
                    )
                  }
                >
                  Move {nonCommitmentUnfinished.length} non-commitments to tomorrow
                </button>
              )}
              <div className="stack compact">
                {unfinished.map((stop) => (
                  <article className="resolution-card" key={stop.accountId}>
                    <div>
                      <strong>{nameFor(stop.accountId)}</strong>
                      <small>
                        {stop.status === "failed"
                          ? "Visit failed · choose recovery"
                          : "Not worked · choose disposition"}
                      </small>
                    </div>
                    <div className="resolution-actions">
                      <button onClick={() => onResolveStop(stop.accountId, { kind: "tomorrow" })}>
                        Move to tomorrow
                      </button>
                      <button
                        onClick={() => onResolveStop(stop.accountId, { kind: "territory_pool" })}
                      >
                        Return to territory pool
                      </button>
                      <label className="field-label" htmlFor={`reloop-${stop.accountId}`}>
                        Reloop date
                      </label>
                      <input
                        id={`reloop-${stop.accountId}`}
                        type="date"
                        min="2026-10-05"
                        value={reloopDates[stop.accountId] ?? "2026-10-05"}
                        onChange={(event) =>
                          setReloopDates((current) => ({
                            ...current,
                            [stop.accountId]: event.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={() =>
                          onResolveStop(stop.accountId, {
                            kind: "reloop",
                            date: reloopDates[stop.accountId] ?? "2026-10-05",
                          })
                        }
                      >
                        Confirm reloop
                      </button>
                      <button onClick={() => setCloseReasonFor(stop.accountId)}>
                        Close with reason
                      </button>
                    </div>
                    {closeReasonFor === stop.accountId && (
                      <div className="inline-reason">
                        <label htmlFor={`reason-${stop.accountId}`}>Close reason</label>
                        <input
                          id={`reason-${stop.accountId}`}
                          value={closeReason}
                          onChange={(event) => setCloseReason(event.target.value)}
                        />
                        <button
                          disabled={!closeReason.trim()}
                          onClick={() => {
                            onResolveStop(stop.accountId, {
                              kind: "closed",
                              reason: closeReason.trim(),
                            });
                            setCloseReasonFor(null);
                            setCloseReason("");
                          }}
                        >
                          Confirm close
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </section>

        <section className="summary-section" aria-labelledby="records-title">
          <div className="eyebrow">VISIT RECORDS</div>
          <h2 id="records-title">Review by category</h2>
          <div className="resolution-actions" role="tablist" aria-label="Summary categories">
            <button onClick={() => setRecordFilter("completed")}>
              Completed ({completed.length})
            </button>
            <button onClick={() => setRecordFilter("followups")}>
              Follow-ups ({followUps.length})
            </button>
            <button onClick={() => setRecordFilter("reloops")}>Reloops ({reloops.length})</button>
          </div>
          {filteredRecords.length === 0 ? (
            <p className="section-copy">No records in this category.</p>
          ) : (
            filteredRecords.map((stop) => (
              <div className="sync-row" key={stop.accountId}>
                <strong>{nameFor(stop.accountId)}</strong>
                <span>{stop.resolution.replace("_", " ").toUpperCase()}</span>
              </div>
            ))
          )}
        </section>

        <section className="summary-section" aria-labelledby="sync-title">
          <div className="section-heading">
            <div>
              <div className="eyebrow">DEVICE & SERVER</div>
              <h2 id="sync-title">Sync queue</h2>
            </div>
            <span>{unsynced.length}</span>
          </div>
          <p className="section-copy">
            Unfinished work is a planning decision. Unsynced work is already recorded locally and
            only needs transport.
          </p>
          {unsynced.map((stop) => (
            <div className="sync-row" key={stop.accountId}>
              <div>
                <strong>{nameFor(stop.accountId)}</strong>
                <small>
                  {stop.syncStatus.replace("_", " ")}
                  {stop.mutatedAt ? ` · ${stop.mutatedAt.toLocaleTimeString()}` : ""}
                </small>
              </div>
              <span>{stop.syncStatus.toUpperCase()}</span>
            </div>
          ))}
          {unsynced.length > 0 && (
            <button className="secondary-button full-button" onClick={onSync} disabled={isOffline}>
              {isOffline ? "Sync when online" : "Sync now"}
            </button>
          )}
        </section>

        <section className="summary-section" aria-labelledby="handoff-title">
          <div className="eyebrow">AI-DRAFTED · REP-CONTROLLED</div>
          <h2 id="handoff-title">Manager handoff</h2>
          <textarea
            aria-label="Manager summary draft"
            value={day.managerSummaryDraft}
            onChange={(event) => onManagerDraftChange?.(event.target.value)}
            rows={5}
          />
          {day.managerSummarySentAt ? (
            <div className="success-banner">Summary sent after your review.</div>
          ) : (
            <button
              className="secondary-button full-button"
              onClick={() => setManagerReviewOpen(true)}
              disabled={!day.closedAt}
            >
              {day.closedAt ? "Review manager summary" : "Close day before manager handoff"}
            </button>
          )}
        </section>

        {day.closedAt && (
          <section className="summary-section" aria-labelledby="corrections-title">
            <div className="eyebrow">AUDITED AFTER CLOSE</div>
            <h2 id="corrections-title">Corrections</h2>
            <p className="section-copy">
              The original value stays in history. Every change records what changed, why, and when.
            </p>
            {completed.map((stop) => (
              <button
                className="correction-row"
                key={stop.accountId}
                onClick={() => setCorrectionAccountId(stop.accountId)}
              >
                Correct {nameFor(stop.accountId)}
                <span>›</span>
              </button>
            ))}
            {day.corrections.map((correction) => (
              <div className="audit-row" key={correction.id}>
                <strong>{nameFor(correction.accountId)}</strong>
                <span>
                  {correction.before} → {correction.after}
                </span>
                <small>
                  {correction.reason} · {correction.author} ·{" "}
                  {correction.correctedAt.toLocaleString()}
                  {correction.requiresManagerReview ? " · Manager review required" : ""}
                </small>
              </div>
            ))}
          </section>
        )}
      </div>

      {!day.closedAt && (
        <footer className="screen-footer">
          <button
            className="primary-button"
            disabled={unfinished.length > 0}
            onClick={() => onCloseDay(isOffline)}
          >
            Close day{isOffline ? " on this device" : ""}
          </button>
          {unfinished.length > 0 && (
            <p className="footer-hint">
              Resolve {unfinished.length} unfinished stop{unfinished.length === 1 ? "" : "s"} before
              closing.
            </p>
          )}
        </footer>
      )}

      {managerReviewOpen && (
        <div className="modal-backdrop">
          <section
            className="review-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Review manager handoff"
          >
            <div className="eyebrow">FINAL REP REVIEW</div>
            <h2>Send manager handoff?</h2>
            <dl>
              <div>
                <dt>Destination</dt>
                <dd>Territory manager · end-of-day handoff</dd>
              </div>
              <div>
                <dt>Content</dt>
                <dd>{day.managerSummaryDraft}</dd>
              </div>
            </dl>
            <p>This draft is not sent until you approve it.</p>
            <div className="two-actions">
              <button
                autoFocus
                className="secondary-button"
                onClick={() => setManagerReviewOpen(false)}
              >
                Keep editing
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  onSendToManager(day.managerSummaryDraft);
                  setManagerReviewOpen(false);
                }}
              >
                Send summary
              </button>
            </div>
          </section>
        </div>
      )}

      {correctionAccountId && (
        <div className="modal-backdrop">
          <section
            className="review-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Record correction"
          >
            <div className="eyebrow">AUDITED CORRECTION</div>
            <h2>Correct {nameFor(correctionAccountId)}</h2>
            <dl>
              <div>
                <dt>Field</dt>
                <dd>Next action</dd>
              </div>
              <div>
                <dt>Before</dt>
                <dd>
                  {day.stops.find((stop) => stop.accountId === correctionAccountId)?.nextAction ||
                    "No next action recorded"}
                </dd>
              </div>
              <div>
                <dt>After</dt>
                <dd>{correctionAfter || "Enter the corrected value below"}</dd>
              </div>
            </dl>
            <label className="field-label" htmlFor="correction-after">
              Corrected next action
            </label>
            <input
              id="correction-after"
              value={correctionAfter}
              onChange={(event) => setCorrectionAfter(event.target.value)}
            />
            <label className="field-label" htmlFor="correction-reason">
              Correction reason
            </label>
            <textarea
              id="correction-reason"
              value={correctionReason}
              onChange={(event) => setCorrectionReason(event.target.value)}
              rows={3}
            />
            <div className="two-actions">
              <button className="secondary-button" onClick={() => setCorrectionAccountId(null)}>
                Cancel
              </button>
              <button
                className="primary-button"
                disabled={!correctionReason.trim() || !correctionAfter.trim()}
                onClick={() => {
                  const stop = day.stops.find(
                    (candidate) => candidate.accountId === correctionAccountId,
                  );
                  onRecordCorrection({
                    accountId: correctionAccountId,
                    field: "nextAction",
                    before: stop?.nextAction || "No next action recorded",
                    after: correctionAfter.trim(),
                    reason: correctionReason.trim(),
                    author: "Field rep",
                    requiresManagerReview: true,
                  });
                  setCorrectionAccountId(null);
                  setCorrectionReason("");
                  setCorrectionAfter("");
                }}
              >
                Record audited correction
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

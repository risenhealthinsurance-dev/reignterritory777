import { useEffect, useState } from "react";
import { accounts } from "../data/accounts";
import {
  createFieldAiClient,
  type FieldAiClient,
  type FieldAiIntent,
  type FieldAiResult,
} from "../lib/fieldAi";
import { supabase } from "../lib/supabase";

export const AUDIT_STEP_DELAY_MS = 600;

export interface CopilotQueuedAction {
  type: "research" | "follow_up" | "profile_edit" | "route_change";
  accountId: string | null;
  status: "queued" | "approved";
}

interface FieldAIScreenProps {
  currentAccountId?: string | null;
  isOffline?: boolean;
  onQueueAction?: (action: CopilotQueuedAction) => void;
  fieldAiClient?: FieldAiClient | null;
}

const configuredFieldAiClient = supabase ? createFieldAiClient(supabase) : null;

function formattedDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}

export function FieldAIScreen({
  currentAccountId = null,
  isOffline = false,
  onQueueAction,
  fieldAiClient = configuredFieldAiClient,
}: FieldAIScreenProps) {
  const [accountId, setAccountId] = useState<string | null>(currentAccountId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [territoryMode, setTerritoryMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [result, setResult] = useState<FieldAiResult | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState<string | null>(null);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const account = accounts.find((candidate) => candidate.id === accountId) ?? null;

  useEffect(() => {
    if (currentAccountId) {
      setAccountId(currentAccountId);
      setTerritoryMode(false);
    }
  }, [currentAccountId]);

  useEffect(() => {
    if (!recording) return;
    const stopRecording = () => {
      setRecording(false);
      setVoiceReady(true);
    };
    window.addEventListener("pointerup", stopRecording);
    window.addEventListener("blur", stopRecording);
    return () => {
      window.removeEventListener("pointerup", stopRecording);
      window.removeEventListener("blur", stopRecording);
    };
  }, [recording]);

  function chooseAccount(id: string) {
    setAccountId(id);
    setTerritoryMode(false);
    setPickerOpen(false);
    setResult(null);
  }
  async function askFieldAi(intent: FieldAiIntent) {
    setResult(null);
    setResultError(null);
    if (isOffline) {
      setResultError("This action needs connectivity. Your last cached brief remains available.");
      return;
    }
    if (!fieldAiClient) {
      setResultError("Field AI is not configured for this environment.");
      return;
    }
    setResultLoading(true);
    try {
      setResult(
        await fieldAiClient.ask({
          scope: accountId
            ? { type: "account", accountId }
            : { type: "territory", territoryId: "ft-pierce-34950" },
          intent,
          idempotencyKey: crypto.randomUUID(),
        }),
      );
    } catch (cause) {
      setResultError(
        cause instanceof Error ? cause.message : "Field AI is temporarily unavailable.",
      );
    } finally {
      setResultLoading(false);
    }
  }
  function queueResearch() {
    onQueueAction?.({ type: "research", accountId, status: "queued" });
    setQueuedMessage(
      isOffline
        ? "Queued until connectivity returns"
        : "Research queued · results will stay in this account context",
    );
  }

  return (
    <section className="screen" aria-labelledby="field-ai-title">
      <header className="screen-header">
        <div className="title-row">
          <div>
            <div className="eyebrow">● CONTEXTUAL SALES COPILOT</div>
            <h1 id="field-ai-title">Field AI</h1>
          </div>
          <span className={isOffline ? "connection offline" : "connection"}>
            {isOffline ? "Offline" : "Online"}
          </span>
        </div>
        <div className="context-bar">
          <div>
            <span>{territoryMode ? "TERRITORY-WIDE MODE" : "CURRENT ROUTE STOP"}</span>
            <strong>
              {territoryMode
                ? "Fort Pierce 34950"
                : account
                  ? "@" + account.name
                  : "No account selected"}
            </strong>
          </div>
          <button onClick={() => setPickerOpen((open) => !open)}>
            {account ? "Change account" : "Select account"}
          </button>
        </div>
        {isOffline && (
          <div className="cache-label">Cached brief · updated Oct 4, 2026 · 8:42 AM</div>
        )}
      </header>

      <div className="screen-scroll">
        {pickerOpen && (
          <div className="account-picker">
            <button
              onClick={() => {
                setTerritoryMode(true);
                setAccountId(null);
                setPickerOpen(false);
              }}
            >
              Fort Pierce territory-wide
            </button>
            {accounts.map((candidate) => (
              <button key={candidate.id} onClick={() => chooseAccount(candidate.id)}>
                <strong>{candidate.name}</strong>
                <span>
                  {candidate.industry} · {candidate.tier}
                </span>
              </button>
            ))}
          </div>
        )}

        {!account && !territoryMode ? (
          <div className="empty-state">
            <strong>Select an account</strong>
            <p>Field AI keeps every answer scoped and makes its source visible.</p>
            <button className="primary-button" onClick={() => setPickerOpen(true)}>
              Select account
            </button>
          </div>
        ) : (
          <>
            <div className="voice-card">
              <div>
                <strong>
                  {recording
                    ? "Listening only while you hold control"
                    : voiceReady
                      ? "Voice note ready"
                      : "Ask or capture a field note"}
                </strong>
                <p>Nothing is recorded in the background.</p>
              </div>
              <button
                className={recording ? "voice-button recording" : "voice-button"}
                onPointerDown={(event) => {
                  if (typeof event.currentTarget.setPointerCapture === "function") {
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }
                  setRecording(true);
                  setVoiceReady(false);
                }}
                onPointerUp={(event) => {
                  if (
                    typeof event.currentTarget.hasPointerCapture === "function" &&
                    event.currentTarget.hasPointerCapture(event.pointerId)
                  ) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                  setRecording(false);
                  setVoiceReady(true);
                }}
                onLostPointerCapture={() => {
                  setRecording(false);
                  setVoiceReady(true);
                }}
                onPointerCancel={() => setRecording(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setRecording(true);
                    setVoiceReady(false);
                  }
                }}
                onKeyUp={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setRecording(false);
                    setVoiceReady(true);
                  }
                }}
              >
                {recording ? "Stop recording" : "Hold to talk"}
              </button>
            </div>

            <div className="copilot-actions">
              <button onClick={() => void askFieldAi("brief")} disabled={resultLoading}>
                <span>⚡</span>
                <strong>30-second brief</strong>
                <small>What matters before walking in</small>
              </button>
              <button onClick={() => void askFieldAi("talking_points")} disabled={resultLoading}>
                <span>🎯</span>
                <strong>Talking points</strong>
                <small>Lead with the strongest angle</small>
              </button>
              <button onClick={() => void askFieldAi("objection")} disabled={resultLoading}>
                <span>🛡</span>
                <strong>Handle an objection</strong>
                <small>Evidence-aware response coaching</small>
              </button>
              <button onClick={() => setDraftOpen(true)}>
                <span>✉</span>
                <strong>Draft follow-up</strong>
                <small>Preview before anything is queued</small>
              </button>
              <button
                onClick={() => void askFieldAi("prior_interactions")}
                disabled={resultLoading}
              >
                <span>↩</span>
                <strong>Prior interactions</strong>
                <small>Last visit, promise, and contact context</small>
              </button>
              <button onClick={() => void askFieldAi("visit_note")} disabled={resultLoading}>
                <span>🎙</span>
                <strong>Capture visit note</strong>
                <small>Structure the outcome before leaving</small>
              </button>
              <button onClick={queueResearch}>
                <span>🔎</span>
                <strong>Run deeper research</strong>
                <small>Research, digital presence, supply</small>
              </button>
            </div>

            {queuedMessage && <div className="queue-banner">⏳ {queuedMessage}</div>}

            {resultLoading && <div className="queue-banner">Checking authorized evidence…</div>}
            {resultError && <div role="alert">{resultError}</div>}

            {result && (
              <section className="copilot-result" aria-label="Copilot answer">
                <div className="eyebrow">
                  ANSWER FOR {account ? "@" + account.name : "FORT PIERCE 34950"}
                </div>
                <h2>{result.answer}</h2>
                <p>{result.confidence[0].toUpperCase() + result.confidence.slice(1)} confidence</p>
                <details open>
                  <summary>Evidence</summary>
                  {result.facts.length === 0 && <p>Not verified — no supporting fact was found.</p>}
                  {result.facts.map((fact, index) => (
                    <div className="evidence-card" key={`fact-${index}`}>
                      <div>
                        <span className="evidence-kind fact">Fact</span>
                        <strong>{fact.text}</strong>
                      </div>
                      {(fact.sources ?? []).map((source) => (
                        <p key={source.id}>
                          Source: {source.name}
                          <br />
                          Updated {formattedDate(source.retrievedAt)} ·{" "}
                          {fact.confidence[0].toUpperCase() + fact.confidence.slice(1)} confidence
                        </p>
                      ))}
                    </div>
                  ))}
                  {result.inferences.map((inference, index) => (
                    <div className="evidence-card" key={`inference-${index}`}>
                      <div>
                        <span className="evidence-kind inference">AI inference</span>
                        <strong>{inference.text}</strong>
                      </div>
                      <p>
                        Based on evidence: {inference.evidenceIds.join(", ") || "none"} ·{" "}
                        {inference.confidence[0].toUpperCase() + inference.confidence.slice(1)}{" "}
                        confidence
                      </p>
                    </div>
                  ))}
                </details>
                {result.uncertainties.length > 0 && (
                  <div className="uncertainty-list">
                    <strong>Not verified</strong>
                    <ul>
                      {result.uncertainties.map((uncertainty) => (
                        <li key={uncertainty}>{uncertainty}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            )}

            <section className="specialists" aria-label="Specialist tools">
              <div className="eyebrow">SPECIALIST TOOLS</div>
              <div>
                <span>Research</span>
                <span>Digital presence</span>
                <span>Supply opportunity</span>
                <span>CRM</span>
                <span>Follow-up</span>
                <span>Route</span>
              </div>
              <p>One copilot coordinates these tools. You never need to manage separate agents.</p>
            </section>
          </>
        )}
      </div>

      {draftOpen && (
        <div className="modal-backdrop">
          <section
            className="review-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Review AI draft"
          >
            <div className="eyebrow">REVIEW AI DRAFT</div>
            <h2>Follow-up for {account?.name}</h2>
            <dl>
              <div>
                <dt>Destination</dt>
                <dd>CRM follow-up queue</dd>
              </div>
              <div>
                <dt>Before</dt>
                <dd>No follow-up draft</dd>
              </div>
              <div>
                <dt>After</dt>
                <dd>Send compliance comparison and confirm board-review timing.</dd>
              </div>
            </dl>
            <p>No automatic saves, CRM writes, or messages.</p>
            <div className="two-actions">
              <button className="secondary-button" onClick={() => setDraftOpen(false)}>
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  onQueueAction?.({ type: "follow_up", accountId, status: "approved" });
                  setDraftOpen(false);
                  setQueuedMessage("Approved · queued locally");
                }}
              >
                Approve draft
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

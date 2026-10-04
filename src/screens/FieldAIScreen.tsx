import { useEffect, useState } from "react";
import { accounts } from "../data/accounts";

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
}

type ResultKind = "brief" | "talking_points" | "objection" | null;

export function FieldAIScreen({ currentAccountId = null, isOffline = false, onQueueAction }: FieldAIScreenProps) {
  const [accountId, setAccountId] = useState<string | null>(currentAccountId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [territoryMode, setTerritoryMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceReady, setVoiceReady] = useState(false);
  const [result, setResult] = useState<ResultKind>(null);
  const [queuedMessage, setQueuedMessage] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const account = accounts.find((candidate) => candidate.id === accountId) ?? null;

  useEffect(() => {
    if (currentAccountId) { setAccountId(currentAccountId); setTerritoryMode(false); }
  }, [currentAccountId]);

  function chooseAccount(id: string) { setAccountId(id); setTerritoryMode(false); setPickerOpen(false); setResult(null); }
  function queueResearch() {
    onQueueAction?.({ type: "research", accountId, status: "queued" });
    setQueuedMessage(isOffline ? "Queued until connectivity returns" : "Research queued · results will stay in this account context");
  }

  return (
    <section className="screen" aria-labelledby="field-ai-title">
      <header className="screen-header">
        <div className="title-row"><div><div className="eyebrow">● CONTEXTUAL SALES COPILOT</div><h1 id="field-ai-title">Field AI</h1></div><span className={isOffline ? "connection offline" : "connection"}>{isOffline ? "Offline" : "Online"}</span></div>
        <div className="context-bar"><div><span>{territoryMode ? "TERRITORY-WIDE MODE" : "CURRENT ROUTE STOP"}</span><strong>{territoryMode ? "Fort Pierce 34950" : account ? "@" + account.name : "No account selected"}</strong></div><button onClick={() => setPickerOpen((open) => !open)}>{account ? "Change account" : "Select account"}</button></div>
        {isOffline && <div className="cache-label">Cached brief · updated Oct 4, 2026 · 8:42 AM</div>}
      </header>

      <div className="screen-scroll">
        {pickerOpen && <div className="account-picker"><button onClick={() => { setTerritoryMode(true); setAccountId(null); setPickerOpen(false); }}>Fort Pierce territory-wide</button>{accounts.map((candidate) => <button key={candidate.id} onClick={() => chooseAccount(candidate.id)}><strong>{candidate.name}</strong><span>{candidate.industry} · {candidate.tier}</span></button>)}</div>}

        {!account && !territoryMode ? <div className="empty-state"><strong>Select an account</strong><p>Field AI keeps every answer scoped and makes its source visible.</p><button className="primary-button" onClick={() => setPickerOpen(true)}>Select account</button></div> : <>
          <div className="voice-card"><div><strong>{recording ? "Listening only while you hold control" : voiceReady ? "Voice note ready" : "Ask or capture a field note"}</strong><p>Nothing is recorded in the background.</p></div><button className={recording ? "voice-button recording" : "voice-button"} onClick={() => { if (recording) { setRecording(false); setVoiceReady(true); } else { setRecording(true); setVoiceReady(false); } }}>{recording ? "Stop recording" : "Hold to talk"}</button></div>

          <div className="copilot-actions">
            <button onClick={() => setResult("brief")}><span>⚡</span><strong>30-second brief</strong><small>What matters before walking in</small></button>
            <button onClick={() => setResult("talking_points")}><span>🎯</span><strong>Talking points</strong><small>Lead with the strongest angle</small></button>
            <button onClick={() => setResult("objection")}><span>🛡</span><strong>Handle an objection</strong><small>Evidence-aware response coaching</small></button>
            <button onClick={() => setDraftOpen(true)}><span>✉</span><strong>Draft follow-up</strong><small>Preview before anything is queued</small></button>
            <button onClick={queueResearch}><span>🔎</span><strong>Run deeper research</strong><small>Research, digital presence, supply</small></button>
          </div>

          {queuedMessage && <div className="queue-banner">⏳ {queuedMessage}</div>}

          {result && <section className="copilot-result" aria-label="Copilot answer"><div className="eyebrow">ANSWER FOR {account ? "@" + account.name : "FORT PIERCE 34950"}</div><h2>{result === "brief" ? "Lead with compliance readiness and local support." : result === "talking_points" ? "Open with the decision window, then confirm the buying process." : "Acknowledge the concern, verify it, and answer with sourced evidence."}</h2><p>{account?.notes ?? "Compare the strongest opportunities across today’s territory."}</p><details open><summary>Evidence</summary><div className="evidence-card"><div><span className="evidence-kind fact">Fact</span><strong>Recent account activity supports this talking point.</strong></div><p>Source: CRM visit history</p><p>Updated Oct 4, 2026 · High confidence</p></div><div className="evidence-card"><div><span className="evidence-kind inference">AI inference</span><strong>The current commitment window makes this the best opening.</strong></div><p>Source: Route commitments + account notes</p><p>Updated Oct 4, 2026 · Medium confidence</p></div></details></section>}

          <section className="specialists" aria-label="Specialist tools"><div className="eyebrow">SPECIALIST TOOLS</div><div><span>Research</span><span>Digital presence</span><span>Supply opportunity</span><span>CRM</span><span>Follow-up</span><span>Route</span></div><p>One copilot coordinates these tools. You never need to manage separate agents.</p></section>
        </>}
      </div>

      {draftOpen && <div className="modal-backdrop"><section className="review-dialog" role="dialog" aria-modal="true" aria-label="Review AI draft"><div className="eyebrow">REVIEW AI DRAFT</div><h2>Follow-up for {account?.name}</h2><dl><div><dt>Destination</dt><dd>CRM follow-up queue</dd></div><div><dt>Before</dt><dd>No follow-up draft</dd></div><div><dt>After</dt><dd>Send compliance comparison and confirm board-review timing.</dd></div></dl><p>No automatic saves, CRM writes, or messages.</p><div className="two-actions"><button className="secondary-button" onClick={() => setDraftOpen(false)}>Cancel</button><button className="primary-button" onClick={() => { onQueueAction?.({ type: "follow_up", accountId, status: "approved" }); setDraftOpen(false); setQueuedMessage("Approved · queued locally"); }}>Approve draft</button></div></section></div>}
    </section>
  );
}

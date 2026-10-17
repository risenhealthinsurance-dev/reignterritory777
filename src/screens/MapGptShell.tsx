import { useEffect, useMemo, useRef, useState } from "react";
import type { Account } from "../data/accounts";
import { accounts } from "../data/accounts";
import { MapView } from "../components/MapView";
import { buildLocalAssistantResponse } from "../lib/localAssistant";
import { createFieldAiClient, type FieldAiClient } from "../lib/fieldAi";
import type { AppScreen } from "../types";
import type { AgentConfig, AgentKnowledgeSource, PipelineOpportunity, PipelineStage } from "../contracts/mapGpt";
import { PIPELINE_STAGES } from "../contracts/mapGpt";
import { createAgentStudioRepository, type AgentStudioRepository } from "../lib/agentStudioRepository";
import { createAgentAction, queueAgentAction } from "../lib/fieldAgent";
import { saveAgentAction } from "../lib/agentStore";
import { supabase } from "../lib/supabase";

const repository = createAgentStudioRepository(supabase);
const fieldAiClient: FieldAiClient | null = supabase ? createFieldAiClient(supabase) : null;

function formatMoney(value: number) {
  return `$${(value / 1_000_000).toFixed(1)}M`;
}

function Nav({ current, onNavigate }: { current: AppScreen; onNavigate: (screen: AppScreen) => void }) {
  return (
    <nav className="mapgpt-nav" aria-label="Primary">
      {([
        ["home", "⌖", "Home"],
        ["studio", "✦", "Agent Studio"],
        ["pipeline", "▤", "Pipeline"],
      ] as const).map(([id, icon, label]) => (
        <button key={id} aria-current={current === id ? "page" : undefined} onClick={() => onNavigate(id)}>
          <span aria-hidden="true">{icon}</span>
          <strong>{label}</strong>
        </button>
      ))}
    </nav>
  );
}

function AssistantAvatar({ avatar = "orb" }: { avatar?: AgentConfig["avatar"] }) {
  return <div className={`mapgpt-avatar mapgpt-avatar--${avatar}`} aria-hidden="true"><span>✦</span></div>;
}

type DraftKind = "schedule" | "disposition" | "visit_note";

interface ActionDraft {
  kind: DraftKind;
  appointmentType: "window" | "hard";
  date: string;
  time: string;
  endTime: string;
  outcome: string;
  note: string;
}

function HomeScreen({ accounts: businesses, selectedAccountId, onSelectAccount, onOpenPipeline }: { accounts: Account[]; selectedAccountId: string; onSelectAccount: (id: string) => void; onOpenPipeline: () => void }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([
    { role: "assistant", text: "I’m ready. Ask about a business, your territory, or the next best action." },
  ]);
  const [loading, setLoading] = useState(false);
  const [actionDraft, setActionDraft] = useState<ActionDraft | null>(null);
  const selectedAccount = businesses.find((account) => account.id === selectedAccountId) ?? businesses[0];
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function ask(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setInput("");
    setMessages((current) => [...current, { role: "user", text: prompt }]);
    setLoading(true);
    try {
      if (fieldAiClient) {
        const lower = prompt.toLowerCase();
        const intent = lower.includes("objection") ? "objection" : lower.includes("talking") ? "talking_points" : lower.includes("prior") ? "prior_interactions" : "brief";
        const result = await fieldAiClient.ask({ scope: { type: "account", accountId: selectedAccount.id }, intent, idempotencyKey: crypto.randomUUID() });
        setMessages((current) => [...current, { role: "assistant", text: result.answer }]);
      } else {
        const text = buildLocalAssistantResponse(prompt, selectedAccount);
        setMessages((current) => [...current, { role: "assistant", text }]);
      }
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "I couldn’t reach the live agent, so I kept this response local. Try the brief again when connected." }]);
    } finally {
      setLoading(false);
    }
  }

  function openDraft(kind: DraftKind) {
    setActionDraft({ kind, appointmentType: "window", date: "", time: "", endTime: "", outcome: "", note: "" });
  }

  function confirmDraft() {
    if (!actionDraft) return;
    const label = actionDraft.kind === "schedule" ? "Follow-up draft" : actionDraft.kind === "disposition" ? "Disposition draft" : "Visit note draft";
    const type = actionDraft.kind === "schedule" ? "schedule_follow_up" : actionDraft.kind === "disposition" ? "record_disposition" : "save_visit_note";
    const payload = actionDraft.kind === "schedule"
      ? { date: actionDraft.date, time: actionDraft.time, ...(actionDraft.appointmentType === "window" ? { endTime: actionDraft.endTime } : {}), appointmentType: actionDraft.appointmentType }
      : actionDraft.kind === "disposition"
        ? { outcome: actionDraft.outcome, note: actionDraft.note.trim() }
        : { note: actionDraft.note.trim() };
    const action = queueAgentAction(createAgentAction({ type, accountId: selectedAccount.id, payload, sourceMessageId: crypto.randomUUID() }));
    saveAgentAction(action);
    setActionDraft(null);
    setMessages((current) => [...current, { role: "assistant", text: `${label} queued locally for ${selectedAccount.name}. It is ready to sync when the live CRM/calendar writer is connected.` }]);
  }

  const draftReady = actionDraft?.kind === "schedule"
    ? Boolean(actionDraft.date && actionDraft.time && (actionDraft.appointmentType === "hard" || actionDraft.endTime))
    : actionDraft?.kind === "disposition"
      ? Boolean(actionDraft.outcome)
      : Boolean(actionDraft?.note.trim());

  return (
    <section className="mapgpt-home" aria-label="Home map and assistant">
      <div className="mapgpt-home__map">
        <MapView height={window.innerHeight} accounts={businesses} routeStopIds={businesses.map((account) => account.id)} activeAccountId={selectedAccount.id} onPinTap={onSelectAccount} doneAccountIds={businesses.filter((account) => account.done).map((account) => account.id)} minimalChrome />
      </div>
      <header className="mapgpt-home__topbar">
        <div className="mapgpt-brand"><span>✦</span><strong>Reign</strong><small>Territory</small></div>
        <button className="mapgpt-icon-button" aria-label="Open pipeline" onClick={onOpenPipeline}>▤</button>
      </header>
      <div className="mapgpt-home__business-picker" aria-label="Businesses on map">
        {businesses.map((account) => <button key={account.id} aria-label={account.name} aria-pressed={account.id === selectedAccount.id} onClick={() => onSelectAccount(account.id)}>{account.name}</button>)}
      </div>
      <div className="mapgpt-home__assistant" aria-label="AI assistant context">
        <div className="mapgpt-context"><span>Current business</span><strong>{selectedAccount.name}</strong><small>{selectedAccount.address}</small></div>
        <div className="mapgpt-chat-window">
          <div className="mapgpt-chat-window__header"><AssistantAvatar /><div><strong>Ask Reign</strong><small>AI field assistant</small></div><button aria-label="Voice-ready assistant control">◉</button></div>
          <div className="mapgpt-messages">{messages.slice(-3).map((message, index) => <div key={`${message.role}-${index}`} className={`mapgpt-message mapgpt-message--${message.role}`}>{message.text}</div>)}{loading && <div className="mapgpt-message mapgpt-message--assistant">Thinking with your business context…</div>}<div ref={bottomRef} /></div>
          <div className="mapgpt-prompts"><button onClick={() => void ask("Give me a 30-second brief")}>Brief</button><button onClick={() => void ask("Give me talking points")}>Talking points</button><button onClick={() => void ask("What should I do next?")}>Next action</button></div>
          <div className="mapgpt-action-chips" aria-label="Approved field actions">
            <button onClick={() => openDraft("schedule")}>Schedule callback or appointment</button>
            <button onClick={() => openDraft("disposition")}>Record disposition</button>
            <button onClick={() => openDraft("visit_note")}>Save visit note</button>
          </div>
          {actionDraft && <div className="mapgpt-action-draft" role="dialog" aria-modal="true" aria-label={actionDraft.kind === "schedule" ? "Schedule callback or appointment" : actionDraft.kind === "disposition" ? "Record disposition" : "Save visit note"}>
            <strong>{actionDraft.kind === "schedule" ? `Schedule follow-up for ${selectedAccount.name}` : actionDraft.kind === "disposition" ? `Record outcome for ${selectedAccount.name}` : `Save visit note for ${selectedAccount.name}`}</strong>
            {actionDraft.kind === "schedule" && <>
              <label>Appointment type<select aria-label="Appointment type" value={actionDraft.appointmentType} onChange={(event) => setActionDraft({ ...actionDraft, appointmentType: event.target.value as ActionDraft["appointmentType"] })}><option value="window">Time window</option><option value="hard">Hard appointment</option></select></label>
              <label>Date<input aria-label="Date" type="date" value={actionDraft.date} onChange={(event) => setActionDraft({ ...actionDraft, date: event.target.value })} /></label>
              <label>{actionDraft.appointmentType === "hard" ? "Time" : "Start time"}<input aria-label={actionDraft.appointmentType === "hard" ? "Time" : "Start time"} type="time" value={actionDraft.time} onChange={(event) => setActionDraft({ ...actionDraft, time: event.target.value })} /></label>
              {actionDraft.appointmentType === "window" && <label>End time<input aria-label="End time" type="time" value={actionDraft.endTime} onChange={(event) => setActionDraft({ ...actionDraft, endTime: event.target.value })} /></label>}
            </>}
            {actionDraft.kind === "disposition" && <label>Outcome<select aria-label="Outcome" value={actionDraft.outcome} onChange={(event) => setActionDraft({ ...actionDraft, outcome: event.target.value })}><option value="">Choose outcome</option><option>Connected</option><option>Callback requested</option><option>Qualified</option><option>Not interested</option><option>No answer</option></select></label>}
            {actionDraft.kind !== "schedule" && <label>Notes<textarea aria-label="Notes" value={actionDraft.note} onChange={(event) => setActionDraft({ ...actionDraft, note: event.target.value })} placeholder="Capture what happened…" /></label>}
            <small>Review required. This queues locally until the live CRM/calendar action is connected.</small>
            <div className="mapgpt-action-draft__buttons"><button onClick={() => setActionDraft(null)}>Cancel draft</button><button onClick={confirmDraft} disabled={!draftReady}>Confirm draft</button></div>
          </div>}
          <form className="mapgpt-composer" onSubmit={(event) => { event.preventDefault(); void ask(input); }}><input aria-label="Ask the AI assistant" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask anything about this territory…" /><button aria-label="Send message" type="submit">↑</button></form>
        </div>
      </div>
    </section>
  );
}

function AgentStudioScreen({ repo }: { repo: AgentStudioRepository }) {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { void repo.loadAgentConfig().then(setConfig); }, [repo]);
  if (!config) return <section className="studio-screen"><div className="studio-loading">Loading agent studio…</div></section>;
  async function update(next: AgentConfig) { const savedConfig = await repo.saveAgentConfig(next); setConfig(savedConfig); setSaved(true); window.setTimeout(() => setSaved(false), 1200); }
  async function addSource(input: Parameters<AgentStudioRepository["addKnowledgeSource"]>[0]) { const source = await repo.addKnowledgeSource(input); setConfig(await repo.loadAgentConfig()); setSaved(true); window.setTimeout(() => setSaved(false), 1200); return source; }
  return (
    <section className="studio-screen" aria-labelledby="agent-studio-title">
      <header className="studio-header"><div className="mapgpt-brand mapgpt-brand--light"><span>✦</span><strong>Reign</strong><small>Agent Studio</small></div><span className="studio-status">{saved ? "Saved" : "Draft"}</span></header>
      <div className="studio-layout">
        <div className="studio-column studio-column--identity"><h1 id="agent-studio-title">Agent Studio</h1><label>Name<input value={config.name} onChange={(event) => setConfig({ ...config, name: event.target.value })} onBlur={() => void update(config)} /></label><label>Assistant label<input value={config.assistantLabel} onChange={(event) => setConfig({ ...config, assistantLabel: event.target.value })} onBlur={() => void update(config)} /></label><label>Instructions<textarea value={config.instructions} onChange={(event) => setConfig({ ...config, instructions: event.target.value })} onBlur={() => void update(config)} /></label><div className="avatar-choices" aria-label="Avatar appearance">{(["orb", "guide", "scout"] as const).map((avatar) => <button key={avatar} aria-pressed={config.avatar === avatar} onClick={() => void update({ ...config, avatar })}><AssistantAvatar avatar={avatar} /><span>{avatar}</span></button>)}</div></div>
        <div className="studio-column studio-column--preview"><div className="studio-preview"><AssistantAvatar avatar={config.avatar} /><strong>{config.assistantLabel}</strong><p>Hi, I’m ready to help you work the territory.</p><div className="studio-preview__input">Ask your agent something… <span>↑</span></div></div><div className="studio-preview__summary"><strong>Agent behavior</strong><span>Business-scoped · approval-aware</span></div></div>
        <div className="studio-column studio-column--knowledge"><section className="studio-panel" aria-label="Knowledge sources"><div className="studio-panel__title"><h2>Knowledge</h2><span>{config.knowledgeSources.length} sources</span></div><div className="source-add"><input aria-label="Knowledge URL" value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="Add a website URL" /><button onClick={() => { if (sourceUrl.trim()) { void addSource({ kind: "url", name: sourceUrl.trim(), url: sourceUrl.trim() }); setSourceUrl(""); } }}>＋</button></div><div className="source-add"><textarea aria-label="Knowledge text" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="Paste instructions or playbook text" /><button onClick={() => { if (sourceText.trim()) { void addSource({ kind: "text", name: "Pasted instructions", content: sourceText.trim() }); setSourceText(""); } }}>＋</button></div><label className="file-source">＋ Upload text file<input type="file" accept=".txt,.md,.csv,.json" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; void file.text().then((content) => addSource({ kind: "file", name: file.name, fileName: file.name, content })); event.currentTarget.value = ""; }} /></label>{config.knowledgeSources.map((source: AgentKnowledgeSource) => <div className="source-row" key={source.id}><span className="source-dot" /> <div><strong>{source.name}</strong><small>{source.status} · {source.kind}</small></div><button aria-label={`Remove ${source.name}`} onClick={() => { void repo.removeKnowledgeSource(source.id).then(() => repo.loadAgentConfig()).then(setConfig); }}>×</button></div>)}</section><section className="studio-panel" aria-label="Agent actions"><div className="studio-panel__title"><h2>Actions</h2><span>{config.actions.filter((action) => action.enabled).length} enabled</span></div>{config.actions.map((action) => <button className="action-row" key={action.type} aria-pressed={action.enabled} onClick={() => void repo.setAgentActionEnabled(action.type, !action.enabled).then(setConfig)}><span className="action-row__icon">✦</span><span><strong>{action.label}</strong><small>{action.description}</small></span><span className={`toggle ${action.enabled ? "toggle--on" : ""}`} /></button>)}</section></div>
      </div>
    </section>
  );
}

function PipelineScreen({ repo, onOpenHome }: { repo: AgentStudioRepository; onOpenHome: (accountId: string) => void }) {
  const [opportunities, setOpportunities] = useState<PipelineOpportunity[]>([]);
  const [pending, setPending] = useState<{ id: string; stage: PipelineStage } | null>(null);
  useEffect(() => { void repo.listPipelineOpportunities().then(setOpportunities); }, [repo]);
  async function confirmMove() { if (!pending) return; const updated = await repo.updatePipelineStage(pending.id, pending.stage); setOpportunities((current) => current.map((item) => item.id === updated.id ? updated : item)); setPending(null); }
  return <section className="pipeline-screen" aria-labelledby="pipeline-title"><header className="pipeline-header"><div><span className="studio-kicker">CURRENT PIPELINE</span><h1 id="pipeline-title">Current pipeline</h1><p>Keep every next action visible.</p></div><div className="pipeline-total">{formatMoney(opportunities.reduce((sum, item) => sum + item.estimatedValue, 0))}<small>territory value</small></div></header><div className="pipeline-board">{PIPELINE_STAGES.map((stage) => <section className="pipeline-stage" key={stage.id} aria-label={`${stage.label} pipeline stage`}><div className="pipeline-stage__title"><strong>{stage.label}</strong><span>{opportunities.filter((item) => item.stage === stage.id).length}</span></div>{opportunities.filter((item) => item.stage === stage.id).map((opportunity) => <article className="pipeline-card" key={opportunity.id}><button className="pipeline-card__name" onClick={() => onOpenHome(opportunity.account.id)}>{opportunity.account.name}</button><span>{opportunity.account.contact.name} · {opportunity.account.contact.title}</span><strong>{formatMoney(opportunity.estimatedValue)}</strong><p>{opportunity.nextAction}</p>{opportunity.commitment && <small>● {opportunity.commitment}</small>}<label>Move to<select value={opportunity.stage} onChange={(event) => setPending({ id: opportunity.id, stage: event.target.value as PipelineStage })}>{PIPELINE_STAGES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>{pending?.id === opportunity.id && <div className="pipeline-card__confirm"><button onClick={() => setPending(null)}>Cancel</button><button onClick={() => void confirmMove()}>Confirm move</button></div>}</article>)}</section>)}</div></section>;
}

export function MapGptShell({ initialScreen = "home", initialAccountId = "apex" }: { initialScreen?: AppScreen; initialAccountId?: string | null }) {
  const [screen, setScreen] = useState<AppScreen>(initialScreen === "studio" || initialScreen === "pipeline" ? initialScreen : "home");
  const [businesses, setBusinesses] = useState<Account[]>(accounts);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId ?? "apex");
  useEffect(() => {
    void repository.listBusinesses().then((liveBusinesses) => {
      if (!liveBusinesses.length) return;
      setBusinesses(liveBusinesses);
      setSelectedAccountId((current) => liveBusinesses.some((business) => business.id === current) ? current : liveBusinesses[0].id);
    });
  }, []);
  const selectedAccount = useMemo(() => businesses.find((account) => account.id === selectedAccountId) ?? businesses[0], [businesses, selectedAccountId]);
  return <div className="mapgpt-shell"><main className="mapgpt-main">{screen === "home" && <HomeScreen accounts={businesses} selectedAccountId={selectedAccount.id} onSelectAccount={setSelectedAccountId} onOpenPipeline={() => setScreen("pipeline")} />}{screen === "studio" && <AgentStudioScreen repo={repository} />}{screen === "pipeline" && <PipelineScreen repo={repository} onOpenHome={(id) => { setSelectedAccountId(id); setScreen("home"); }} />}</main><Nav current={screen} onNavigate={setScreen} /></div>;
}

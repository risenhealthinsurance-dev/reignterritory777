import type { RepAccountBrief, RepBriefResponse } from "../contracts/repBrief";

interface TodayCockpitScreenProps {
  brief: RepBriefResponse;
  nextAccount: RepAccountBrief;
  cached: boolean;
  loading: boolean;
  onRefresh: () => void;
  onOpenBrief: () => void;
  onStartVisit: () => void;
  onOpenTerritory: () => void;
}

export function TodayCockpitScreen({ brief, nextAccount, cached, loading, onRefresh, onOpenBrief, onStartVisit, onOpenTerritory }: TodayCockpitScreenProps) {
  const done = brief.accounts.filter((account) => (account.routeOrder ?? 99) < (nextAccount.routeOrder ?? 99)).length;
  return (
    <main className="today-cockpit" aria-label="Today field cockpit">
      <header className="cockpit-header">
        <div>
          <span className="eyebrow">● TODAY · FIELD READY</span>
          <h1>Fort Pierce 34950</h1>
          <p>A1 recommended · {done}/{brief.accounts.length} route stops complete</p>
        </div>
        <button className="icon-button" onClick={onRefresh} aria-label="Refresh intelligence" disabled={loading}>↻</button>
      </header>

      <div className={`brief-status ${cached ? "is-cached" : "is-live"}`} role="status">
        <span>{cached ? "◷ Cached brief" : "● Live brief"}</span>
        <span>{brief.generatedAt ? `Updated ${new Date(brief.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Fixture data"}</span>
      </div>

      <section className="next-stop-card" aria-labelledby="next-stop-title">
        <div className="card-kicker">NEXT STOP · {nextAccount.quadrant ?? "A1"}</div>
        <div className="next-stop-heading"><div><h2 id="next-stop-title">{nextAccount.name}</h2><p>{nextAccount.address}</p></div><span className="confidence-badge">{nextAccount.confidence} confidence</span></div>
        <p className="why-copy">{nextAccount.whyThisAccount?.[0] ?? "Priority account in today’s route."}</p>
        <div className="signal-row">{(nextAccount.publicSignals ?? []).slice(0, 2).map((signal) => <span key={signal.label}><strong>{signal.label}</strong>{signal.value}</span>)}</div>
        <button className="primary-action" onClick={onStartVisit}>Start visit <span>→</span></button>
        <button className="text-action" onClick={onOpenBrief}>Open actionable brief</button>
      </section>

      <section className="cockpit-section"><div className="section-heading"><span>ROUTE PULSE</span><button onClick={onOpenTerritory}>View territory →</button></div><div className="pulse-grid"><div><strong>{brief.coverage.discovered}</strong><span>discovered</span></div><div><strong>{brief.coverage.enriched}</strong><span>enriched</span></div><div><strong>{brief.warnings.length}</strong><span>needs review</span></div></div></section>

      <section className="cockpit-section"><div className="section-heading"><span>FIELD QUEUE</span></div><div className="queue-row"><span className="queue-icon">↗</span><div><strong>{brief.accounts.filter((account) => account.recommendedAction?.toLowerCase().includes("confirm")).length} follow-ups</strong><p>Keep next actions visible after each visit</p></div><span>›</span></div><div className="queue-row"><span className="queue-icon warning">!</span><div><strong>{brief.warnings.length} intelligence note</strong><p>{brief.warnings[0]?.message ?? "No warnings"}</p></div><span>›</span></div></section>
    </main>
  );
}

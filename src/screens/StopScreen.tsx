import type { Account } from "../data/accounts";
import type { DayStop } from "../domain/repDay";
import type { QuadrantContext } from "../types";

interface StopScreenProps {
  account: Account; stop: DayStop; onConfirmArrival: () => void; onStartVisit: () => void;
  onLogVisit: () => void; onScheduleFollowUp: () => void; onReportFailed: () => void; onBack: () => void;
  quadrantContext?: QuadrantContext; onEnrich?: (action: string) => void;
}

export function StopScreen({ account, stop, onConfirmArrival, onStartVisit, onLogVisit, onScheduleFollowUp, onReportFailed, onBack, onEnrich }: StopScreenProps) {
  const arrived = Boolean(stop.arrivedAt); const started = Boolean(stop.visitStartedAt);
  return (
    <section className="screen" aria-labelledby="stop-title">
      <header className="screen-header"><button className="back-button" onClick={onBack}>← Route</button><div className="eyebrow">● CURRENT STOP · {stop.scheduledTime}</div><h1 id="stop-title">{account.name}</h1><p className="muted">{account.address}</p></header>
      <div className="screen-scroll">
        {!arrived && <div className="arrival-card"><div className="arrival-icon">◎</div><div><strong>GPS suggests you are at this stop</strong><p>About 60 ft away · confirm before the visit begins.</p></div><button className="primary-button" onClick={onConfirmArrival}>Confirm arrived</button></div>}
        {arrived && !started && <div className="arrival-card confirmed"><div><span className="tag">ARRIVED</span><strong>Prepare before starting</strong><p>Parking and preparation time stay separate from visit time.</p></div><button className="primary-button" onClick={onStartVisit}>Start visit</button><div className="quick-grid"><a href={"tel:" + account.contact.phone}>Call contact</a><button onClick={() => onEnrich?.("brief")}>Review brief</button><button onClick={onReportFailed}>Can&apos;t access location</button></div></div>}
        {started && <div className="live-banner">● Visit in progress · started separately from arrival</div>}
        <article className="account-brief"><div className="title-row"><span className="avatar">{account.name[0]}</span><div><h2>{account.contact.name}</h2><p>{account.contact.title}</p></div><span className="tag">{account.tier}</span></div><div className="brief-section"><span>Today&apos;s focus</span><p>{account.notes}</p></div><div className="brief-section"><span>Last interaction</span><p>{account.activities[0]?.summary}</p></div><div className="brief-section"><span>Expected value</span><p>{"$" + (account.revenue / 1_000_000).toFixed(1) + "M account · verify needs before proposing."}</p></div></article>
      </div>
      <footer className="screen-footer">{started ? <><button className="primary-button" onClick={onLogVisit}>Work This Business</button><div className="two-actions"><button className="secondary-button" onClick={onScheduleFollowUp}>Follow-up</button><button className="secondary-button" onClick={onReportFailed}>No contact</button></div></> : <p className="footer-hint">Confirm arrival and start the visit to log an outcome.</p>}</footer>
    </section>
  );
}

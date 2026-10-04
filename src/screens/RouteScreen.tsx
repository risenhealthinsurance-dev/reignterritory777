import { accounts } from "../data/accounts";
import type { DayStop } from "../domain/repDay";

interface RouteScreenProps {
  stops: DayStop[]; routeStopIds: string[]; currentStopId: string | null; mapExpanded: boolean;
  onToggleMap: () => void; onSelectStop: (id: string) => void; onEditRoute: () => void; onEndDay: () => void;
}

export function RouteScreen({ stops, routeStopIds, currentStopId, mapExpanded, onToggleMap, onSelectStop, onEditRoute, onEndDay }: RouteScreenProps) {
  const ordered = routeStopIds.map((id) => stops.find((stop) => stop.accountId === id)).filter((stop): stop is DayStop => Boolean(stop));
  const completed = stops.filter((stop) => stop.status === "done").length;
  const next = ordered.find((stop) => stop.status === "pending" || stop.status === "active");
  return (
    <section className="screen" aria-labelledby="route-title">
      <header className="screen-header">
        <div className="title-row"><div><div className="eyebrow">● ROUTE ACTIVE · 34950 · A1</div><h1 id="route-title">Next-best-action cockpit</h1></div><button className="icon-text-button" onClick={onToggleMap}>{mapExpanded ? "Collapse map" : "Open full-screen map"}</button></div>
        <div className="metric-grid four"><div className="metric"><strong>{completed}/{stops.length}</strong><span>Complete</span></div><div className="metric"><strong>12.2 mi</strong><span>Remaining</span></div><div className="metric"><strong>2h 11m</strong><span>Travel + visits</span></div><div className="metric"><strong>4:42 PM</strong><span>Finish</span></div></div>
      </header>
      <div className="screen-scroll">
        {next && <div className="callout blue"><strong>Recommended now · {accounts.find((a) => a.id === next.accountId)?.name}</strong><span>{next.hardCommitment ? "Protected commitment" : "High expected value nearby"} · {next.travelMinutes} min away</span></div>}
        <div className="stack compact">{ordered.map((stop,index) => { const account = accounts.find((candidate) => candidate.id === stop.accountId); if (!account) return null; const isCurrent = stop.accountId === currentStopId; return <button key={stop.accountId} className={isCurrent ? "route-row current" : "route-row"} onClick={() => onSelectStop(stop.accountId)} aria-label={"Open " + account.name}><span className="route-index">{stop.status === "done" ? "✓" : index + 1}</span><span className="route-copy"><span className="row-top"><strong>{account.name}</strong>{stop.hardCommitment && <em>COMMITMENT</em>}</span><small>{account.address.split(",")[0]} · {stop.scheduledTime}</small></span><span className={"status " + stop.status}>{isCurrent ? "NOW" : stop.status}</span></button>; })}</div>
      </div>
      <footer className="screen-footer two-actions"><button className="secondary-button" onClick={onEditRoute}>Edit route</button><button className="secondary-button" onClick={onEndDay}>Review &amp; end day</button></footer>
    </section>
  );
}

import { useState } from "react";
import { accounts } from "../data/accounts";
import { A1_STOPS, BADGE_CONFIG } from "../data/territory_grid";
import type { QuadrantStop } from "../data/territory_grid";
import type { RouteProposal } from "../domain/repDay";

interface QuadrantRouteScreenProps {
  quadrantId: string;
  routeStopIds: string[];
  onPreviewRoute: (ids: string[]) => RouteProposal;
  onApplyRoute: (proposal: RouteProposal) => void;
  onStartLoop: (firstStopAccountId?: string) => void;
  onSelectStop: (stop: QuadrantStop) => void;
  onBack: () => void;
}

function money(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return sign + "$" + (Math.abs(value) / 1_000_000).toFixed(1) + "M";
}

export function QuadrantRouteScreen({ quadrantId, routeStopIds, onPreviewRoute, onApplyRoute, onStartLoop, onSelectStop, onBack }: QuadrantRouteScreenProps) {
  const [draft, setDraft] = useState(() => routeStopIds);
  const [preview, setPreview] = useState<RouteProposal | null>(null);
  const [updated, setUpdated] = useState(false);
  const stops = draft.map((id) => A1_STOPS.find((candidate) => candidate.accountId === id)).filter((stop): stop is QuadrantStop => Boolean(stop));
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= draft.length) return;
    setDraft((current) => { const next = [...current]; [next[index], next[target]] = [next[target], next[index]]; return next; });
    setPreview(null); setUpdated(false);
  }
  return (
    <section className="screen" aria-labelledby="route-plan-title">
      <header className="screen-header"><button className="back-button" onClick={onBack}>← {quadrantId} quadrant</button><div className="eyebrow">● SUGGESTED ROUTE · {quadrantId} · 34950</div><h1 id="route-plan-title">Today&apos;s work</h1><p className="muted">Commitments → expected value → travel efficiency</p></header>
      <div className="screen-scroll">
        {updated && <div className="success-banner">✓ Route updated</div>}
        <div className="stack compact">{stops.map((stop,index) => { const account = accounts.find((candidate) => candidate.id === stop.accountId)!; return <article className="route-edit-card" key={stop.id}><button className="route-main" onClick={() => onSelectStop(stop)}><span className="route-index">{index + 1}</span><span><span className="tag" style={{ color: BADGE_CONFIG[stop.type].color }}>{BADGE_CONFIG[stop.type].label}</span><strong>{stop.name}</strong><small>{stop.eta} · {stop.distance} · {"$" + (account.revenue / 1_000_000).toFixed(1) + "M"}</small></span></button><div className="route-actions"><button aria-label={"Move " + stop.name + " earlier"} onClick={() => move(index,-1)} disabled={index===0}>↑</button><button aria-label={"Move " + stop.name + " later"} onClick={() => move(index,1)} disabled={index===stops.length-1}>↓</button><button aria-label={"Schedule " + stop.name + " for later"} onClick={() => { setDraft((current) => current.filter((id) => id !== stop.accountId)); setPreview(null); setUpdated(false); }}>Later</button></div></article>; })}</div>
        {preview && <section className="impact-preview" role="region" aria-label="Route impact preview"><div className="eyebrow">IMPACT PREVIEW</div><div className="impact-grid"><div><span>Commitments</span><strong>{preview.metrics.commitmentDelta || "Protected"}</strong></div><div><span>Travel time</span><strong>{preview.metrics.travelMinutesDelta} min</strong></div><div><span>Expected value</span><strong>{money(preview.metrics.expectedValueDelta)}</strong></div><div><span>Projected finish</span><strong>{preview.metrics.projectedFinish}</strong></div></div>{preview.warnings.map((warning) => <p className="warning" key={warning}>⚠ {warning}</p>)}<button className="primary-button" onClick={() => { onApplyRoute(preview); setUpdated(true); setPreview(null); }}>Apply route</button></section>}
      </div>
      <footer className="screen-footer two-actions"><button className="secondary-button" onClick={() => setPreview(onPreviewRoute(draft))}>Preview route impact</button><button className="primary-button" onClick={() => onStartLoop(draft[0])} disabled={!updated}>Start route</button></footer>
    </section>
  );
}

import { A1_STOPS, BADGE_CONFIG, QUADRANTS } from "../data/territory_grid";

interface ActiveQuadrantScreenProps { quadrantId: string; onPlanRoute: () => void; onBack: () => void; }

export function ActiveQuadrantScreen({ quadrantId, onPlanRoute, onBack }: ActiveQuadrantScreenProps) {
  const quadrant = QUADRANTS.find((candidate) => candidate.id === quadrantId) ?? QUADRANTS[0];
  const total = Object.values(quadrant.counts).reduce((sum, value) => sum + value, 0);
  const candidates = quadrantId === "A1" ? A1_STOPS.slice(0, 6) : [];
  return (
    <section className="screen" aria-labelledby="quadrant-title">
      <header className="screen-header">
        <button className="back-button" onClick={onBack}>← Territory</button>
        <div className="eyebrow">● {quadrantId} · QUADRANT</div>
        <h1 id="quadrant-title">{total} opportunities</h1>
        <p className="muted">{quadrantId === "A1" ? "Recommended for today · commitments first" : "Available to browse · A1 remains today’s recommendation"}</p>
      </header>
      <div className="screen-scroll">
        <div className="metric-grid four">
          {[[quadrant.counts.followUp,"Follow-ups"],[quadrant.counts.reloop,"Reloops"],[quadrant.counts.retention,"Retention"],[quadrant.counts.newDoor,"New doors"]].map(([value,label]) => <div className="metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}
        </div>
        {candidates.length > 0 ? <div className="stack">{candidates.map((stop) => <article className="candidate-card" key={stop.id}><div><span className="tag" style={{ color: BADGE_CONFIG[stop.type].color }}>{BADGE_CONFIG[stop.type].label}</span><h2>{stop.name}</h2><p>{stop.reason}</p></div><span className="distance">{stop.distance}</span></article>)}</div> : <div className="empty-state"><strong>Browse complete</strong><p>This quadrant has {total} opportunities. Open A1 to build today&apos;s recommended route.</p><button className="secondary-button" onClick={onBack}>Compare quadrants</button></div>}
      </div>
      {quadrantId === "A1" && <footer className="screen-footer"><button className="primary-button" onClick={onPlanRoute}>Plan suggested route →</button></footer>}
    </section>
  );
}

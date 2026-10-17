import { QUADRANTS } from "../data/territory_grid";

interface TerritoryOverviewScreenProps {
  onViewQuadrant: (id: string) => void;
  onPlanToday?: () => void;
  completedQuadrants?: string[];
  locked?: boolean;
  onLockTerritory?: () => void;
  outstandingFollowUps?: number;
  quadrantOrder?: string[];
  onMoveQuadrant?: (id: string, direction: "up" | "down") => void;
}

export function TerritoryOverviewScreen({ onViewQuadrant, onPlanToday, completedQuadrants = [], locked = false, onLockTerritory, outstandingFollowUps = 0, quadrantOrder, onMoveQuadrant }: TerritoryOverviewScreenProps) {
  const orderedQuadrants = (quadrantOrder ?? QUADRANTS.map((quadrant) => quadrant.id)).map((id) => QUADRANTS.find((quadrant) => quadrant.id === id)).filter((quadrant): quadrant is typeof QUADRANTS[number] => Boolean(quadrant));
  return (
    <section className="screen" aria-labelledby="territory-title">
      <header className="screen-header">
        <div className="eyebrow">● ASSIGNED TERRITORY · 34950</div>
        <div className="title-row">
          <div><h1 id="territory-title">Fort Pierce 34950</h1><p className="muted">Choose today&apos;s work</p></div>
          <span className="recommendation-pill">A1 recommended</span>
        </div>
        <div className="segmented" aria-label="Territory workflow">
          <button aria-current="step">Territory</button>
          <button onClick={() => onViewQuadrant("A1")}>Active quadrant</button>
          <button onClick={onPlanToday}>Today&apos;s work</button>
        </div>
      </header>
      <div className="screen-scroll">
        <div className="callout cyan"><strong>{locked ? "Territory locked · view only" : "A1 is recommended"}</strong><span>{locked ? "This territory is protected from overlap for 3 months." : "Best mix of commitments, expected value, and a compact downtown loop."}</span></div>
        <div className="quadrant-grid" aria-label="Fort Pierce territory quadrants">
          {orderedQuadrants.map((quadrant, index) => {
            const total = Object.values(quadrant.counts).reduce((sum, value) => sum + value, 0);
            return (
              <button key={quadrant.id} className={quadrant.id === "A1" ? "quadrant recommended" : "quadrant"} onClick={() => onViewQuadrant(quadrant.id)} aria-label={`${quadrant.id}, ${total} opportunities${quadrant.id === "A1" ? ", recommended" : ""}`}>
                <strong>{index + 1}. {quadrant.id}</strong><span>{completedQuadrants.includes(quadrant.id) ? "Complete" : `${total} opps`}</span>
              </button>
            );
          })}
        </div>
        {!locked && onMoveQuadrant && <div className="legend-row" aria-label="Adjust quadrant order"><span>Adjust order:</span>{orderedQuadrants.slice(0, 4).map((quadrant, index) => <span key={`order-${quadrant.id}`}><button className="secondary-button" disabled={index === 0} onClick={() => onMoveQuadrant(quadrant.id, "up")} aria-label={`Move ${quadrant.id} earlier`}>↑</button><button className="secondary-button" disabled={index === orderedQuadrants.length - 1} onClick={() => onMoveQuadrant(quadrant.id, "down")} aria-label={`Move ${quadrant.id} later`}>↓</button></span>)}</div>}
        <div className="legend-row"><span><i className="legend-dot cyan-dot" />Recommended</span><span><i className="legend-dot blue-dot" />Available</span><span>{completedQuadrants.length}/{QUADRANTS.length} quadrants complete</span></div>
        {!locked && completedQuadrants.length === QUADRANTS.length && outstandingFollowUps === 0 && <button className="primary-button" onClick={onLockTerritory}>Lock exhausted territory for 3 months</button>}
        {!locked && completedQuadrants.length === QUADRANTS.length && outstandingFollowUps > 0 && <div className="callout"><strong>Territory cannot lock yet</strong><span>{outstandingFollowUps} unresolved reloop/follow-up item{outstandingFollowUps === 1 ? "" : "s"} remain.</span></div>}
      </div>
    </section>
  );
}

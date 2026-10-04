import { QUADRANTS } from "../data/territory_grid";

interface TerritoryOverviewScreenProps {
  onViewQuadrant: (id: string) => void;
  onPlanToday?: () => void;
}

export function TerritoryOverviewScreen({ onViewQuadrant, onPlanToday }: TerritoryOverviewScreenProps) {
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
        <div className="callout cyan"><strong>A1 is recommended</strong><span>Best mix of 3 commitments, expected value, and a compact downtown loop.</span></div>
        <div className="quadrant-grid" aria-label="Fort Pierce territory quadrants">
          {QUADRANTS.map((quadrant) => {
            const total = Object.values(quadrant.counts).reduce((sum, value) => sum + value, 0);
            return (
              <button key={quadrant.id} className={quadrant.id === "A1" ? "quadrant recommended" : "quadrant"} onClick={() => onViewQuadrant(quadrant.id)} aria-label={`${quadrant.id}, ${total} opportunities${quadrant.id === "A1" ? ", recommended" : ""}`}>
                <strong>{quadrant.id}</strong><span>{total} opps</span>
              </button>
            );
          })}
        </div>
        <div className="legend-row"><span><i className="legend-dot cyan-dot" />Recommended</span><span><i className="legend-dot blue-dot" />Available</span><span>No artificial locks</span></div>
      </div>
    </section>
  );
}

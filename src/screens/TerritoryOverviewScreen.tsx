import { QUADRANTS } from '../data/territory_grid'
import type { Quadrant } from '../data/territory_grid'
import type { QuadrantStatus } from '../types'

interface TerritoryOverviewScreenProps {
  onViewQuadrant: (id: string) => void
}

const STATUS_COLOR: Record<QuadrantStatus, { bg: string; border: string; text: string; label: string }> = {
  active:    { bg: 'rgba(34,211,238,0.15)', border: '#22d3ee', text: '#22d3ee',  label: 'Active' },
  completed: { bg: 'rgba(16,185,129,0.12)', border: '#10b981', text: '#10b981',  label: 'Done' },
  locked:    { bg: 'rgba(13,17,27,0.7)',    border: '#1a2236', text: '#2d3748',  label: 'Locked' },
}

// Ordered 4×6 grid in display order (rows 1→6, cols A→D)
const DISPLAY_GRID: Quadrant[][] = []
for (let r = 1; r <= 6; r++) {
  DISPLAY_GRID.push(QUADRANTS.filter((q) => q.row === r).sort((a, b) => a.col.localeCompare(b.col)))
}

export function TerritoryOverviewScreen({ onViewQuadrant }: TerritoryOverviewScreenProps) {
  const active = QUADRANTS.find((q) => q.status === 'active')
  const completed = QUADRANTS.filter((q) => q.status === 'completed').length
  const locked = QUADRANTS.filter((q) => q.status === 'locked').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '11px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
        <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8, marginBottom: 3 }}>
          ● ASSIGNED TERRITORY · 34950
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0', lineHeight: 1.2 }}>
            90210 Corridor
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { v: `${completed}`, label: 'Done', color: '#10b981' },
              { v: '1',            label: 'Active', color: '#22d3ee' },
              { v: `${locked}`,    label: 'Locked', color: '#374151' },
            ].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: 'DM Mono,monospace', lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 9, color: '#4b5563', fontFamily: 'DM Mono,monospace', marginTop: 1 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Control strip */}
        <div style={{ display: 'flex', gap: 6, marginTop: 9 }}>
          {['Territory', 'Active quadrant', "Today's work"].map((label, i) => (
            <button key={label} style={{
              flex: 1, padding: '5px 0', borderRadius: 8, border: `1px solid ${i === 0 ? '#22d3ee' : '#1a2236'}`,
              background: i === 0 ? 'rgba(34,211,238,0.1)' : '#0d1117',
              color: i === 0 ? '#22d3ee' : '#374151',
              fontSize: 9, fontFamily: 'DM Mono,monospace', cursor: 'pointer',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '10px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* 4×6 grid */}
        <div>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, marginBottom: 3, paddingLeft: 0 }}>
            {['A', 'B', 'C', 'D'].map((col) => (
              <div key={col} style={{ textAlign: 'center', fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151' }}>{col}</div>
            ))}
          </div>

          {/* Rows */}
          {DISPLAY_GRID.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3, marginBottom: 3 }}>
              {row.map((q) => {
                const cfg = STATUS_COLOR[q.status]
                const isActive = q.status === 'active'
                return (
                  <button
                    key={q.id}
                    onClick={() => isActive ? onViewQuadrant(q.id) : undefined}
                    style={{
                      height: 34, borderRadius: 6,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      color: cfg.text,
                      fontSize: 10, fontFamily: 'DM Mono,monospace', fontWeight: isActive ? 700 : 400,
                      cursor: isActive ? 'pointer' : 'default',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      position: 'relative',
                      boxShadow: isActive ? '0 0 8px rgba(34,211,238,0.25)' : 'none',
                    }}
                  >
                    <span>{q.id}</span>
                    {isActive && <span style={{ fontSize: 7, opacity: 0.8 }}>▶ tap</span>}
                    {q.status === 'completed' && <span style={{ fontSize: 9 }}>✓</span>}
                    {/* Snake order for locked/unlocked preview */}
                    {q.status === 'locked' && q.snakeOrder <= 6 && (
                      <span style={{ fontSize: 7, color: '#1d2535' }}>#{q.snakeOrder}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ background: '#0d1117', border: '1px solid #131720', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 8, letterSpacing: 0.5 }}>LEGEND</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { color: '#22d3ee', label: 'Active quadrant', detail: 'Current working quadrant' },
              { color: '#10b981', label: 'Completed',       detail: 'All eligible stops worked' },
              { color: '#1a2236', label: 'Locked',          detail: 'Unlocks after active completes' },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#9ba3b8' }}>{item.label}</span>
                <span style={{ fontSize: 10, color: '#374151', fontFamily: 'DM Mono,monospace', marginLeft: 'auto' }}>{item.detail}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 2, background: '#22d3ee', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#9ba3b8' }}>Territory boundary</span>
            </div>
          </div>
        </div>

        {/* Active quadrant callout */}
        {active && (
          <div style={{
            background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 14, padding: '12px 13px',
          }}>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.7, marginBottom: 6 }}>
              ● ACTIVE QUADRANT
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0', marginBottom: 8 }}>
              {active.id} — Northwest Sector
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[
                { v: active.counts.newDoor,  label: 'New doors', color: '#10b981' },
                { v: active.counts.reloop,   label: 'Reloops',   color: '#f59e0b' },
                { v: active.counts.followUp, label: 'Follow-ups', color: '#22d3ee' },
                { v: active.counts.retention, label: 'Retention', color: '#8b5cf6' },
              ].map((s) => (
                <div key={s.label} style={{ flex: 1, textAlign: 'center', background: '#0d1117', borderRadius: 8, padding: '7px 0' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: 'DM Mono,monospace', lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontSize: 8, color: '#374151', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => onViewQuadrant(active.id)}
              style={{
                width: '100%', padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg,#0c2a5e,#22d3ee)',
                color: '#fff', fontSize: 14, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span>Enter {active.id} →</span>
            </button>
          </div>
        )}

        {/* Next unlock preview */}
        <div style={{ background: '#0d1117', border: '1px solid #131720', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#0a0c14', border: '1px solid #1a2236', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#2d3748' }}>B1</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#4b5563' }}>Next unlock — B1</div>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#2d3748', marginTop: 2 }}>Unlocks after A1 is marked complete</div>
          </div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#1a2236' }}>🔒</div>
        </div>
      </div>
    </div>
  )
}

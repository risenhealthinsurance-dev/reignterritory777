import { QUADRANTS, A1_STOPS, BADGE_CONFIG } from '../data/territory_grid'

interface ActiveQuadrantScreenProps {
  quadrantId: string
  onPlanRoute: () => void
  onBack: () => void
}

export function ActiveQuadrantScreen({ quadrantId, onPlanRoute, onBack }: ActiveQuadrantScreenProps) {
  const quadrant = QUADRANTS.find((q) => q.id === quadrantId)
  if (!quadrant) return null

  const { counts } = quadrant
  const totalStops = counts.newDoor + counts.reloop + counts.followUp + counts.retention
  const recommended = A1_STOPS[0] // First follow-up (Meridian) is highest priority

  // Empty quadrant edge state
  if (totalStops === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '11px 14px 10px', borderBottom: '1px solid #111520' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 8 }}>← Territory</button>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8 }}>● {quadrantId} · ACTIVE QUADRANT</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <div style={{ fontSize: 32 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eaf0', textAlign: 'center' }}>No eligible stops</div>
          <div style={{ fontSize: 12, color: '#6b7490', textAlign: 'center', lineHeight: 1.5 }}>
            All accounts in this quadrant have been visited or have no pending actions. Field AI will suggest the next quadrant.
          </div>
          <button onClick={onBack} style={{ padding: '11px 24px', borderRadius: 12, border: '1px solid #1a2030', background: 'transparent', color: '#6b7490', cursor: 'pointer', fontSize: 13 }}>
            ← Back to Territory
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '11px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          ← Territory overview
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8, marginBottom: 3 }}>
              ● {quadrantId} · ACTIVE QUADRANT
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Northwest Sector</div>
          </div>
          <div style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)', borderRadius: 10, padding: '5px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#22d3ee', fontFamily: 'DM Mono,monospace', lineHeight: 1 }}>{totalStops}</div>
            <div style={{ fontSize: 8, color: '#6b7490', fontFamily: 'DM Mono,monospace', marginTop: 1 }}>STOPS</div>
          </div>
        </div>

        {/* Stop type counts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
          {[
            { v: counts.followUp,  label: 'Follow-ups',  color: '#22d3ee', bg: 'rgba(34,211,238,0.08)' },
            { v: counts.reloop,    label: 'Reloops',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
            { v: counts.retention, label: 'Retention',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
            { v: counts.newDoor,   label: 'New doors',   color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
          ].map((s) => (
            <div key={s.label} style={{
              background: s.bg, borderRadius: 10, padding: '8px 0', textAlign: 'center',
              border: `1px solid ${s.color}22`,
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color, fontFamily: 'DM Mono,monospace', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 8, color: '#374151', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '10px 14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Cluster summary (simulated group markers) */}
        <div style={{ background: '#0d1117', border: '1px solid #131720', borderRadius: 14, padding: '11px 12px' }}>
          <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 0.5, marginBottom: 8 }}>STOP CLUSTERS IN QUADRANT</div>
          {[
            { zone: 'Beverly Hills Core',  count: 4, types: 'Follow-up, Retention, New doors', color: '#22d3ee' },
            { zone: 'West Hollywood Strip', count: 2, types: 'New doors', color: '#10b981' },
            { zone: 'Westside Corridor',   count: 2, types: 'Reloop, New door', color: '#f59e0b' },
          ].map((cluster) => (
            <div key={cluster.zone} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #111520' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `${cluster.color}22`, border: `2px solid ${cluster.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: cluster.color, fontFamily: 'DM Mono,monospace',
                flexShrink: 0,
              }}>{cluster.count}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#c8cbd6' }}>{cluster.zone}</div>
                <div style={{ fontSize: 10, color: '#6b7490', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>{cluster.types}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommended next stop */}
        <div>
          <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 0.5, marginBottom: 6 }}>RECOMMENDED FIRST STOP</div>
          <div style={{
            background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 14, padding: '12px 13px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                  <span style={{
                    fontSize: 9, fontFamily: 'DM Mono,monospace',
                    color: BADGE_CONFIG[recommended.type].color,
                    background: BADGE_CONFIG[recommended.type].bg,
                    borderRadius: 5, padding: '2px 7px',
                  }}>{BADGE_CONFIG[recommended.type].label}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', lineHeight: 1.2, marginBottom: 4 }}>{recommended.name}</div>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#6b7490' }}>{recommended.address}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#c8cbd6', fontFamily: 'DM Mono,monospace' }}>{recommended.eta}</div>
                <div style={{ fontSize: 10, color: '#6b7490', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>{recommended.distance}</div>
              </div>
            </div>
            <div style={{ background: '#0d1117', borderRadius: 8, padding: '8px 10px', marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 3 }}>WHY THIS STOP</div>
              <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.45 }}>{recommended.reason}</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onPlanRoute}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#0c2a5e,#1d4ed8,#22d3ee)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span>🗺</span>
          <span>Plan today's route in {quadrantId}</span>
        </button>
      </div>
    </div>
  )
}

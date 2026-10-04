import type { Account } from '../data/accounts'

export interface MapFallbackProps {
  height: number
  accounts: Account[]
  activeAccountId: string | null
  doneAccountIds: string[]
  onPinTap: (id: string) => void
  showTerritoryMode?: boolean
}

const PIN_POSITIONS = [
  ['16%', '66%'],
  ['34%', '32%'],
  ['49%', '57%'],
  ['65%', '27%'],
  ['78%', '63%'],
  ['88%', '42%'],
] as const

export function MapFallback({
  height,
  accounts,
  activeAccountId,
  doneAccountIds,
  onPinTap,
  showTerritoryMode = false,
}: MapFallbackProps) {
  const doneCount = doneAccountIds.length

  return (
    <div
      aria-label={showTerritoryMode ? 'Territory map fallback' : 'Route map fallback'}
      style={{
        position: 'relative',
        width: '100%',
        height,
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 65% 25%, rgba(34,211,238,.1), transparent 28%), linear-gradient(145deg,#101827,#070a11 62%)',
      }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, opacity: 0.28, backgroundImage: 'linear-gradient(rgba(88,110,145,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(88,110,145,.18) 1px,transparent 1px)', backgroundSize: '38px 38px', transform: 'rotate(-8deg) scale(1.15)' }} />
      {!showTerritoryMode && <div aria-hidden="true" style={{ position: 'absolute', left: '12%', top: '48%', width: '80%', height: 4, borderRadius: 99, background: 'linear-gradient(90deg,#1d4ed8,#22d3ee)', transform: 'rotate(-14deg)', boxShadow: '0 0 14px rgba(34,211,238,.35)' }} />}
      {showTerritoryMode && (
        <div aria-hidden="true" style={{ position: 'absolute', inset: '60px 35px 34px', border: '2px solid rgba(34,211,238,.6)', backgroundImage: 'linear-gradient(rgba(34,211,238,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(34,211,238,.18) 1px,transparent 1px)', backgroundSize: '25% 16.667%', boxShadow: 'inset 0 0 50px rgba(34,211,238,.06)' }} />
      )}

      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', gap: 8, pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(6,8,16,.82)', border: `1px solid ${showTerritoryMode ? 'rgba(34,211,238,.3)' : 'rgba(255,255,255,.08)'}`, borderRadius: 14, padding: '7px 13px', color: '#22d3ee', font: '10px DM Mono,monospace', letterSpacing: 0.7 }}>
          {showTerritoryMode ? '● TERRITORY · 34950' : `● A1 · ROUTE · 34950 · ${doneCount}/${accounts.length} done`}
        </div>
        <div style={{ background: 'rgba(6,8,16,.82)', border: '1px solid rgba(255,255,255,.08)', borderRadius: 14, padding: '7px 13px', color: showTerritoryMode ? '#22d3ee' : '#6b7490', font: '10px DM Mono,monospace', whiteSpace: 'nowrap' }}>
          {showTerritoryMode ? 'A1 ACTIVE · 23 locked' : '14.4 mi · A1 loop'}
        </div>
      </div>

      {!showTerritoryMode && accounts.map((account, index) => {
        const [left, top] = PIN_POSITIONS[index] ?? ['50%', '50%']
        const isDone = doneAccountIds.includes(account.id)
        const isActive = activeAccountId === account.id
        return (
          <button
            key={account.id}
            aria-label={`${account.name}, route stop ${account.routeOrder}${isDone ? ', completed' : isActive ? ', active' : ''}`}
            onClick={() => onPinTap(account.id)}
            style={{
              position: 'absolute', left, top, transform: 'translate(-50%,-50%)',
              width: 34, height: 34, borderRadius: '50%', cursor: 'pointer',
              border: `2px solid ${isDone ? '#10b981' : isActive ? '#60a5fa' : '#3b82f6'}`,
              background: isDone ? '#064e3b' : isActive ? '#1d4ed8' : '#111827',
              color: '#fff', font: '700 11px DM Mono,monospace',
              boxShadow: isActive ? '0 0 0 6px rgba(59,130,246,.2),0 0 18px rgba(59,130,246,.65)' : '0 3px 12px rgba(0,0,0,.5)',
            }}
          >
            {isDone ? '✓' : account.routeOrder}
          </button>
        )
      })}

      <div style={{ position: 'absolute', left: 12, bottom: 10, padding: '5px 9px', borderRadius: 9, background: 'rgba(6,8,16,.75)', color: '#6b7490', font: '9px DM Mono,monospace' }}>
        MAP PREVIEW · ADD MAPBOX TOKEN FOR LIVE MAP
      </div>
    </div>
  )
}

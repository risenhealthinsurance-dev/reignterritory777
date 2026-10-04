import type { RouteCardData } from '../../types'

interface RouteCardProps {
  data: RouteCardData
  onStartNavigation?: () => void
}

function fmtTime(mins: number) {
  if (mins === 0) return 'Now'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `+${m}m`
  return `+${h}h ${m}m`
}

export function RouteCard({ data, onStartNavigation }: RouteCardProps) {
  const hours = Math.floor(data.totalMinutes / 60)
  const mins = data.totalMinutes % 60

  return (
    <div className="ai-card">
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-3" style={{ borderBottom: '1px solid #1a2236', background: '#0a0f1a' }}>
        {[
          { label: 'STOPS', value: String(data.stops.length) },
          { label: 'MILES', value: `${data.totalMiles}` },
          { label: 'DRIVE', value: `${hours}h ${mins}m` },
        ].map((s) => (
          <div key={s.label} className="flex flex-col">
            <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">{s.label}</span>
            <span className="text-sm font-mono font-medium text-[#22d3ee]">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Stop list */}
      <div className="px-4 py-3 flex flex-col">
        {data.stops.map((stop, i) => (
          <div key={stop.accountId} className="flex items-stretch gap-3">
            {/* Timeline column */}
            <div className="flex flex-col items-center w-7 shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-medium shrink-0"
                style={{
                  background: i === 0 ? '#3b82f6' : '#0f1a2e',
                  border: `2px solid ${i === 0 ? '#60a5fa' : '#1e3050'}`,
                  color: i === 0 ? '#fff' : '#60a5fa',
                }}
              >
                {i + 1}
              </div>
              {i < data.stops.length - 1 && (
                <div className="w-px flex-1 my-1" style={{ background: '#1e3050', minHeight: 16 }} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-3 flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-[#e8eaf0] leading-tight">{stop.name}</span>
                <span className="text-[11px] font-mono text-[#4b5563] mt-0.5">{stop.address}</span>
                {stop.distanceMiles > 0 && (
                  <span className="text-[10px] font-mono text-[#374151] mt-0.5">{stop.distanceMiles} mi from prev</span>
                )}
              </div>
              <span className="text-[11px] font-mono text-[#3b82f6] ml-2 mt-0.5 shrink-0">{fmtTime(stop.etaMinutes)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={onStartNavigation}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 16px rgba(37,99,235,0.35)' }}
          onMouseDown={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)' }}
          onMouseUp={(e) => { (e.currentTarget as HTMLElement).style.transform = '' }}
        >
          Start Navigation
        </button>
      </div>
    </div>
  )
}

import type { SummaryCardData } from '../../types'

interface SummaryCardProps {
  data: SummaryCardData
  onSend?: () => void
}

export function SummaryCard({ data, onSend }: SummaryCardProps) {
  const stats = [
    { label: 'VISITED', value: String(data.accountsVisited), color: '#22d3ee' },
    { label: 'CALLS', value: String(data.callsLogged), color: '#a78bfa' },
    { label: 'SALES', value: String(data.salesMade), color: '#4ade80' },
    { label: 'MILES', value: `${data.milesDriven}`, color: '#fb923c' },
  ]

  return (
    <div className="ai-card">
      <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid #1a2236' }}>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">EOD SUMMARY</span>
          <span className="text-[9px] font-mono text-[#374151]">·</span>
          <span className="text-[9px] font-mono text-[#4b5563]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-px p-3" style={{ background: '#1a2236' }}>
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center py-3" style={{ background: '#0d1117' }}>
            <span className="text-[22px] font-mono font-semibold" style={{ color: s.color }}>{s.value}</span>
            <span className="text-[8px] font-mono text-[#4b5563] tracking-widest mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Top accounts */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #1a2236' }}>
        <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">TOP INTERACTIONS</span>
        <div className="mt-2 flex flex-col gap-2">
          {data.topAccounts.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5"
                style={{ background: '#0f1a2e', border: '1px solid #1e3050', color: '#60a5fa' }}
              >
                {i + 1}
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#c8cbd6]">{a.name}</p>
                <p className="text-[10px] font-mono text-[#4b5563] mt-0.5">{a.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 pb-3">
        <button
          onClick={onSend}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
          style={{ background: '#13161d', color: '#9ba3b8', border: '1px solid #1e2230' }}
          onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = '#3b82f6'; el.style.color = '#93c5fd' }}
          onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = '#1e2230'; el.style.color = '#9ba3b8' }}
        >
          📤 Send to Manager
        </button>
      </div>
    </div>
  )
}

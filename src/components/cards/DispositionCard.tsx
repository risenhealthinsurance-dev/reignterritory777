import { useState } from 'react'
import type { DispositionCardData } from '../../types'

interface DispositionCardProps {
  data: DispositionCardData
  onUpdate?: (outcome: string, note?: string) => void
}

const OUTCOMES = [
  { key: 'sold', label: '✅ Sold', color: '#4ade80', bg: '#0d2013' },
  { key: 'callback', label: '📞 Callback', color: '#3b82f6', bg: '#0d1a35' },
  { key: 'not-interested', label: '🚫 Not Interested', color: '#f87171', bg: '#2d1010' },
  { key: 'not-available', label: '🏃 Not Available', color: '#fb923c', bg: '#2d1a0d' },
  { key: 'left-info', label: '📬 Left Info', color: '#a78bfa', bg: '#1a1035' },
  { key: 'next-visit', label: '⏭ Next Visit', color: '#22d3ee', bg: '#0d1f24' },
]

export function DispositionCard({ data: _data, onUpdate }: DispositionCardProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = () => {
    if (!selected) return
    setConfirmed(true)
    onUpdate?.(selected, note || undefined)
  }

  if (confirmed) {
    const outcome = OUTCOMES.find((o) => o.key === selected)
    return (
      <div className="ai-card px-4 py-4 flex items-center gap-3">
        <span className="text-lg">✅</span>
        <div>
          <p className="text-[13px] font-medium text-[#e8eaf0]">Disposition logged</p>
          <p className="text-[11px] font-mono text-[#6b7490]">{outcome?.label.replace(/^[^\s]+\s/, '')} · {note || 'No notes'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ai-card">
      <div className="px-4 pt-3 pb-2" style={{ borderBottom: '1px solid #1a2236' }}>
        <span className="text-[9px] font-mono text-[#4b5563] tracking-widest">SELECT OUTCOME</span>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3">
        {OUTCOMES.map((o) => {
          const isSelected = selected === o.key
          return (
            <button
              key={o.key}
              onClick={() => setSelected(isSelected ? null : o.key)}
              className="py-2.5 px-3 rounded-xl text-[12px] font-medium text-left transition-all"
              style={{
                background: isSelected ? o.bg : '#0f1218',
                border: `1.5px solid ${isSelected ? o.color : '#1e2230'}`,
                color: isSelected ? o.color : '#6b7490',
                transform: isSelected ? 'scale(0.97)' : '',
              }}
            >
              {o.label}
            </button>
          )
        })}
      </div>

      {/* Notes field — slides in when outcome selected */}
      <div
        style={{
          maxHeight: selected ? 120 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease',
        }}
      >
        <div className="px-3 pb-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)..."
            rows={2}
            className="w-full rounded-xl px-3 py-2.5 text-[12px] resize-none outline-none"
            style={{
              background: '#0d1117',
              border: '1px solid #1e2a3a',
              color: '#c8cbd6',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>
      </div>

      {/* Confirm CTA */}
      <div className="px-3 pb-3">
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all"
          style={{
            background: selected ? '#3b82f6' : '#1e2230',
            color: selected ? '#fff' : '#4b5563',
          }}
        >
          Confirm & Log
        </button>
      </div>
    </div>
  )
}

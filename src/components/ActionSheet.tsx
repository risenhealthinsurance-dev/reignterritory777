interface ActionSheetProps {
  open: boolean
  onClose: () => void
  onAction: (action: string) => void
}

const ACTIONS = [
  { icon: '📷', label: 'Photo', action: 'photo' },
  { icon: '🎤', label: 'Voice Note', action: 'voice' },
  { icon: '📍', label: 'Drop Pin', action: 'pin' },
  { icon: '📎', label: 'Attach File', action: 'file' },
  { icon: '🗺', label: 'Plan Route', action: 'route' },
]

export function ActionSheet({ open, onClose, onAction }: ActionSheetProps) {
  if (!open) return null

  return (
    <>
      <div className="action-sheet-backdrop" onClick={onClose} />
      <div
        className="action-sheet"
        style={{ transform: open ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div className="flex justify-center mb-4">
          <div className="w-9 h-1 rounded-full" style={{ background: '#2d3340' }} />
        </div>
        <p className="text-[11px] font-mono text-[#4b5563] tracking-widest mb-4">ADD TO CHAT</p>
        <div className="flex gap-3 justify-around">
          {ACTIONS.map((a) => (
            <button
              key={a.action}
              onClick={() => { onAction(a.action); onClose() }}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                style={{ background: '#1e2230', border: '1px solid #2d3340' }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.background = '#1e2a40'; el.style.borderColor = '#3b82f6' }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.background = '#1e2230'; el.style.borderColor = '#2d3340' }}
              >
                {a.icon}
              </div>
              <span className="text-[11px] font-mono text-[#6b7490]">{a.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-xl text-[13px] font-medium transition-all"
          style={{ background: '#1e2230', color: '#6b7490' }}
        >
          Cancel
        </button>
      </div>
    </>
  )
}

import { useState } from 'react'
import type { Account } from '../data/accounts'
import type { OutcomeKey, DraftDisposition } from '../types'
import { OUTCOME_CONFIG } from '../data/territory'

interface DispositionScreenProps {
  account: Account
  onConfirm: (draft: DraftDisposition) => void
  onCancel: () => void
}

const NEXT_ACTIONS = [
  'Send follow-up email today',
  'Call back within 48 hours',
  'Send proposal by Friday',
  'Schedule product demo',
  'Escalate to manager',
  'No action needed',
]

type Step = 'draft' | 'review' | 'success'

export function DispositionScreen({ account, onConfirm, onCancel }: DispositionScreenProps) {
  const [step, setStep] = useState<Step>('draft')
  const [outcome, setOutcome] = useState<OutcomeKey | null>(null)
  const [note, setNote] = useState('')
  const [nextAction, setNextAction] = useState(NEXT_ACTIONS[0])

  const canReview = outcome !== null

  if (step === 'success') {
    const conf = outcome ? OUTCOME_CONFIG[outcome] : null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, marginBottom: 16,
          boxShadow: '0 0 32px rgba(16,185,129,0.25)',
        }}>✓</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#e8eaf0', marginBottom: 6, textAlign: 'center' }}>
          Visit logged
        </div>
        <div style={{ fontSize: 12, color: '#6b7490', textAlign: 'center', lineHeight: 1.5, fontFamily: 'DM Mono,monospace', marginBottom: 4 }}>
          {conf?.label} · {account.name}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28,
          fontSize: 10, fontFamily: 'DM Mono,monospace',
          color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
          borderRadius: 8, padding: '4px 10px',
        }}>
          <span>⚡</span>
          <span>Local only · will sync when online</span>
        </div>
        <button
          onClick={() => onConfirm({ stopId: account.id, outcome: outcome!, note, nextAction })}
          style={{
            width: '100%', maxWidth: 280, padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            boxShadow: '0 4px 20px rgba(29,78,216,0.4)',
          }}
        >
          Back to Route
        </button>
      </div>
    )
  }

  if (step === 'review') {
    const conf = outcome ? OUTCOME_CONFIG[outcome] : null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '12px 14px', borderBottom: '1px solid #111520' }}>
          <button onClick={() => setStep('draft')} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 8 }}>
            ← Edit draft
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Review before saving</div>
          <div style={{ fontSize: 11, color: '#6b7490', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>
            This will be saved locally. Review carefully — confirm once, not twice.
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Confirmation card */}
          <div style={{
            background: '#0d1117', border: '1px solid #1a2030', borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #111520', background: '#090b11' }}>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 3 }}>ACCOUNT</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#e8eaf0' }}>{account.name}</div>
            </div>

            {[
              { label: 'OUTCOME', value: conf?.label ?? '', color: conf?.color, icon: conf?.icon },
              { label: 'NOTES', value: note || '(no notes added)', color: undefined, icon: undefined },
              { label: 'NEXT ACTION', value: nextAction, color: undefined, icon: undefined },
              { label: 'SAVE STATUS', value: 'Local only · not synced', color: '#f59e0b', icon: undefined },
              { label: 'TIMESTAMP', value: new Date().toLocaleString(), color: undefined, icon: undefined },
            ].map((row) => (
              <div key={row.label} style={{ padding: '9px 12px', borderBottom: '1px solid #111520' }}>
                <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontSize: 12, color: row.color ?? '#9ba3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {row.icon && <span>{row.icon}</span>}
                  <span>{row.value}</span>
                </div>
              </div>
            ))}

            <div style={{ padding: '9px 12px' }}>
              <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 3 }}>WHAT HAPPENS NEXT</div>
              <div style={{ fontSize: 11, color: '#6b7490', lineHeight: 1.4 }}>
                This record saves to your device immediately. Once you regain connectivity, it will sync to Salesforce automatically. You can view all unsynced records in EOD Summary.
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, padding: '10px 12px',
            display: 'flex', alignItems: 'flex-start', gap: 9,
          }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>⚡</span>
            <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.4 }}>
              <strong style={{ color: '#f59e0b' }}>No active connection.</strong> Your work won't be lost — this saves locally and syncs automatically when you're back online.
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: '10px 14px 16px', borderTop: '1px solid #111520', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <button
            onClick={() => setStep('success')}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#065f46,#10b981)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span>✓</span>
            <span>Looks right — confirm &amp; save</span>
          </button>
          <button
            onClick={() => setStep('draft')}
            style={{
              width: '100%', padding: '11px', borderRadius: 12, cursor: 'pointer',
              background: 'transparent', border: '1px solid #1a2030',
              color: '#6b7490', fontSize: 12,
            }}
          >
            ← Go back and edit
          </button>
        </div>
      </div>
    )
  }

  // Draft step
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: '10px 14px 10px', borderBottom: '1px solid #111520' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1 }}>←</button>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 1 }}>LOG VISIT · DRAFT</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>{account.name}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <div style={{
              fontSize: 9, fontFamily: 'DM Mono,monospace',
              color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
              borderRadius: 6, padding: '3px 8px',
            }}>⚡ LOCAL ONLY</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Outcome grid */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 1, marginBottom: 8 }}>
            SELECT OUTCOME <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            {(Object.keys(OUTCOME_CONFIG) as OutcomeKey[]).map((key) => {
              const conf = OUTCOME_CONFIG[key]
              const isSelected = outcome === key
              return (
                <button
                  key={key}
                  onClick={() => setOutcome(key)}
                  style={{
                    padding: '11px 10px', borderRadius: 12, cursor: 'pointer',
                    background: isSelected ? conf.bg : '#0d1117',
                    border: `1.5px solid ${isSelected ? conf.color : '#1a2030'}`,
                    display: 'flex', alignItems: 'center', gap: 8,
                    textAlign: 'left',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 15 }}>{conf.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: isSelected ? conf.color : '#9ba3b8' }}>
                      {conf.label}
                    </div>
                  </div>
                  {isSelected && (
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: conf.color }}>✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 1, marginBottom: 6 }}>
            VISIT NOTES
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What happened? Key insights, objections, next steps discussed…"
            rows={3}
            style={{
              width: '100%', background: '#0d1117', border: '1px solid #1a2030', borderRadius: 10,
              padding: '10px 12px', color: '#c8cbd6', fontSize: 12, fontFamily: 'Inter,sans-serif',
              lineHeight: 1.5, resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Next action */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 1, marginBottom: 6 }}>
            NEXT ACTION
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {NEXT_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => setNextAction(action)}
                style={{
                  padding: '9px 12px', borderRadius: 9, cursor: 'pointer',
                  background: nextAction === action ? 'rgba(59,130,246,0.1)' : '#0d1117',
                  border: `1px solid ${nextAction === action ? '#3b82f6' : '#1a2030'}`,
                  color: nextAction === action ? '#93c5fd' : '#9ba3b8',
                  fontSize: 12, textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all .12s',
                }}
              >
                <span>{action}</span>
                {nextAction === action && <span style={{ color: '#3b82f6' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 14px 16px', borderTop: '1px solid #111520', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {!canReview && (
          <div style={{ fontSize: 11, color: '#6b7490', textAlign: 'center', fontFamily: 'DM Mono,monospace' }}>
            Select an outcome to continue
          </div>
        )}
        <button
          onClick={() => canReview && setStep('review')}
          disabled={!canReview}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            cursor: canReview ? 'pointer' : 'default',
            background: canReview ? 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' : '#131720',
            color: canReview ? '#fff' : '#4b5563',
            fontSize: 15, fontWeight: 700, transition: 'all .2s',
            boxShadow: canReview ? '0 4px 20px rgba(29,78,216,0.35)' : 'none',
          }}
        >
          Review &amp; Confirm →
        </button>
      </div>
    </div>
  )
}

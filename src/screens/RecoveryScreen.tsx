import { useState } from 'react'
import type { Account } from '../data/accounts'
import { accounts } from '../data/accounts'

interface RecoveryScreenProps {
  account: Account
  /** Pre-populate from an already-logged failed visit. No value = blank form. */
  initialFailureReason?: string
  initialRecoveryPlan?: 'skip' | 'reloop' | 'call_ahead'
  onSkip: (failureReason: string, recoveryPlan: 'skip' | 'reloop' | 'call_ahead') => void
  onReloop: (accountId: string, failureReason: string) => void
  onCallAhead: (failureReason: string) => void
  onCancel: () => void
}

type FailureReason =
  | 'no_answer'
  | 'facility_closed'
  | 'contact_unavailable'
  | 'access_denied'
  | 'other'

const FAILURE_REASONS: Record<FailureReason, { label: string; icon: string; detail: string }> = {
  no_answer:          { label: 'No answer at door', icon: '🔕', detail: 'Knocked/buzzed, no response' },
  facility_closed:    { label: 'Facility closed',   icon: '🔒', detail: 'Unexpected closure or holiday' },
  contact_unavailable:{ label: 'Contact unavailable', icon: '👤', detail: 'DM is in meetings or out of office' },
  access_denied:      { label: 'Access denied',     icon: '🚫', detail: "Security wouldn't allow entry" },
  other:              { label: 'Other reason',       icon: '📝', detail: 'Explain in notes' },
}

type RecoveryChoice = 'skip' | 'reloop' | 'call_ahead'

const RECOVERY_OPTIONS: Record<RecoveryChoice, { label: string; icon: string; description: string; etaNote: string; color: string }> = {
  skip:       { label: 'Skip for today', icon: '⏭', description: 'Move to next stop. Mark as not visited. Field AI will auto-schedule a follow-up.', etaNote: 'No ETA impact', color: '#6b7490' },
  reloop:     { label: 'Reloop after next stop', icon: '🔄', description: 'Complete next stop, then return here. Best if contact is temporarily unavailable.', etaNote: '+28 min total ETA', color: '#f59e0b' },
  call_ahead: { label: 'Call ahead first', icon: '📞', description: 'Call contact now to confirm availability before driving back. Saves a wasted trip.', etaNote: 'ETA unchanged', color: '#3b82f6' },
}

/** Match a stored human-readable reason string back to a FailureReason key. */
function guessReasonKey(stored: string): FailureReason | null {
  for (const [key, val] of Object.entries(FAILURE_REASONS) as [FailureReason, typeof FAILURE_REASONS[FailureReason]][]) {
    if (stored.toLowerCase().includes(val.label.toLowerCase())) return key
  }
  return null
}

export function RecoveryScreen({ account, initialFailureReason, initialRecoveryPlan, onSkip, onReloop, onCallAhead, onCancel }: RecoveryScreenProps) {
  const [reason, setReason] = useState<FailureReason | null>(
    initialFailureReason ? guessReasonKey(initialFailureReason) : null
  )
  const [note, setNote] = useState(initialFailureReason ?? '')
  const [choice, setChoice] = useState<RecoveryChoice | null>(initialRecoveryPlan ?? null)
  const [showConfirm, setShowConfirm] = useState(false)

  const nearby = accounts.filter((a) => a.id !== account.id).slice(0, 3)
  const canProceed = reason !== null && choice !== null

  if (showConfirm && choice) {
    const opt = RECOVERY_OPTIONS[choice]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '12px 14px', borderBottom: '1px solid #111520' }}>
          <button onClick={() => setShowConfirm(false)} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 8 }}>← Edit</button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Confirm recovery plan</div>
          <div style={{ fontSize: 11, color: '#6b7490', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>This logs a failed visit and updates your route</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#0d1117', border: '1px solid #1a2030', borderRadius: 14, overflow: 'hidden' }}>
            {[
              { label: 'ACCOUNT', value: account.name },
              { label: 'FAILURE REASON', value: reason ? FAILURE_REASONS[reason].label : '' },
              { label: 'NOTES', value: note || '(none)' },
              { label: 'RECOVERY PLAN', value: opt.label, color: opt.color },
              { label: 'ETA IMPACT', value: opt.etaNote },
              { label: 'SAVE STATUS', value: 'Local only · not synced', color: '#f59e0b' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ padding: '9px 12px', borderBottom: i < arr.length - 1 ? '1px solid #111520' : 'none' }}>
                <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 12, color: (row as any).color ?? '#9ba3b8' }}>{row.value}</div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, padding: '10px 12px', display: 'flex', gap: 9,
          }}>
            <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ️</span>
            <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.4 }}>
              Field AI will log this as <strong style={{ color: '#e8eaf0' }}>No Contact</strong> and auto-suggest a re-engagement within 3 days.
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: '10px 14px 16px', borderTop: '1px solid #111520', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <button
            onClick={() => {
              const reasonLabel = reason ? FAILURE_REASONS[reason].label : 'Unknown'
              if (choice === 'skip') onSkip(reasonLabel, 'skip')
              else if (choice === 'reloop') onReloop(account.id, reasonLabel)
              else if (choice === 'call_ahead') onCallAhead(reasonLabel)
            }}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#92400e,#f59e0b)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span>{opt.icon}</span>
            <span>Confirm — {opt.label}</span>
          </button>
          <button onClick={() => setShowConfirm(false)} style={{ width: '100%', padding: '11px', borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px solid #1a2030', color: '#6b7490', fontSize: 12 }}>
            ← Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flexShrink: 0, padding: '10px 14px', borderBottom: '1px solid #111520' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              width: 32, height: 44, background: 'none', border: 'none',
              color: '#6b7490', cursor: 'pointer', fontSize: 20, padding: 0,
              lineHeight: 1, display: 'flex', alignItems: 'center', flexShrink: 0,
            }}
            aria-label="Back to Route"
          >←</button>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#ef4444', letterSpacing: 1 }}>
              ⚠ {initialFailureReason ? 'EDIT RECOVERY PLAN' : 'VISIT FAILED · RECOVERY'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>{account.name}</div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* What happened */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 1, marginBottom: 8 }}>
            WHAT HAPPENED? <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(Object.entries(FAILURE_REASONS) as [FailureReason, typeof FAILURE_REASONS[FailureReason]][]).map(([key, val]) => {
              const sel = reason === key
              return (
                <button key={key} onClick={() => setReason(key)} style={{
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                  background: sel ? 'rgba(239,68,68,0.08)' : '#0d1117',
                  border: `1.5px solid ${sel ? '#ef4444' : '#1a2030'}`,
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  transition: 'all .12s',
                }}>
                  <span style={{ fontSize: 16 }}>{val.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: sel ? '#fca5a5' : '#9ba3b8' }}>{val.label}</div>
                    <div style={{ fontSize: 10, color: '#374151', fontFamily: 'DM Mono,monospace', marginTop: 1 }}>{val.detail}</div>
                  </div>
                  {sel && <span style={{ color: '#ef4444', fontSize: 14 }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 1, marginBottom: 6 }}>NOTES</div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What did you observe? Any useful context for next visit…"
            rows={2}
            style={{
              width: '100%', background: '#0d1117', border: '1px solid #1a2030', borderRadius: 10,
              padding: '10px 12px', color: '#c8cbd6', fontSize: 12, fontFamily: 'Inter,sans-serif',
              lineHeight: 1.5, resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* ETA impact box */}
        <div style={{
          background: '#0d1117', border: '1px solid #1a2030', borderRadius: 12,
          padding: '9px 12px',
        }}>
          <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 5 }}>ROUTE IMPACT</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9ba3b8', fontFamily: 'DM Mono,monospace' }}>4</div>
              <div style={{ fontSize: 9, color: '#374151', fontFamily: 'DM Mono,monospace' }}>STOPS LEFT</div>
            </div>
            <div style={{ width: 1, background: '#1a2030' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', fontFamily: 'DM Mono,monospace' }}>4:42 PM</div>
              <div style={{ fontSize: 9, color: '#374151', fontFamily: 'DM Mono,monospace' }}>EST. DONE</div>
            </div>
            <div style={{ width: 1, background: '#1a2030' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#9ba3b8', fontFamily: 'DM Mono,monospace' }}>3</div>
              <div style={{ fontSize: 9, color: '#374151', fontFamily: 'DM Mono,monospace' }}>NEARBY</div>
            </div>
          </div>
        </div>

        {/* Nearby accounts */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 1, marginBottom: 7 }}>
            NEARBY ELIGIBLE STOPS
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nearby.map((acc) => (
              <div key={acc.id} style={{
                background: '#0d1117', border: '1px solid #1a2030', borderRadius: 10,
                padding: '8px 11px', display: 'flex', alignItems: 'center', gap: 9,
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  background: '#131720', border: '1px solid #1e2535',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#6b7490',
                }}>{acc.routeOrder}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#c8cbd6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</div>
                  <div style={{ fontSize: 9, color: '#374151', fontFamily: 'DM Mono,monospace' }}>{(acc.revenue / 1000000).toFixed(1)}M rev · {acc.tier}</div>
                </div>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151' }}>0.{acc.routeOrder}mi</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery options */}
        <div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 1, marginBottom: 8 }}>
            CHOOSE YOUR RECOVERY <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {(Object.entries(RECOVERY_OPTIONS) as [RecoveryChoice, typeof RECOVERY_OPTIONS[RecoveryChoice]][]).map(([key, val]) => {
              const sel = choice === key
              return (
                <button key={key} onClick={() => setChoice(key)} style={{
                  padding: '11px 12px', borderRadius: 12, cursor: 'pointer',
                  background: sel ? `${val.color}14` : '#0d1117',
                  border: `1.5px solid ${sel ? val.color : '#1a2030'}`,
                  display: 'flex', alignItems: 'flex-start', gap: 10, textAlign: 'left',
                  transition: 'all .12s',
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{val.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: sel ? val.color : '#9ba3b8', marginBottom: 2 }}>{val.label}</div>
                    <div style={{ fontSize: 10, color: '#6b7490', lineHeight: 1.35, marginBottom: 4 }}>{val.description}</div>
                    <div style={{
                      display: 'inline-block', fontSize: 9, fontFamily: 'DM Mono,monospace',
                      color: sel ? val.color : '#374151',
                      background: sel ? `${val.color}18` : '#131720',
                      borderRadius: 5, padding: '2px 6px',
                    }}>{val.etaNote}</div>
                  </div>
                  {sel && <span style={{ color: val.color, fontSize: 14, flexShrink: 0 }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 14px 16px', borderTop: '1px solid #111520' }}>
        <button
          onClick={() => canProceed && setShowConfirm(true)}
          disabled={!canProceed}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            cursor: canProceed ? 'pointer' : 'default',
            background: canProceed ? 'linear-gradient(135deg,#7c2d12,#f59e0b)' : '#131720',
            color: canProceed ? '#fff' : '#4b5563',
            fontSize: 15, fontWeight: 700, transition: 'all .2s',
          }}
        >
          {canProceed ? 'Review Recovery Plan →' : 'Select reason and plan to continue'}
        </button>
      </div>
    </div>
  )
}

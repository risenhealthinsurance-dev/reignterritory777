import { useRef, useState } from 'react'
import type { Account } from '../data/accounts'
import type { FollowUpDraft } from '../types'

interface FollowUpScreenProps {
  account: Account
  onConfirm: (draft: FollowUpDraft) => void
  onCancel: () => void
}

// Schedule / Date Context — full month + year on strip and in review
interface DayOption {
  key: string          // stored value: "Thu, Oct 9, 2026"
  weekday: string      // "Thu"
  dayNum: string       // "9"
  monthLabel: string   // "Oct"
  year: string         // "2026"
}

const DAY_OPTIONS: DayOption[] = [
  { key: 'Mon, Oct 6, 2026',  weekday: 'Mon', dayNum: '6',  monthLabel: 'Oct', year: '2026' },
  { key: 'Tue, Oct 7, 2026',  weekday: 'Tue', dayNum: '7',  monthLabel: 'Oct', year: '2026' },
  { key: 'Wed, Oct 8, 2026',  weekday: 'Wed', dayNum: '8',  monthLabel: 'Oct', year: '2026' },
  { key: 'Thu, Oct 9, 2026',  weekday: 'Thu', dayNum: '9',  monthLabel: 'Oct', year: '2026' },
  { key: 'Fri, Oct 10, 2026', weekday: 'Fri', dayNum: '10', monthLabel: 'Oct', year: '2026' },
  { key: 'Mon, Oct 13, 2026', weekday: 'Mon', dayNum: '13', monthLabel: 'Oct', year: '2026' },
  { key: 'Tue, Oct 14, 2026', weekday: 'Tue', dayNum: '14', monthLabel: 'Oct', year: '2026' },
]

const TIMES = ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

const AGENDA_OPTS = [
  'Q4 proposal review',
  'Demo follow-up',
  'Contract renewal discussion',
  'Pricing negotiation',
  'Technical integration call',
  'Executive intro meeting',
]

type Step = 'draft' | 'confirm' | 'saved'

export function FollowUpScreen({ account, onConfirm, onCancel }: FollowUpScreenProps) {
  const [step, setStep] = useState<Step>('draft')
  const [dateKey, setDateKey] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [agenda, setAgenda] = useState(AGENDA_OPTS[0])
  const [customNote, setCustomNote] = useState('')
  const submittedRef = useRef(false)

  const canConfirm = dateKey && time
  const selectedDay = DAY_OPTIONS.find((d) => d.key === dateKey)

  if (step === 'saved') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(59,130,246,0.15)', border: '2px solid #3b82f6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 14,
          boxShadow: '0 0 28px rgba(59,130,246,0.2)',
        }}>📅</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#e8eaf0', marginBottom: 6, textAlign: 'center' }}>
          Follow-up scheduled
        </div>
        <div style={{ fontSize: 13, color: '#9ba3b8', textAlign: 'center', lineHeight: 1.5, marginBottom: 4 }}>
          {account.contact.name}
        </div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#c8cbd6', textAlign: 'center', marginBottom: 4 }}>
          {dateKey} at {time}
        </div>
        <div style={{ fontSize: 12, color: '#6b7490', textAlign: 'center', marginBottom: 20 }}>
          {agenda}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28,
          fontSize: 10, fontFamily: 'DM Mono,monospace',
          color: '#f59e0b', background: 'rgba(245,158,11,0.1)',
          borderRadius: 8, padding: '5px 12px',
        }}>
          <span>⚡</span>
          <span>Local only · not synced · will sync when online</span>
        </div>
        <button
          onClick={() => {
            if (submittedRef.current) return
            submittedRef.current = true
            onConfirm({ stopId: account.id, date: dateKey, time, agenda })
          }}
          style={{
            width: '100%', maxWidth: 300, minHeight: 48, padding: '0 24px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
            color: '#fff', fontSize: 15, fontWeight: 700,
          }}
        >
          Back to Route
        </button>
      </div>
    )
  }

  if (step === 'confirm') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '12px 14px 10px', borderBottom: '1px solid #111520' }}>
          <button onClick={() => setStep('draft')} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 13, padding: 0, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Edit draft
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0' }}>Confirm follow-up</div>
          <div style={{ fontSize: 12, color: '#6b7490', fontFamily: 'DM Mono,monospace', marginTop: 3 }}>
            Review carefully — saves locally. Not sent until you confirm.
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#0d1117', border: '1px solid #1a2030', borderRadius: 14, overflow: 'hidden' }}>
            {[
              { label: 'ACCOUNT', value: account.name },
              { label: 'CONTACT', value: `${account.contact.name} · ${account.contact.title}` },
              // Full date with year
              { label: 'DATE', value: dateKey },
              { label: 'TIME', value: time },
              { label: 'AGENDA', value: agenda },
              { label: 'NOTES', value: customNote || '(none)' },
              { label: 'SAVE STATUS', value: 'Local only · not synced · queues for CRM when online', color: '#f59e0b' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ padding: '10px 13px', borderBottom: i < arr.length - 1 ? '1px solid #111520' : 'none' }}>
                <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 3, letterSpacing: 0.5 }}>{row.label}</div>
                <div style={{ fontSize: 13, color: (row as any).color ?? '#c8cbd6', fontWeight: row.label === 'DATE' || row.label === 'TIME' ? 600 : 400 }}>{row.value}</div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 12, padding: '10px 13px',
            display: 'flex', gap: 10,
          }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚡</span>
            <div style={{ fontSize: 12, color: '#9ba3b8', lineHeight: 1.45 }}>
              <strong style={{ color: '#f59e0b' }}>No active connection.</strong> This saves to your device immediately and syncs to Salesforce when you're back online. No data is lost.
            </div>
          </div>
        </div>

        <div style={{ flexShrink: 0, padding: '10px 14px 16px', borderTop: '1px solid #111520', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={() => setStep('saved')}
            style={{
              width: '100%', minHeight: 48, padding: '0 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              boxShadow: '0 4px 20px rgba(29,78,216,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span>✓</span>
            <span>Looks right — save locally</span>
          </button>
          <button onClick={() => setStep('draft')} style={{ width: '100%', minHeight: 44, padding: '0 16px', borderRadius: 12, cursor: 'pointer', background: 'transparent', border: '1px solid #1a2030', color: '#6b7490', fontSize: 13 }}>
            ← Edit draft
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
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 20, padding: 0, lineHeight: 1, minWidth: 32, minHeight: 44, display: 'flex', alignItems: 'center' }}>←</button>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8 }}>SCHEDULE FOLLOW-UP</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e8eaf0' }}>{account.name}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderRadius: 6, padding: '4px 8px' }}>
            ⚡ LOCAL ONLY
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 13 }}>

        {/* Contact */}
        <div style={{
          background: '#0d1117', border: '1px solid #1a2030', borderRadius: 12,
          padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, color: '#fff', fontWeight: 700,
          }}>{account.contact.name.charAt(0)}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e8eaf0' }}>{account.contact.name}</div>
            <div style={{ fontSize: 11, color: '#6b7490', fontFamily: 'DM Mono,monospace' }}>{account.contact.title}</div>
          </div>
        </div>

        {/* Date strip — Schedule / Date Context */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 9 }}>
            <div style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#6b7490', letterSpacing: 0.5 }}>
              SELECT DATE <span style={{ color: '#ef4444' }}>*</span>
            </div>
            {/* Month + year header */}
            <div style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#374151' }}>
              OCT – NOV 2026
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            {DAY_OPTIONS.map((d) => {
              const sel = dateKey === d.key
              return (
                <button
                  key={d.key}
                  onClick={() => setDateKey(d.key)}
                  title={d.key} // full date on hover
                  style={{
                    flexShrink: 0, width: 54, minHeight: 60, padding: '7px 0', borderRadius: 11, cursor: 'pointer',
                    background: sel ? 'rgba(59,130,246,0.15)' : '#0d1117',
                    border: `1.5px solid ${sel ? '#3b82f6' : '#1a2030'}`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
                    transition: 'all .12s',
                  }}
                >
                  <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: sel ? '#93c5fd' : '#6b7490' }}>{d.weekday}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: sel ? '#fff' : '#c8cbd6', fontFamily: 'DM Mono,monospace', lineHeight: 1 }}>{d.dayNum}</span>
                  <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: sel ? '#60a5fa' : '#374151' }}>{d.monthLabel}</span>
                </button>
              )
            })}
          </div>
          {/* Selected date confirmation — full format */}
          {selectedDay && (
            <div style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#3b82f6', marginTop: 6 }}>
              ✓ {selectedDay.key}
            </div>
          )}
        </div>

        {/* Time grid */}
        <div>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#6b7490', letterSpacing: 0.5, marginBottom: 9 }}>
            SELECT TIME <span style={{ color: '#ef4444' }}>*</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {TIMES.map((t) => {
              const sel = time === t
              return (
                <button key={t} onClick={() => setTime(t)} style={{
                  minHeight: 44, padding: '0 4px', borderRadius: 9, cursor: 'pointer',
                  background: sel ? 'rgba(59,130,246,0.15)' : '#0d1117',
                  border: `1.5px solid ${sel ? '#3b82f6' : '#1a2030'}`,
                  color: sel ? '#93c5fd' : '#9ba3b8',
                  fontSize: 11, fontFamily: 'DM Mono,monospace',
                  transition: 'all .12s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{t}</button>
              )
            })}
          </div>
        </div>

        {/* Agenda */}
        <div>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#6b7490', letterSpacing: 0.5, marginBottom: 8 }}>PROPOSED AGENDA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {AGENDA_OPTS.map((opt) => (
              <button key={opt} onClick={() => setAgenda(opt)} style={{
                minHeight: 44, padding: '0 13px', borderRadius: 9, cursor: 'pointer',
                background: agenda === opt ? 'rgba(59,130,246,0.1)' : '#0d1117',
                border: `1px solid ${agenda === opt ? '#3b82f6' : '#1a2030'}`,
                color: agenda === opt ? '#93c5fd' : '#9ba3b8',
                fontSize: 13, textAlign: 'left',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                transition: 'all .12s',
              }}>
                <span>{opt}</span>
                {agenda === opt && <span style={{ color: '#3b82f6' }}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono,monospace', color: '#6b7490', letterSpacing: 0.5, marginBottom: 7 }}>ADDITIONAL NOTES</div>
          <textarea
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Topics, materials to bring, context…"
            rows={2}
            style={{
              width: '100%', background: '#0d1117', border: '1px solid #1a2030', borderRadius: 10,
              padding: '11px 13px', color: '#c8cbd6', fontSize: 13, fontFamily: 'Inter,sans-serif',
              lineHeight: 1.5, resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: '10px 14px 16px', borderTop: '1px solid #111520' }}>
        <button
          onClick={() => canConfirm && setStep('confirm')}
          disabled={!canConfirm}
          style={{
            width: '100%', minHeight: 48, padding: '0 16px', borderRadius: 14, border: 'none',
            cursor: canConfirm ? 'pointer' : 'default',
            background: canConfirm ? 'linear-gradient(135deg,#1d4ed8,#0ea5e9)' : '#131720',
            color: canConfirm ? '#fff' : '#4b5563',
            fontSize: 15, fontWeight: 700, transition: 'all .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {canConfirm ? 'Review & Confirm →' : 'Select a date and time to continue'}
        </button>
      </div>
    </div>
  )
}

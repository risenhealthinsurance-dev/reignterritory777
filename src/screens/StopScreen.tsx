import type { Account } from '../data/accounts'
import type { StopRecord, QuadrantContext } from '../types'
import { SyncBadge } from '../components/SyncBadge'

interface StopScreenProps {
  account: Account
  stop: StopRecord
  onLogVisit: () => void
  onScheduleFollowUp: () => void
  onReportFailed: () => void
  onBack: () => void
  quadrantContext?: QuadrantContext
  onEnrich?: (action: string) => void
}

const AI_ACTIONS = [
  { id: 'enrich',    icon: '🔍', label: 'Enrich public information',      sub: 'Web presence, GBP, social, local search' },
  { id: 'audit',     icon: '📊', label: 'Run digital-marketing audit',     sub: 'Conversion readiness & recommendations' },
  { id: 'profile',   icon: '📋', label: 'Review proposed profile edits',   sub: 'Evidence-backed changes — requires approval' },
  { id: 'supply',    icon: '📦', label: 'Identify likely supply categories', sub: 'Amazon, Office Depot, Mighty, fleet' },
  { id: 'read',      icon: '🏢', label: 'Read business profile',           sub: 'Summary of account intel + context' },
]

const TIER_COLOR: Record<string, string> = {
  Enterprise: '#8b5cf6',
  'Mid-Market': '#3b82f6',
  SMB: '#10b981',
}

const ACTIVITY_ICON: Record<string, string> = { visit: '🏢', call: '📞', email: '✉️' }

function fmtRevenue(n: number) {
  return `$${(n / 1000000).toFixed(1)}M`
}

export function StopScreen({ account, stop, onLogVisit, onScheduleFollowUp, onReportFailed, onBack, quadrantContext, onEnrich }: StopScreenProps) {
  const daysAgo = account.lastVisitDaysAgo
  const isOverdue = daysAgo > 30

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        flexShrink: 0, padding: '10px 14px 10px',
        borderBottom: '1px solid #111520', background: '#0b0d14',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <button
            onClick={onBack}
            style={{
              width: 30, height: 30, borderRadius: 9, border: '1px solid #1a2030',
              background: '#0d1117', color: '#6b7490', cursor: 'pointer', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {quadrantContext ? (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 3 }}>
                {[`ZIP ${quadrantContext.zipCode}`, `${quadrantContext.quadrantId}`, `${quadrantContext.stopIndex}/${quadrantContext.totalStops}`].map((label) => (
                  <span key={label} style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', background: '#0d1117', border: '1px solid #1a2030', borderRadius: 4, padding: '1px 5px' }}>{label}</span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 1 }}>
                ● STOP {account.routeOrder} OF 6 · ACTIVE
              </div>
            )}
            <div style={{
              fontSize: 15, fontWeight: 700, color: '#e8eaf0',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {quadrantContext ? <span><span style={{ color: '#22d3ee' }}>@</span>{account.name}</span> : account.name}
            </div>
          </div>
          <SyncBadge status={stop.syncStatus} />
        </div>

        {/* Address block */}
        <div style={{
          background: '#0d1117', border: '1px solid #1a2030', borderRadius: 12,
          padding: '9px 12px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#c8cbd6', fontWeight: 500, lineHeight: 1.3 }}>{account.address}</div>
            <div style={{ fontSize: 11, color: '#6b7490', fontFamily: 'DM Mono,monospace', marginTop: 3 }}>
              Suite 800 · Main lobby entrance · Validated parking P3
            </div>
          </div>
          <button style={{
            flexShrink: 0, padding: '5px 10px', borderRadius: 8,
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa', fontSize: 10, fontFamily: 'DM Mono,monospace', cursor: 'pointer',
          }}>
            NAV →
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Account intel header */}
        <div style={{
          background: '#0d1117', border: '1px solid #1a2030', borderRadius: 14,
          overflow: 'hidden',
        }}>
          {/* Tier + Revenue */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px 8px',
            borderBottom: '1px solid #111520',
          }}>
            <div style={{
              fontSize: 9, fontFamily: 'DM Mono,monospace', fontWeight: 600,
              color: TIER_COLOR[account.tier] ?? '#6b7490',
              background: `${TIER_COLOR[account.tier]}1a`,
              borderRadius: 6, padding: '2px 8px',
            }}>{account.tier.toUpperCase()}</div>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#6b7490' }}>
              {account.industry.toUpperCase()}
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 700, color: '#e8eaf0' }}>
              {fmtRevenue(account.revenue)}
            </div>
          </div>

          {/* Contact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: '1px solid #111520' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff', fontWeight: 700,
            }}>
              {account.contact.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0' }}>{account.contact.name}</div>
              <div style={{ fontSize: 10, color: '#6b7490', fontFamily: 'DM Mono,monospace' }}>{account.contact.title}</div>
            </div>
            <a
              href={`tel:${account.contact.phone}`}
              style={{
                padding: '5px 10px', borderRadius: 8, textDecoration: 'none',
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                color: '#10b981', fontSize: 10, fontFamily: 'DM Mono,monospace',
              }}
            >
              📞 CALL
            </a>
          </div>

          {/* Intel bullets */}
          {[
            { icon: '🕐', label: 'LAST VISIT', value: `${daysAgo}d ago — ${account.lastVisit}`, warn: isOverdue },
            { icon: '📝', label: 'REP NOTE', value: account.notes, warn: false },
            { icon: '🎯', label: 'TODAY\'S FOCUS', value: 'Re-engage after 4-day gap. Robert is champion — board approval needed for Q4 deal. Lead with the compliance angle.', warn: false },
          ].map((item) => (
            <div key={item.label} style={{ padding: '8px 12px', borderBottom: '1px solid #111520', display: 'flex', gap: 9, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: item.warn ? '#f59e0b' : '#374151', marginBottom: 2 }}>
                  {item.label}{item.warn ? ' · OVERDUE' : ''}
                </div>
                <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.4 }}>{item.value}</div>
              </div>
            </div>
          ))}

          {/* Activity log */}
          <div style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 7, letterSpacing: 1 }}>
              RECENT ACTIVITY
            </div>
            {account.activities.map((act, i) => (
              <div key={i} style={{
                display: 'flex', gap: 8, alignItems: 'flex-start',
                paddingBottom: i < account.activities.length - 1 ? 7 : 0,
                marginBottom: i < account.activities.length - 1 ? 7 : 0,
                borderBottom: i < account.activities.length - 1 ? '1px solid #111520' : 'none',
              }}>
                <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1 }}>{ACTIVITY_ICON[act.type]}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                    <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#6b7490', textTransform: 'capitalize' }}>{act.type}</span>
                    <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151' }}>{act.date}</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.35 }}>{act.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Competitor / renewal context */}
        <div style={{
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
          borderRadius: 12, padding: '9px 12px',
          display: 'flex', alignItems: 'flex-start', gap: 9,
        }}>
          <span style={{ fontSize: 13, flexShrink: 0 }}>⚔️</span>
          <div>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#ef4444', marginBottom: 2 }}>COMPETITIVE RISK</div>
            <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.4 }}>
              Competitor Grainger rep visited Oct 1. Robert mentioned "evaluating alternatives" in Sep 29 call notes. Emphasize compliance certifications and local support.
            </div>
          </div>
        </div>

        {/* Field AI Actions — only shown when enrichment is available */}
        {onEnrich && (
          <div style={{ background: '#0d1117', border: '1px solid rgba(34,211,238,0.18)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '9px 12px 7px', borderBottom: '1px solid #111520', display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>AI</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#c8cbd6' }}>Field AI · <span style={{ color: '#22d3ee' }}>@{account.name}</span></span>
            </div>
            {AI_ACTIONS.map((action, i) => (
              <button
                key={action.id}
                onClick={() => onEnrich(action.id)}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  borderBottom: i < AI_ACTIONS.length - 1 ? '1px solid #0d1117' : 'none',
                  padding: '10px 12px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{action.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: '#c8cbd6', fontWeight: 500, lineHeight: 1.2 }}>{action.label}</div>
                  <div style={{ fontSize: 10, color: '#374151', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>{action.sub}</div>
                </div>
                <span style={{ fontSize: 11, color: '#22d3ee', flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action footer */}
      <div style={{
        flexShrink: 0, padding: '10px 14px 16px',
        borderTop: '1px solid #111520', background: '#0b0d14',
        display: 'flex', flexDirection: 'column', gap: 7,
      }}>
        <button
          onClick={onLogVisit}
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
            color: '#fff', fontSize: 15, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(29,78,216,0.4)',
          }}
        >
          <span>📋</span>
          <span>Work This Business</span>
        </button>

        <div style={{ display: 'flex', gap: 7 }}>
          <button
            onClick={onScheduleFollowUp}
            style={{
              flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer',
              background: '#0d1117', border: '1px solid #1a2030',
              color: '#9ba3b8', fontSize: 12, fontWeight: 500,
            }}
          >
            📅 Follow-up
          </button>
          <button
            onClick={onReportFailed}
            style={{
              flex: 1, padding: '11px', borderRadius: 12, cursor: 'pointer',
              background: '#0d1117', border: '1px solid rgba(239,68,68,0.2)',
              color: '#ef4444', fontSize: 12, fontWeight: 500,
            }}
          >
            🚫 No Contact
          </button>
        </div>
      </div>
    </div>
  )
}

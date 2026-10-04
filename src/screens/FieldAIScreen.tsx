import { useState, useEffect } from 'react'
import { accounts } from '../data/accounts'
import type { Account } from '../data/accounts'
import { A1_STOPS, BADGE_CONFIG, FINDING_CONFIG, OPP_CONFIG, getAuditData } from '../data/territory_grid'
import type { AuditSection, SupplyOpportunity, ProfileEdit, SalesBrief } from '../data/territory_grid'
import type { Provenance } from '../types'

type AIPhase = 'empty' | 'picker' | 'locked' | 'audit_loading' | 'audit_results' | 'edit_review'

interface FieldAIScreenProps {
  isOffline?: boolean
}

const LOADING_STEPS = [
  'Fetching public web presence…',
  'Scanning Google Business Profile…',
  'Auditing social channels…',
  'Checking local search rankings…',
  'Analyzing conversion paths…',
  'Compiling sales brief…',
]

const ELIGIBLE_ACCOUNT_IDS = A1_STOPS.filter((s) => s.accountId).map((s) => s.accountId as string)

const PROVENANCE_CONFIG: Record<Provenance, { label: string; color: string; icon: string }> = {
  public:               { label: 'Public signal',       color: '#3b82f6', icon: '🌐' },
  crm:                  { label: 'Internal CRM / call note', color: '#8b5cf6', icon: '📞' },
  rep_observation:      { label: 'Rep observation',     color: '#f59e0b', icon: '👁' },
  needs_confirmation:   { label: 'Needs confirmation',  color: '#6b7490', icon: '❓' },
}

function ProvenancePill({ provenance }: { provenance: Provenance }) {
  const cfg = PROVENANCE_CONFIG[provenance]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 8, fontFamily: 'DM Mono,monospace',
      color: cfg.color, background: `${cfg.color}14`,
      borderRadius: 4, padding: '1px 5px',
    }}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{
      width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
      border: `3px solid ${color}`, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: `${color}12`,
    }}>
      <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'DM Mono,monospace', lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 7, color: '#6b7490', fontFamily: 'DM Mono,monospace', marginTop: 1 }}>/ 100</span>
    </div>
  )
}

function ContextStrip({ account, onClear }: { account: Account; onClear: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)',
      borderRadius: 10, padding: '7px 10px',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 6px rgba(34,211,238,0.8)', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 1 }}>CONTEXT LOCKED</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#22d3ee', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          @{account.name}
        </div>
      </div>
      <button
        onClick={onClear}
        style={{
          flexShrink: 0, padding: '3px 8px', borderRadius: 6,
          background: 'rgba(107,116,144,0.15)', border: '1px solid #1a2030',
          color: '#6b7490', fontSize: 10, fontFamily: 'DM Mono,monospace', cursor: 'pointer',
        }}
      >
        Change
      </button>
    </div>
  )
}

function AuditSectionRow({ section }: { section: AuditSection }) {
  const [expanded, setExpanded] = useState(false)
  const strongCount = section.findings.filter((f) => f.status === 'strong').length
  const issueCount = section.findings.filter((f) => f.status === 'partial' || f.status === 'missing').length

  return (
    <div style={{ borderBottom: '1px solid #111520' }}>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
        }}
      >
        <span style={{ fontSize: 15, flexShrink: 0 }}>{section.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#c8cbd6' }}>{section.title}</div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', marginTop: 2 }}>
            {strongCount > 0 && <span style={{ color: '#10b981', marginRight: 6 }}>✓ {strongCount} strong</span>}
            {issueCount > 0 && <span style={{ color: '#f59e0b' }}>⚠ {issueCount} issues</span>}
          </div>
        </div>
        <span style={{ fontSize: 12, color: '#374151', transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>›</span>
      </button>
      {expanded && (
        <div style={{ padding: '0 12px 10px' }}>
          {section.findings.map((f, i) => {
            const cfg = FINDING_CONFIG[f.status]
            return (
              <div key={i} style={{
                background: '#080c14', borderRadius: 10, padding: '9px 10px', marginBottom: 6,
                borderLeft: `3px solid ${cfg.dot}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 5 }}>
                  <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: cfg.color, background: `${cfg.dot}18`, borderRadius: 4, padding: '1px 6px' }}>{cfg.label.toUpperCase()}</span>
                  <ProvenancePill provenance={f.provenance} />
                  <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151' }}>{f.confidence} confidence</span>
                </div>
                <div style={{ fontSize: 11, color: '#c8cbd6', lineHeight: 1.4, marginBottom: 5 }}>{f.finding}</div>
                <div style={{ fontSize: 10, color: '#6b7490', lineHeight: 1.35, marginBottom: 6 }}>→ {f.recommendation}</div>
                <div style={{ background: '#0a0d18', borderRadius: 6, padding: '6px 8px' }}>
                  <div style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 2 }}>EVIDENCE · DRAFT</div>
                  <div style={{ fontSize: 9, color: '#4b5563', lineHeight: 1.4, marginBottom: 3 }}>{f.evidence}</div>
                  <div style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: '#2d3748' }}>Source: {f.source}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function OppRow({ opp }: { opp: SupplyOpportunity }) {
  const cfg = OPP_CONFIG[opp.label]
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #111520' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{opp.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5, marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#c8cbd6' }}>{opp.vendor}</span>
            <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: cfg.color, background: `${cfg.color}18`, borderRadius: 4, padding: '1px 6px' }}>{cfg.label}</span>
            <ProvenancePill provenance={opp.provenance} />
          </div>
          <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 4 }}>{opp.category.toUpperCase()}</div>
          <div style={{ fontSize: 10, color: '#6b7490', lineHeight: 1.4, marginBottom: 5 }}>{opp.detail}</div>
          <div style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: '#2d3748' }}>Source: {opp.source}</div>
        </div>
      </div>
    </div>
  )
}

export function FieldAIScreen({ isOffline }: FieldAIScreenProps) {
  const [phase, setPhase] = useState<AIPhase>('empty')
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [auditData, setAuditData] = useState<ReturnType<typeof getAuditData> | null>(null)
  const [reviewingEdit, setReviewingEdit] = useState<ProfileEdit | null>(null)
  const [resolvedEdits, setResolvedEdits] = useState<Record<string, 'approved' | 'rejected'>>({})

  const selectedAccount = selectedAccountId ? accounts.find((a) => a.id === selectedAccountId) ?? null : null

  // Loading step progress
  useEffect(() => {
    if (phase !== 'audit_loading') return
    setLoadingStep(0)
    const steps = LOADING_STEPS.length
    let step = 0
    const id = setInterval(() => {
      step += 1
      setLoadingStep(step)
      if (step >= steps) {
        clearInterval(id)
        if (selectedAccountId) {
          setAuditData(getAuditData(selectedAccountId))
        }
        setTimeout(() => setPhase('audit_results'), 400)
      }
    }, 600)
    return () => clearInterval(id)
  }, [phase, selectedAccountId])

  function selectAccount(id: string) {
    setSelectedAccountId(id)
    setAuditData(null)
    setResolvedEdits({})
    setReviewingEdit(null)
    setPhase('locked')
  }

  function clearAccount() {
    setSelectedAccountId(null)
    setPhase('picker')
    setAuditData(null)
    setReviewingEdit(null)
    setResolvedEdits({})
  }

  function startAudit() {
    setPhase('audit_loading')
  }

  // ── EMPTY SCOPE ──────────────────────────────────────────────────────────────
  if (phase === 'empty') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ flexShrink: 0, padding: '12px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 700 }}>AI</div>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8 }}>FIELD AI</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e8eaf0', lineHeight: 1 }}>No business selected</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px', gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,211,238,0.08)', border: '2px dashed rgba(34,211,238,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🤖</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0', marginBottom: 8 }}>Select a business to start</div>
            <div style={{ fontSize: 12, color: '#6b7490', lineHeight: 1.6, maxWidth: 280, marginBottom: 8 }}>
              Field AI lets you run digital-marketing audits, surface supply opportunities, and review evidence-backed profile edits — all without leaving this workspace.
            </div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(34,211,238,0.07)', border: '1px solid rgba(34,211,238,0.18)',
              borderRadius: 8, padding: '5px 10px',
            }}>
              <span style={{ fontSize: 10, color: '#22d3ee' }}>📍</span>
              <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee' }}>
                Select from today's A1 route stops to keep the audit scoped to territory 34950
              </span>
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '🔍', label: 'Digital-marketing audit', sub: 'Website, GBP, social, local search, conversion' },
              { icon: '📦', label: 'Supply opportunity map', sub: 'Amazon Business, Office Depot, fleet, specialty' },
              { icon: '📋', label: 'Evidence-backed profile edits', sub: 'Proposed with confidence scores — approve or reject' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#0d1117', border: '1px solid #131720', borderRadius: 12,
                padding: '10px 12px',
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#c8cbd6' }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: '#374151', fontFamily: 'DM Mono,monospace', marginTop: 1 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase('picker')}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#0c2a5e,#1d4ed8,#22d3ee)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span>@</span>
            <span>Select a business</span>
          </button>
        </div>
      </div>
    )
  }

  // ── BUSINESS PICKER ──────────────────────────────────────────────────────────
  if (phase === 'picker') {
    const eligible = accounts.filter((a) => ELIGIBLE_ACCOUNT_IDS.includes(a.id))
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '12px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
          <button onClick={() => setPhase('empty')} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 8 }}>← Field AI</button>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8, marginBottom: 3 }}>● A1 QUADRANT · {eligible.length} ELIGIBLE</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e8eaf0' }}>Choose a business</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '8px 0' }}>
          {/* Hint */}
          <div style={{ padding: '6px 14px 10px' }}>
            <div style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 8, padding: '7px 10px' }}>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', marginBottom: 2 }}>A1 · 34950 ROUTE STOPS</div>
              <div style={{ fontSize: 10, color: '#6b7490', lineHeight: 1.4 }}>
                Select a business from today's A1 route stops to keep the audit scoped to this territory. Tap to lock context.
              </div>
            </div>
          </div>

          {eligible.map((acc) => {
            const stop = A1_STOPS.find((s) => s.accountId === acc.id)
            const badge = stop ? BADGE_CONFIG[stop.type] : null
            return (
              <button
                key={acc.id}
                onClick={() => selectAccount(acc.id)}
                style={{
                  width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
                  padding: '0 14px', textAlign: 'left', minHeight: 44,
                  display: 'flex', alignItems: 'center', gap: 12,
                  borderBottom: '1px solid #0d1117',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, color: '#fff', fontWeight: 700,
                }}>{acc.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0, padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#c8cbd6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{acc.name}</span>
                    {badge && (
                      <span style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: badge.color, background: badge.bg, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>{badge.label}</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151' }}>{acc.industry.toUpperCase()} · {acc.tier.toUpperCase()}</div>
                  {stop && <div style={{ fontSize: 10, color: '#4b5563', fontFamily: 'DM Mono,monospace', marginTop: 1 }}>{stop.eta} · {stop.distance}</div>}
                </div>
                <span style={{ fontSize: 14, color: '#22d3ee', flexShrink: 0 }}>@</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── LOCKED / ACTIONS ─────────────────────────────────────────────────────────
  if ((phase === 'locked') && selectedAccount) {
    const stop = A1_STOPS.find((s) => s.accountId === selectedAccount.id)
    const badge = stop ? BADGE_CONFIG[stop.type] : null

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '12px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8, marginBottom: 8 }}>● FIELD AI WORKSPACE</div>
          <ContextStrip account={selectedAccount} onClear={clearAccount} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Offline banner */}
          {isOffline && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '7px 10px', display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11 }}>⚡</span>
              <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#f59e0b' }}>Offline · Cached data only · Confidence marked Unknown for unavailable signals</span>
            </div>
          )}

          {/* Account mini-card */}
          <div style={{ background: '#0d1117', border: '1px solid #131720', borderRadius: 14, padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700 }}>
                {selectedAccount.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAccount.name}</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
                  {badge && <span style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: badge.color, background: badge.bg, borderRadius: 4, padding: '1px 5px' }}>{badge.label}</span>}
                  <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151' }}>{selectedAccount.tier.toUpperCase()} · {selectedAccount.industry.toUpperCase()}</span>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#4b5563' }}>
              {stop?.address ?? selectedAccount.address}
            </div>
            {stop && (
              <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', marginTop: 2 }}>{stop.eta} · {stop.distance} · {stop.reason}</div>
            )}
          </div>

          {/* AI Actions */}
          <div style={{ background: '#0d1117', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '9px 12px 7px', borderBottom: '1px solid #111520', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff', fontWeight: 700 }}>AI</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#c8cbd6' }}>Actions for <span style={{ color: '#22d3ee' }}>@{selectedAccount.name}</span></span>
            </div>

            {[
              { icon: '📊', label: 'Run digital-marketing audit', sub: 'Website, GBP, social, local search, conversion readiness', primary: true, action: startAudit },
              { icon: '🔍', label: 'Enrich public information', sub: 'Web presence enrichment from public signals', primary: false, action: () => {} },
              { icon: '📦', label: 'Identify supply categories', sub: 'Amazon Business, Office Depot, fleet, specialty', primary: false, action: () => {} },
              { icon: '📋', label: 'Review proposed profile edits', sub: 'Evidence-backed changes — requires approval', primary: false, action: () => {} },
              { icon: '🏢', label: 'Read business profile', sub: 'Account intel summary + context', primary: false, action: () => {} },
            ].map((item, i, arr) => (
              <button
                key={item.label}
                onClick={item.action}
                style={{
                  width: '100%', background: item.primary ? 'rgba(34,211,238,0.05)' : 'transparent', border: 'none',
                  borderBottom: i < arr.length - 1 ? '1px solid #0d1117' : 'none',
                  padding: '11px 12px', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: item.primary ? '#e8eaf0' : '#c8cbd6', fontWeight: item.primary ? 600 : 500, lineHeight: 1.2 }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: '#374151', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>{item.sub}</div>
                </div>
                <span style={{ fontSize: 11, color: item.primary ? '#22d3ee' : '#2d3748', flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>

          {/* Natural language composer hint */}
          <div style={{ background: '#080c14', border: '1px solid #0d1117', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 4 }}>EXAMPLE QUERIES</div>
            {[
              `What's the strongest talking point for @${selectedAccount.name}?`,
              `Does @${selectedAccount.name} have a GBP gap I can reference in the pitch?`,
              `Summarize the supply opportunity for @${selectedAccount.name}`,
            ].map((q) => (
              <div key={q} style={{ fontSize: 10, color: '#4b5563', fontFamily: 'DM Mono,monospace', lineHeight: 1.5 }}>› {q}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── AUDIT LOADING ────────────────────────────────────────────────────────────
  if (phase === 'audit_loading' && selectedAccount) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '12px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8, marginBottom: 8 }}>● FIELD AI · RUNNING AUDIT</div>
          <ContextStrip account={selectedAccount} onClear={() => {}} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 20px', gap: 20 }}>
          {/* Spinner */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              border: '3px solid #0d1117', borderTop: '3px solid #22d3ee',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#c8cbd6' }}>Auditing @{selectedAccount.name}</div>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151' }}>Processing public signals · do not navigate away</div>
          </div>

          {/* Progress steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LOADING_STEPS.map((step, i) => {
              const done = i < loadingStep
              const active = i === loadingStep
              return (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    background: done ? '#10b981' : active ? 'rgba(34,211,238,0.2)' : '#0d1117',
                    border: `1.5px solid ${done ? '#10b981' : active ? '#22d3ee' : '#1a2030'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: done ? '#fff' : active ? '#22d3ee' : '#2d3748',
                  }}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span style={{
                    fontSize: 11,
                    color: done ? '#6b7490' : active ? '#c8cbd6' : '#374151',
                    fontFamily: active ? 'DM Mono,monospace' : undefined,
                  }}>
                    {step}
                  </span>
                  {active && (
                    <span style={{ fontSize: 10, color: '#22d3ee', marginLeft: 'auto', fontFamily: 'DM Mono,monospace', animation: 'blink .75s step-end infinite' }}>●</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Disclaimer */}
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#3b82f6', marginBottom: 3 }}>DATA SOURCING · DRAFT</div>
            <div style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.4 }}>
              Findings may come from public signals, internal CRM notes, or rep observations — each is labeled. Absence of a signal means "not found in sources checked," not confirmed absence. No data is written, no outreach sent. All findings are draft-only.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── AUDIT RESULTS ────────────────────────────────────────────────────────────
  if (phase === 'audit_results' && selectedAccount && auditData) {
    const { audit, supplyOpps, profileEdits, salesBrief } = auditData
    const totalFindings = audit.reduce((acc, s) => acc + s.findings.length, 0)
    const issueCount = audit.reduce((acc, s) => acc + s.findings.filter((f) => f.status === 'partial' || f.status === 'missing').length, 0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '12px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
          <button onClick={() => setPhase('locked')} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 8 }}>← Actions</button>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8, marginBottom: 8 }}>● DIGITAL MARKETING AUDIT</div>
          <ContextStrip account={selectedAccount} onClear={clearAccount} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '10px 0' }}>

          {/* Sales Brief */}
          <div style={{ padding: '0 14px 10px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 0.5, marginBottom: 8 }}>SALES BRIEF</div>
            <div style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: 14, padding: '12px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <ScoreBadge score={salesBrief.opportunityScore} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 3 }}>OPPORTUNITY SCORE</div>
                  <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.5 }}>{salesBrief.summary}</div>
                </div>
              </div>

              <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#22d3ee', marginBottom: 6 }}>TALKING POINTS</div>
              {salesBrief.talkingPoints.map((pt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#22d3ee', flexShrink: 0, marginTop: 2 }}>{i + 1}.</span>
                  <div style={{ fontSize: 11, color: '#c8cbd6', lineHeight: 1.4 }}>{pt}</div>
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                <div style={{ background: '#080c14', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 5 }}>DIGITAL GAPS</div>
                  {salesBrief.digitalGaps.map((g, i) => (
                    <div key={i} style={{ fontSize: 9, color: '#ef4444', lineHeight: 1.4, marginBottom: 2 }}>· {g}</div>
                  ))}
                </div>
                <div style={{ background: '#080c14', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 5 }}>LIKELY NEEDS</div>
                  {salesBrief.likelyNeeds.map((n, i) => (
                    <div key={i} style={{ fontSize: 9, color: '#10b981', lineHeight: 1.4, marginBottom: 2 }}>· {n}</div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '8px 10px', marginTop: 10 }}>
                <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#3b82f6', marginBottom: 3 }}>RECOMMENDED ACTION</div>
                <div style={{ fontSize: 11, color: '#c8cbd6', lineHeight: 1.4 }}>{salesBrief.recommendedAction}</div>
              </div>
            </div>
          </div>

          {/* Evidence provenance legend */}
          <div style={{ padding: '0 14px 10px' }}>
            <div style={{ background: '#0a0d18', border: '1px solid #131720', borderRadius: 10, padding: '9px 11px' }}>
              <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 7 }}>EVIDENCE LEGEND · {totalFindings} signals · {issueCount} issues · DRAFT</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {(Object.entries(PROVENANCE_CONFIG) as [Provenance, typeof PROVENANCE_CONFIG[Provenance]][]).map(([key, cfg]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                    <ProvenancePill provenance={key} />
                    <span style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>
                      {key === 'public' && 'Verified from openly accessible web sources'}
                      {key === 'crm' && 'From internal CRM records or logged call notes — not public'}
                      {key === 'rep_observation' && 'Observed directly by the rep during a visit — not independently verified'}
                      {key === 'needs_confirmation' && 'Signal is inferred or absent in checked sources — confirm before acting'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 7, paddingTop: 7, borderTop: '1px solid #0d1117', fontSize: 8, fontFamily: 'DM Mono,monospace', color: '#2d3748', lineHeight: 1.4 }}>
                No data is written, no outreach is sent, and no enrollment or discount is completed without explicit approval. All findings are draft-only until reviewed.
              </div>
            </div>
          </div>

          {/* Audit sections */}
          <div style={{ padding: '0 14px 4px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 0.5, marginBottom: 6 }}>AUDIT FINDINGS</div>
          </div>
          <div style={{ background: '#0d1117', borderTop: '1px solid #131720', borderBottom: '1px solid #131720' }}>
            {audit.map((section, i) => (
              <AuditSectionRow key={i} section={section} />
            ))}
          </div>

          {/* Supply opps */}
          <div style={{ padding: '10px 14px 4px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 0.5, marginBottom: 6 }}>SUPPLY OPPORTUNITIES</div>
          </div>
          <div style={{ background: '#0d1117', borderTop: '1px solid #131720', borderBottom: '1px solid #131720' }}>
            {supplyOpps.map((opp, i) => <OppRow key={i} opp={opp} />)}
          </div>

          {/* Profile edits */}
          <div style={{ padding: '10px 14px 4px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', letterSpacing: 0.5, marginBottom: 6 }}>PROPOSED PROFILE EDITS · {profileEdits.length} PENDING</div>
          </div>
          <div style={{ background: '#0d1117', borderTop: '1px solid #131720', borderBottom: '1px solid #131720', marginBottom: 16 }}>
            {profileEdits.map((edit, i) => {
              const resolution = resolvedEdits[edit.field]
              return (
                <div key={i} style={{ padding: '11px 12px', borderBottom: i < profileEdits.length - 1 ? '1px solid #111520' : 'none' }}>
                  <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 5 }}>
                    {edit.field.toUpperCase()}
                    {resolution && (
                      <span style={{ marginLeft: 6, color: resolution === 'approved' ? '#10b981' : '#ef4444' }}>
                        · {resolution === 'approved' ? 'APPROVED' : 'REJECTED'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                    <div style={{ flex: 1, background: '#080c14', borderRadius: 6, padding: '5px 8px' }}>
                      <div style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 2 }}>CURRENT</div>
                      <div style={{ fontSize: 10, color: '#6b7490' }}>{edit.current}</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(34,211,238,0.05)', borderRadius: 6, padding: '5px 8px', border: '1px solid rgba(34,211,238,0.12)' }}>
                      <div style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: '#22d3ee', marginBottom: 2 }}>PROPOSED</div>
                      <div style={{ fontSize: 10, color: '#c8cbd6' }}>{edit.proposed}</div>
                    </div>
                  </div>
                  {!resolution && (
                    <button
                      onClick={() => { setReviewingEdit(edit); setPhase('edit_review') }}
                      style={{
                        padding: '6px 12px', borderRadius: 7,
                        background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.25)',
                        color: '#22d3ee', fontSize: 10, fontFamily: 'DM Mono,monospace', cursor: 'pointer',
                      }}
                    >
                      Review →
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── EDIT REVIEW ──────────────────────────────────────────────────────────────
  if (phase === 'edit_review' && selectedAccount && reviewingEdit && auditData) {
    const currentEdit = reviewingEdit
    const { profileEdits, salesBrief } = auditData
    const cfg = { high: { color: '#10b981', label: 'High' }, medium: { color: '#f59e0b', label: 'Medium' }, low: { color: '#ef4444', label: 'Low' } }[currentEdit.confidence]
    const remaining = profileEdits.filter((e) => !resolvedEdits[e.field])

    function resolve(decision: 'approved' | 'rejected') {
      setResolvedEdits((prev) => ({ ...prev, [currentEdit.field]: decision }))
      // Find next unresolved edit
      const next = profileEdits.find((e) => e.field !== currentEdit.field && !resolvedEdits[e.field])
      if (next) {
        setReviewingEdit(next)
      } else {
        setReviewingEdit(null)
        setPhase('audit_results')
      }
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ flexShrink: 0, padding: '12px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
          <button onClick={() => { setReviewingEdit(null); setPhase('audit_results') }} style={{ background: 'none', border: 'none', color: '#6b7490', cursor: 'pointer', fontSize: 12, padding: 0, marginBottom: 8 }}>← Audit results</button>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 0.8, marginBottom: 8 }}>● PROPOSED EDIT REVIEW · {remaining.length} REMAINING</div>
          <ContextStrip account={selectedAccount} onClear={() => { clearAccount(); setPhase('picker') }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Disclaimer */}
          <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.22)', borderRadius: 8, padding: '7px 10px', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 11, flexShrink: 0 }}>⚠️</span>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#f59e0b', lineHeight: 1.5 }}>
              Approving an edit queues it for manual submission — no automatic saves or CRM writes. Review evidence before approving.
            </div>
          </div>

          {/* Field being reviewed */}
          <div style={{ background: '#0d1117', border: '1px solid #131720', borderRadius: 14, padding: '12px 13px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 8 }}>{currentEdit.field.toUpperCase()}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ background: '#080c14', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 4 }}>CURRENT VALUE</div>
                <div style={{ fontSize: 13, color: '#6b7490', fontWeight: 500 }}>{currentEdit.current}</div>
              </div>
              <div style={{ fontSize: 10, color: '#374151', textAlign: 'center', fontFamily: 'DM Mono,monospace' }}>↓ proposed change</div>
              <div style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.2)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 8, fontFamily: 'DM Mono,monospace', color: '#22d3ee', marginBottom: 4 }}>PROPOSED VALUE</div>
                <div style={{ fontSize: 13, color: '#e8eaf0', fontWeight: 600 }}>{currentEdit.proposed}</div>
              </div>
            </div>

            {/* Evidence */}
            <div style={{ background: '#080c14', borderRadius: 8, padding: '9px 10px', marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151', marginBottom: 4 }}>EVIDENCE</div>
              <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.45 }}>{currentEdit.evidence}</div>
            </div>

            {/* Confidence */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151' }}>CONFIDENCE</div>
              <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: cfg.color, background: `${cfg.color}18`, borderRadius: 4, padding: '2px 7px' }}>
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Talking point link */}
          <div style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)', borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#22d3ee', marginBottom: 4 }}>SALES RELEVANCE</div>
            <div style={{ fontSize: 10, color: '#6b7490', lineHeight: 1.4 }}>
              {salesBrief.talkingPoints[0]}
            </div>
          </div>
        </div>

        {/* Approve / Reject */}
        <div style={{ flexShrink: 0, padding: '10px 14px 16px', borderTop: '1px solid #111520', background: '#0b0d14', display: 'flex', gap: 8 }}>
          <button
            onClick={() => resolve('rejected')}
            style={{
              flex: 1, padding: '13px', borderRadius: 13, cursor: 'pointer',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', fontSize: 14, fontWeight: 600,
            }}
          >
            Reject
          </button>
          <button
            onClick={() => resolve('approved')}
            style={{
              flex: 2, padding: '13px', borderRadius: 13, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#0c2a5e,#1d4ed8,#22d3ee)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <span>✓</span>
            <span>Approve · Queue for review</span>
          </button>
        </div>
      </div>
    )
  }

  return null
}

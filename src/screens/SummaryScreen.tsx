import { useState } from 'react'
import type { StopRecord, SyncStatus } from '../types'
import { accounts } from '../data/accounts'
import { OUTCOME_CONFIG } from '../data/territory'

interface SummaryScreenProps {
  stops: StopRecord[]
  onSync: () => void
  onSendToManager: () => void
}

type Tab = 'completed' | 'reloop' | 'followup' | 'unsynced'

function SyncDot({ status }: { status: SyncStatus }) {
  const cfg = {
    synced: { color: '#10b981', label: 'Synced' },
    local_only: { color: '#f59e0b', label: 'Local' },
    queued: { color: '#3b82f6', label: 'Queued' },
    syncing: { color: '#22d3ee', label: 'Syncing' },
    error: { color: '#ef4444', label: 'Error' },
  }[status]
  return (
    <span style={{
      fontSize: 8, fontFamily: 'DM Mono,monospace',
      color: cfg.color, background: `${cfg.color}18`,
      borderRadius: 5, padding: '1px 5px',
    }}>{cfg.label.toUpperCase()}</span>
  )
}

export function SummaryScreen({ stops, onSync, onSendToManager }: SummaryScreenProps) {
  const [tab, setTab] = useState<Tab>('completed')
  const [sendState, setSendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const completed = stops.filter((s) => s.status === 'done')
  const failed = stops.filter((s) => s.status === 'failed' || s.status === 'skipped')
  const withFollowup = stops.filter((s) => s.followUpDate)
  const unsynced = stops.filter((s) => s.syncStatus === 'local_only' || s.syncStatus === 'error')

  const totalVisited = completed.length
  const totalAccounts = stops.length
  const totalTime = completed.reduce((acc, s) => {
    if (s.arrivedAt && s.departedAt) {
      return acc + (s.departedAt.getTime() - s.arrivedAt.getTime()) / 60000
    }
    return acc + 45
  }, 0)
  const milesDriven = 6.2 + (completed.length * 2.1)

  const handleSend = () => {
    setSendState('sending')
    setTimeout(() => setSendState('sent'), 1800)
  }

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'completed', label: 'Done', count: completed.length },
    { key: 'reloop', label: 'Reloop', count: failed.length },
    { key: 'followup', label: 'Follow-ups', count: withFollowup.length },
    { key: 'unsynced', label: 'Unsynced', count: unsynced.length },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{ flexShrink: 0, padding: '10px 14px 10px', borderBottom: '1px solid #111520', background: '#0b0d14' }}>
        <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#22d3ee', letterSpacing: 1, marginBottom: 2 }}>
          ● END OF DAY · OCT 3, 2026
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#e8eaf0', marginBottom: 8 }}>Day Summary</div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
          {[
            { v: `${totalVisited}/${totalAccounts}`, label: 'STOPS', color: '#e8eaf0' },
            { v: Math.round(milesDriven).toString(), label: 'MILES', color: '#e8eaf0' },
            { v: `${Math.round(totalTime / 60)}h ${Math.round(totalTime % 60)}m`, label: 'FIELD TIME', color: '#e8eaf0' },
            { v: unsynced.length.toString(), label: 'UNSYNCED', color: unsynced.length > 0 ? '#f59e0b' : '#10b981' },
          ].map((s) => (
            <div key={s.label} style={{
              background: '#0d1117', border: '1px solid #1a2030', borderRadius: 10,
              padding: '8px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color, fontFamily: 'DM Mono,monospace' }}>{s.v}</div>
              <div style={{ fontSize: 8, color: '#374151', fontFamily: 'DM Mono,monospace', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        flexShrink: 0, display: 'flex', gap: 0,
        borderBottom: '1px solid #111520', background: '#0b0d14',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '9px 6px', border: 'none', cursor: 'pointer',
              background: 'transparent',
              borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
              color: tab === t.key ? '#93c5fd' : '#6b7490',
              fontSize: 11, fontFamily: 'DM Mono,monospace',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              transition: 'all .15s', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700 }}>{t.count}</span>
            <span>{t.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'none', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {tab === 'completed' && (
          <>
            {completed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151', fontFamily: 'DM Mono,monospace', fontSize: 12 }}>
                No completed visits yet
              </div>
            ) : (
              completed.map((stop) => {
                const acc = accounts.find((a) => a.id === stop.accountId)
                if (!acc) return null
                const outcomeConf = stop.disposition ? OUTCOME_CONFIG[stop.disposition] : null
                const dur = stop.arrivedAt && stop.departedAt
                  ? Math.round((stop.departedAt.getTime() - stop.arrivedAt.getTime()) / 60000)
                  : 45
                return (
                  <div key={stop.accountId} style={{
                    background: '#0d1117', border: '1px solid #1a2030', borderRadius: 12, padding: '11px 12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0', marginBottom: 2 }}>{acc.name}</div>
                        {outcomeConf && (
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 10, fontFamily: 'DM Mono,monospace',
                            color: outcomeConf.color, background: outcomeConf.bg,
                            borderRadius: 6, padding: '2px 7px',
                          }}>
                            <span>{outcomeConf.icon}</span><span>{outcomeConf.label}</span>
                          </div>
                        )}
                      </div>
                      <SyncDot status={stop.syncStatus} />
                    </div>
                    {stop.dispositionNote && (
                      <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.4, marginBottom: 5 }}>{stop.dispositionNote}</div>
                    )}
                    <div style={{ display: 'flex', gap: 10, fontSize: 9, fontFamily: 'DM Mono,monospace', color: '#374151' }}>
                      <span>⏱ {dur}min</span>
                      {stop.arrivedAt && <span>🕐 {stop.arrivedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                      {stop.nextAction && <span>→ {stop.nextAction}</span>}
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        {/* Recovery / Reloop — Summary / Unsynced distinction */}
        {tab === 'reloop' && (
          <>
            {failed.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '40px 0', color: '#374151',
                fontFamily: 'DM Mono,monospace', fontSize: 12,
              }}>
                No failed or skipped visits
              </div>
            ) : (
              <>
                <div style={{
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
                  borderRadius: 12, padding: '10px 13px',
                  display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 2,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>ℹ️</span>
                  <div style={{ fontSize: 12, color: '#9ba3b8', lineHeight: 1.45 }}>
                    These visits were logged as failed or skipped. Recovery plans are saved locally and will sync when online.
                  </div>
                </div>

                {failed.map((stop) => {
                  const acc = accounts.find((a) => a.id === stop.accountId)
                  if (!acc) return null
                  const recoveryLabel =
                    stop.recoveryPlan === 'reloop' ? '🔄 Reloop after next stop' :
                    stop.recoveryPlan === 'call_ahead' ? '📞 Call ahead first' :
                    stop.recoveryPlan === 'skip' ? '⏭ Skipped for today' : '⏭ No recovery plan set'
                  const recoveryColor =
                    stop.recoveryPlan === 'reloop' ? '#f59e0b' :
                    stop.recoveryPlan === 'call_ahead' ? '#3b82f6' : '#6b7490'

                  return (
                    <div key={stop.accountId} style={{
                      background: '#0d1117', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 13px',
                    }}>
                      {/* Account + sync row */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#c8cbd6', marginBottom: 3 }}>{acc.name}</div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#ef4444', background: 'rgba(239,68,68,0.1)', borderRadius: 6, padding: '2px 7px' }}>
                            ✕ {stop.status === 'failed' ? 'Failed visit' : 'Skipped'}
                          </div>
                        </div>
                        {/* Explicit sync status — Recovery / Reloop */}
                        <SyncDot status={stop.syncStatus} />
                      </div>

                      {/* Failure reason */}
                      {stop.failureReason && (
                        <div style={{ fontSize: 12, color: '#9b7070', marginBottom: 7, lineHeight: 1.4 }}>
                          <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', marginRight: 5 }}>REASON</span>
                          {stop.failureReason}
                        </div>
                      )}

                      {/* Recovery plan */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 11, fontFamily: 'DM Mono,monospace',
                        color: recoveryColor, background: `${recoveryColor}14`,
                        borderRadius: 7, padding: '5px 9px', marginBottom: 8,
                      }}>
                        {recoveryLabel}
                      </div>

                      {/* Local-only warning if not synced */}
                      {(stop.syncStatus === 'local_only' || stop.syncStatus === 'error') && (
                        <div style={{
                          fontSize: 10, fontFamily: 'DM Mono,monospace',
                          color: '#f59e0b', marginBottom: 8,
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                          <span>⚡</span>
                          <span>Local only · not synced to CRM</span>
                        </div>
                      )}

                      <button style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        width: '100%', minHeight: 40, borderRadius: 8, cursor: 'pointer',
                        background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)',
                        color: '#f59e0b', fontSize: 12, fontFamily: 'DM Mono,monospace',
                      }}>
                        <span>🔄</span><span>SCHEDULE RELOOP</span>
                      </button>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

        {tab === 'followup' && (
          <>
            {withFollowup.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#374151', fontFamily: 'DM Mono,monospace', fontSize: 12 }}>
                No follow-ups scheduled yet
              </div>
            ) : (
              withFollowup.map((stop) => {
                const acc = accounts.find((a) => a.id === stop.accountId)
                if (!acc) return null
                return (
                  <div key={stop.accountId} style={{
                    background: '#0d1117', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '11px 12px',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0', marginBottom: 3 }}>{acc.name}</div>
                    <div style={{ display: 'flex', gap: 8, fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#93c5fd', marginBottom: 4 }}>
                      <span>📅 {stop.followUpDate}</span>
                      {stop.followUpTime && <span>🕐 {stop.followUpTime}</span>}
                    </div>
                    {stop.nextAction && (
                      <div style={{ fontSize: 11, color: '#9ba3b8' }}>{stop.nextAction}</div>
                    )}
                    <div style={{ marginTop: 5 }}>
                      <SyncDot status={stop.syncStatus} />
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}

        {tab === 'unsynced' && (
          <>
            {unsynced.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                <div style={{ color: '#10b981', fontFamily: 'DM Mono,monospace', fontSize: 12 }}>All records synced</div>
              </div>
            ) : (
              <>
                <div style={{
                  background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 12, padding: '10px 12px',
                  display: 'flex', alignItems: 'flex-start', gap: 9,
                }}>
                  <span style={{ fontSize: 13 }}>⚡</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 2 }}>
                      {unsynced.length} record{unsynced.length > 1 ? 's' : ''} saved locally
                    </div>
                    <div style={{ fontSize: 11, color: '#9ba3b8', lineHeight: 1.4 }}>
                      Your work is safe on this device. Tap Sync Now when you have connectivity.
                    </div>
                  </div>
                </div>

                {unsynced.map((stop) => {
                  const acc = accounts.find((a) => a.id === stop.accountId)
                  if (!acc) return null
                  return (
                    <div key={stop.accountId} style={{
                      background: '#0d1117', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 12, padding: '11px 12px',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#e8eaf0' }}>{acc.name}</div>
                        <div style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: '#374151', marginTop: 2 }}>
                          {stop.disposition
                            ? OUTCOME_CONFIG[stop.disposition]?.label
                            : stop.status === 'failed'
                              ? `Failed visit${stop.recoveryPlan === 'reloop' ? ' · reloop queued' : stop.recoveryPlan === 'call_ahead' ? ' · call ahead' : ' · skipped'}`
                              : stop.status === 'skipped'
                                ? 'Skipped · no disposition'
                                : 'No disposition'}
                        </div>
                      </div>
                      <SyncDot status={stop.syncStatus} />
                    </div>
                  )
                })}

                <button
                  onClick={onSync}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 12, cursor: 'pointer',
                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                    color: '#f59e0b', fontSize: 12, fontFamily: 'DM Mono,monospace',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  }}
                >
                  <span>🔄</span><span>SYNC NOW</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, padding: '10px 14px 16px', borderTop: '1px solid #111520', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {sendState === 'sent' ? (
          <div style={{
            padding: '13px', borderRadius: 14, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: '#10b981', fontSize: 14, fontWeight: 600,
          }}>
            ✓ Summary sent to manager
          </div>
        ) : (
          <button
            onClick={() => { setSendState('sending'); setTimeout(() => setSendState('sent'), 1400) }}
            disabled={sendState === 'sending'}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: sendState === 'sending' ? '#131720' : 'linear-gradient(135deg,#1d4ed8,#0ea5e9)',
              color: sendState === 'sending' ? '#6b7490' : '#fff',
              fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all .2s',
            }}
          >
            {sendState === 'sending' ? (
              <><span style={{ fontSize: 12, animation: 'spin 1s linear infinite' }}>⟳</span><span>Sending…</span></>
            ) : (
              <><span>📤</span><span>Send EOD Summary to Manager</span></>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

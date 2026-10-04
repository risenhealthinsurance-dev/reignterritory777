import type { SyncStatus } from '../types'

interface SyncBadgeProps {
  status: SyncStatus
  verbose?: boolean
}

const CONFIG: Record<SyncStatus, { label: string; shortLabel: string; color: string; icon: string }> = {
  synced:     { label: 'Synced to CRM',       shortLabel: 'Synced',   color: '#10b981', icon: '✓' },
  local_only: { label: 'Local only · not synced', shortLabel: 'Local', color: '#f59e0b', icon: '⚡' },
  queued:     { label: 'Queued for sync',      shortLabel: 'Queued',   color: '#3b82f6', icon: '⏳' },
  syncing:    { label: 'Syncing…',             shortLabel: 'Syncing',  color: '#22d3ee', icon: '⟳' },
  error:      { label: 'Sync failed · tap to retry', shortLabel: 'Error', color: '#ef4444', icon: '!' },
}

export function SyncBadge({ status, verbose = false }: SyncBadgeProps) {
  const conf = CONFIG[status]
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 9, fontFamily: 'DM Mono,monospace',
      color: conf.color,
      background: `${conf.color}18`,
      borderRadius: 6, padding: '3px 7px',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: status === 'syncing' ? 10 : 9 }}>{conf.icon}</span>
      <span>{verbose ? conf.label : conf.shortLabel}</span>
    </div>
  )
}

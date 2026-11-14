import { createElement } from 'react'
import type { Status } from '../core'

export const STATUS = {
  ok: { label: 'Good', icon: '✓', className: 'status-good' },
  watch: { label: 'Watch', icon: '△', className: 'status-watch' },
  alert: { label: 'Act', icon: '!', className: 'status-alert' },
  nodata: { label: 'No data', icon: '—', className: 'status-nodata' },
} satisfies Record<Status, { label: string; icon: string; className: string }>

export function StatusBadge({ status }: { status: Status }) {
  const style = STATUS[status]
  return createElement('span', { className: `status-badge ${style.className}` },
    createElement('span', { 'aria-hidden': true, className: 'status-icon' }, style.icon), style.label)
}

import type { ReactNode } from 'react'
import { formatMoney, formatMoneyCompact } from '../../lib/format'
import { formatMonth } from '../../lib/date'
import type { ChartTheme } from '../../lib/palette'

export interface TooltipEntry { name: string; value: number; color: string }

/** Infobulle commune : libellé du mois puis une ligne par série. */
export function ChartTooltip({ active, label, entries, formatLabel = formatMonth, extra }: {
  active?: boolean
  label?: string
  entries: TooltipEntry[]
  formatLabel?: (value: string) => string
  extra?: ReactNode
}) {
  if (!active || !entries.length) return null
  return (
    <div className="chart-tooltip">
      <div className="tt-label">{label ? formatLabel(label) : ''}</div>
      {entries.map((entry) => (
        <div className="tt-row" key={entry.name}>
          <span className="tt-name">
            <span className="legend-key" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="tt-value">{formatMoney(entry.value)}</span>
        </div>
      ))}
      {extra}
    </div>
  )
}

export function ChartLegend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="legend">
      {items.map((item) => (
        <span className="legend-item" key={item.label}>
          <span className="legend-key" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

/** Réglages d'axes partagés : grille discrète, graduations arrondies. */
export function axisProps(theme: ChartTheme) {
  return {
    tick: { fill: theme.textMuted, fontSize: 11 },
    tickLine: false,
    axisLine: { stroke: theme.axis },
  }
}

export const moneyTick = (value: number) => formatMoneyCompact(value)

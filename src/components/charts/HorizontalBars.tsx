import { formatMoney, formatPercent } from '../../lib/format'

export interface HorizontalBarItem {
  id: string
  label: string
  value: number
  color: string
  /** Texte secondaire affiché à droite (part, nombre d'opérations…). */
  meta?: string
}

/**
 * Comparaison de composition (catégories, allocation d'actifs).
 * Barres HTML : libellé et valeur toujours lisibles, y compris en mode sombre.
 */
export function HorizontalBars({ items, total }: { items: HorizontalBarItem[]; total?: number }) {
  const max = Math.max(...items.map((item) => item.value), 1)
  const reference = total ?? items.reduce((sum, item) => sum + item.value, 0)
  return (
    <div>
      {items.map((item) => (
        <div className="bar-row" key={item.id}>
          <span className="cat small">
            <span className="dot" style={{ background: item.color }} />
            <span className="nowrap" title={item.label}>{item.label}</span>
          </span>
          <span className="bar-track">
            <span style={{ width: `${(item.value / max) * 100}%`, background: item.color }} />
          </span>
          <span className="right small nowrap">
            <span className="num">{formatMoney(item.value)}</span>
            <span className="muted"> · {item.meta ?? formatPercent(reference > 0 ? (item.value / reference) * 100 : 0, 0)}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

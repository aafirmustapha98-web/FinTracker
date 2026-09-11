import type { ReactNode } from 'react'
import { formatMoney, formatPercent } from '../../lib/format'
import { IconArrowDown, IconArrowUp } from './Icons'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`.trim()}>{children}</section>
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="card-header">
      <div>
        <h2>{title}</h2>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  )
}

export function StatCard({
  label, value, delta, deltaLabel, foot, hero, tone = 'neutral', invertDelta = false,
}: {
  label: string
  value: string
  delta?: number | null
  deltaLabel?: string
  foot?: ReactNode
  hero?: boolean
  tone?: 'neutral' | 'positive' | 'negative'
  /** Pour les dépenses : une hausse est une mauvaise nouvelle. */
  invertDelta?: boolean
}) {
  const toneClass = tone === 'positive' ? 'pos' : tone === 'negative' ? 'neg' : ''
  return (
    <Card>
      <div className="card-body">
        <div className="stat-label">{label}</div>
        <div className={`stat-value ${hero ? 'hero' : ''} ${toneClass}`.trim()}>{value}</div>
        {typeof delta === 'number' && Number.isFinite(delta) ? (
          <div className="stat-foot">
            <Delta value={delta} invert={invertDelta} /> {deltaLabel ?? 'vs mois précédent'}
          </div>
        ) : null}
        {foot ? <div className="stat-foot">{foot}</div> : null}
      </div>
    </Card>
  )
}

export function Delta({ value, invert = false }: { value: number; invert?: boolean }) {
  const rounded = Math.abs(value) < 0.05 ? 0 : value
  const good = invert ? rounded < 0 : rounded > 0
  const className = rounded === 0 ? 'flat' : good ? 'up' : 'down'
  return (
    <span className={`delta ${className}`}>
      {rounded === 0 ? null : rounded > 0 ? <IconArrowUp size={13} /> : <IconArrowDown size={13} />}
      {formatPercent(rounded, 1, true)}
    </span>
  )
}

export function Money({ value, sign = false, decimals = 0, colored = false }: {
  value: number; sign?: boolean; decimals?: number; colored?: boolean
}) {
  const className = colored ? (value > 0 ? 'pos' : value < 0 ? 'neg' : 'muted') : ''
  return <span className={`num ${className}`.trim()}>{formatMoney(value, { sign, decimals })}</span>
}

export function Badge({ tone = 'neutral', children }: {
  tone?: 'neutral' | 'good' | 'warning' | 'critical' | 'accent'; children: ReactNode
}) {
  return <span className={`badge ${tone === 'neutral' ? '' : tone}`.trim()}>{children}</span>
}

export function Meter({ ratio, tone = 'accent' }: { ratio: number; tone?: 'accent' | 'good' | 'warning' | 'critical' }) {
  return (
    <div className={`meter ${tone === 'accent' ? '' : tone}`.trim()}>
      <span style={{ width: `${Math.min(Math.max(ratio, 0), 100)}%` }} />
    </div>
  )
}

export function Dot({ color }: { color: string }) {
  return <span className="dot" style={{ background: color }} />
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {hint ? <span className="small">{hint}</span> : null}
      {action}
    </div>
  )
}

export function Segmented<T extends string>({ value, options, onChange, ariaLabel }: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  ariaLabel?: string
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="note">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <circle cx="12" cy="12" r="9" /><path d="M12 11v5" strokeLinecap="round" /><circle cx="12" cy="8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
      <div>{children}</div>
    </div>
  )
}

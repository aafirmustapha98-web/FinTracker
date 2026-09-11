import type { ISODate, Month } from '../types'

const MONTH_LABELS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]

const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

/** Date du jour au format `YYYY-MM-DD` (heure locale, pas UTC). */
export function today(): ISODate {
  return toISODate(new Date())
}

export function toISODate(d: Date): ISODate {
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** `YYYY-MM` du mois courant. */
export function currentMonth(): Month {
  return today().slice(0, 7)
}

export function monthOf(date: ISODate): Month {
  return date.slice(0, 7)
}

/** Décale un mois de `delta` mois (delta peut être négatif). */
export function addMonths(month: Month, delta: number): Month {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`
}

export function addDays(date: ISODate, delta: number): ISODate {
  const [y, m, d] = date.split('-').map(Number)
  return toISODate(new Date(y, m - 1, d + delta))
}

/** Liste de `count` mois consécutifs se terminant par `end` (inclus). */
export function monthRange(end: Month, count: number): Month[] {
  return Array.from({ length: count }, (_, i) => addMonths(end, i - count + 1))
}

/** « septembre 2026 » */
export function formatMonth(month: Month): string {
  const [y, m] = month.split('-').map(Number)
  return `${MONTH_LABELS[m - 1]} ${y}`
}

/** « sep. 26 » — pour les axes de graphiques. */
export function formatMonthShort(month: Month): string {
  const [y, m] = month.split('-').map(Number)
  return `${MONTH_SHORT[m - 1]} ${`${y}`.slice(2)}`
}

/** « 12 sep. 2026 » */
export function formatDate(date: ISODate): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return `${d} ${MONTH_SHORT[m - 1]}. ${y}`
}

export function firstDayOfMonth(month: Month): ISODate {
  return `${month}-01`
}

export function lastDayOfMonth(month: Month): ISODate {
  const [y, m] = month.split('-').map(Number)
  return toISODate(new Date(y, m, 0))
}

/** Nombre de jours du mois. */
export function daysInMonth(month: Month): number {
  const [y, m] = month.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

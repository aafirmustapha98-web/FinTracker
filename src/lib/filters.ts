import type { ISODate, Transaction } from '../types'
import { addMonths, currentMonth, firstDayOfMonth, lastDayOfMonth, monthOf, today } from './date'

export type PeriodPreset = 'current-month' | 'last-3' | 'last-6' | 'last-12' | 'year' | 'all' | 'custom'

export interface Period {
  preset: PeriodPreset
  from: ISODate
  to: ISODate
}

export const PERIOD_OPTIONS: Array<{ value: PeriodPreset; label: string }> = [
  { value: 'current-month', label: 'Mois en cours' },
  { value: 'last-3', label: '3 derniers mois' },
  { value: 'last-6', label: '6 derniers mois' },
  { value: 'last-12', label: '12 derniers mois' },
  { value: 'year', label: 'Année en cours' },
  { value: 'all', label: 'Tout l\'historique' },
  { value: 'custom', label: 'Période personnalisée' },
]

/** Traduit un préréglage en intervalle de dates concret. */
export function resolvePeriod(preset: PeriodPreset, custom?: { from: ISODate; to: ISODate }): Period {
  const month = currentMonth()
  const to = lastDayOfMonth(month)
  switch (preset) {
    case 'current-month':
      return { preset, from: firstDayOfMonth(month), to }
    case 'last-3':
      return { preset, from: firstDayOfMonth(addMonths(month, -2)), to }
    case 'last-6':
      return { preset, from: firstDayOfMonth(addMonths(month, -5)), to }
    case 'last-12':
      return { preset, from: firstDayOfMonth(addMonths(month, -11)), to }
    case 'year':
      return { preset, from: `${month.slice(0, 4)}-01-01`, to }
    case 'all':
      return { preset, from: '1970-01-01', to: '2999-12-31' }
    case 'custom':
      return { preset, from: custom?.from ?? firstDayOfMonth(month), to: custom?.to ?? today() }
  }
}

/** Nombre de mois couverts par la période (au moins 1) — sert aux moyennes. */
export function monthsInPeriod(period: Period, transactions: Transaction[]): number {
  if (period.preset === 'all') {
    const months = new Set(transactions.map((transaction) => monthOf(transaction.date)))
    return Math.max(months.size, 1)
  }
  const [fromY, fromM] = period.from.split('-').map(Number)
  const [toY, toM] = period.to.split('-').map(Number)
  return Math.max((toY - fromY) * 12 + (toM - fromM) + 1, 1)
}

export interface TransactionFilters {
  period: Period
  categoryId: string
  search: string
  nature: 'all' | 'fixed' | 'variable'
}

export function filterTransactions(transactions: Transaction[], filters: TransactionFilters): Transaction[] {
  const needle = filters.search.trim().toLowerCase()
  return transactions.filter((transaction) => {
    if (transaction.date < filters.period.from || transaction.date > filters.period.to) return false
    if (filters.categoryId !== 'all' && transaction.categoryId !== filters.categoryId) return false
    if (filters.nature !== 'all' && transaction.nature !== filters.nature) return false
    if (needle && !transaction.description.toLowerCase().includes(needle)) return false
    return true
  })
}

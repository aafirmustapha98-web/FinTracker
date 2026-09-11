/**
 * Calculs dérivés. Fonctions pures : aucune ne modifie l'état, ce qui les rend
 * testables et réutilisables entre les pages.
 */
import type { AppState, Category, ID, Investment, Month, Transaction } from '../types'
import { addMonths, currentMonth, monthOf, monthRange } from './date'

export interface MonthTotals {
  month: Month
  income: number
  expense: number
  fixed: number
  variable: number
  savings: number
  savingsRate: number
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function categoryById(state: AppState): Map<ID, Category> {
  return new Map(state.categories.map((category) => [category.id, category]))
}

export function categoryName(state: AppState, id: ID): string {
  return state.categories.find((category) => category.id === id)?.name ?? 'Sans catégorie'
}

export function transactionsOfMonth(state: AppState, month: Month): Transaction[] {
  return state.transactions.filter((transaction) => monthOf(transaction.date) === month)
}

export function monthTotals(state: AppState, month: Month): MonthTotals {
  const list = transactionsOfMonth(state, month)
  const income = sum(list.filter((t) => t.kind === 'income').map((t) => t.amount))
  const expenses = list.filter((t) => t.kind === 'expense')
  const expense = sum(expenses.map((t) => t.amount))
  const fixed = sum(expenses.filter((t) => t.nature === 'fixed').map((t) => t.amount))
  const savings = income - expense
  return {
    month,
    income,
    expense,
    fixed,
    variable: expense - fixed,
    savings,
    savingsRate: income > 0 ? (savings / income) * 100 : 0,
  }
}

/** Série mensuelle sur les `count` derniers mois (mois courant inclus). */
export function monthlySeries(state: AppState, count = 12, end: Month = currentMonth()): MonthTotals[] {
  return monthRange(end, count).map((month) => monthTotals(state, month))
}

export interface CategoryBreakdown {
  categoryId: ID
  name: string
  colorSlot: number
  nature?: 'fixed' | 'variable'
  total: number
  count: number
  share: number
}

/** Répartition d'un ensemble d'opérations par catégorie, de la plus grosse à la plus petite. */
export function breakdownByCategory(state: AppState, transactions: Transaction[]): CategoryBreakdown[] {
  const categories = categoryById(state)
  const totals = new Map<ID, { total: number; count: number }>()
  for (const transaction of transactions) {
    const current = totals.get(transaction.categoryId) ?? { total: 0, count: 0 }
    totals.set(transaction.categoryId, { total: current.total + transaction.amount, count: current.count + 1 })
  }
  const grandTotal = sum([...totals.values()].map((entry) => entry.total))
  return [...totals.entries()]
    .map(([categoryId, entry]) => {
      const category = categories.get(categoryId)
      return {
        categoryId,
        name: category?.name ?? 'Sans catégorie',
        colorSlot: category?.colorSlot ?? 1,
        nature: category?.nature,
        total: entry.total,
        count: entry.count,
        share: grandTotal > 0 ? (entry.total / grandTotal) * 100 : 0,
      }
    })
    .sort((a, b) => b.total - a.total)
}

export interface BudgetLine {
  categoryId: ID
  name: string
  colorSlot: number
  nature?: 'fixed' | 'variable'
  budget: number
  spent: number
  remaining: number
  /** Consommation en % du budget (peut dépasser 100). */
  ratio: number
  status: 'ok' | 'warning' | 'over' | 'unbudgeted'
}

export interface BudgetReport {
  month: Month
  lines: BudgetLine[]
  totalBudget: number
  totalSpent: number
  overCount: number
}

export function budgetReport(state: AppState, month: Month): BudgetReport {
  const expenses = transactionsOfMonth(state, month).filter((t) => t.kind === 'expense')
  const spentByCategory = new Map<ID, number>()
  for (const transaction of expenses) {
    spentByCategory.set(transaction.categoryId, (spentByCategory.get(transaction.categoryId) ?? 0) + transaction.amount)
  }
  const budgets = state.budgets.filter((budget) => budget.month === month)
  const budgetByCategory = new Map(budgets.map((budget) => [budget.categoryId, budget.amount]))

  const categoryIds = new Set<ID>([...budgetByCategory.keys(), ...spentByCategory.keys()])
  const lines: BudgetLine[] = [...categoryIds].map((categoryId) => {
    const category = state.categories.find((c) => c.id === categoryId)
    const budget = budgetByCategory.get(categoryId) ?? 0
    const spent = spentByCategory.get(categoryId) ?? 0
    const ratio = budget > 0 ? (spent / budget) * 100 : 0
    let status: BudgetLine['status'] = 'ok'
    if (budget === 0) status = 'unbudgeted'
    else if (ratio > 100) status = 'over'
    else if (ratio >= 85) status = 'warning'
    return {
      categoryId,
      name: category?.name ?? 'Sans catégorie',
      colorSlot: category?.colorSlot ?? 1,
      nature: category?.nature,
      budget,
      spent,
      remaining: budget - spent,
      ratio,
      status,
    }
  })

  lines.sort((a, b) => {
    if (a.status === 'unbudgeted' && b.status !== 'unbudgeted') return 1
    if (b.status === 'unbudgeted' && a.status !== 'unbudgeted') return -1
    return b.spent - a.spent
  })

  return {
    month,
    lines,
    totalBudget: sum(lines.map((line) => line.budget)),
    totalSpent: sum(lines.map((line) => line.spent)),
    overCount: lines.filter((line) => line.status === 'over').length,
  }
}

export interface SavingsGoalProgress {
  id: ID
  name: string
  colorSlot: number
  targetAmount: number
  targetDate?: string
  saved: number
  progress: number
}

export interface SavingsSummary {
  total: number
  allocated: number
  available: number
  monthTotal: number
  goals: SavingsGoalProgress[]
  /** Épargne cumulée mois par mois. */
  cumulative: Array<{ month: Month; deposits: number; cumulative: number }>
}

export function savingsSummary(state: AppState, count = 12, end: Month = currentMonth()): SavingsSummary {
  const entries = state.savingsEntries
  const total = sum(entries.map((entry) => entry.amount))
  const goals: SavingsGoalProgress[] = state.savingsGoals.map((goal) => {
    const saved = sum(entries.filter((entry) => entry.goalId === goal.id).map((entry) => entry.amount))
    return {
      id: goal.id,
      name: goal.name,
      colorSlot: goal.colorSlot,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      saved,
      progress: goal.targetAmount > 0 ? Math.min((saved / goal.targetAmount) * 100, 999) : 0,
    }
  })
  const allocated = sum(goals.map((goal) => goal.saved))

  const months = monthRange(end, count)
  const start = months[0]
  let running = sum(entries.filter((entry) => monthOf(entry.date) < start).map((entry) => entry.amount))
  const cumulative = months.map((month) => {
    const deposits = sum(entries.filter((entry) => monthOf(entry.date) === month).map((entry) => entry.amount))
    running += deposits
    return { month, deposits, cumulative: running }
  })

  return {
    total,
    allocated,
    available: total - allocated,
    monthTotal: cumulative[cumulative.length - 1]?.deposits ?? 0,
    goals,
    cumulative,
  }
}

export interface InvestmentLine extends Investment {
  invested: number
  value: number
  gain: number
  gainPct: number
  share: number
}

export interface Portfolio {
  invested: number
  value: number
  gain: number
  gainPct: number
  lines: InvestmentLine[]
  byType: Array<{ type: string; label: string; value: number; share: number }>
}

export const INVESTMENT_TYPE_LABELS: Record<string, string> = {
  action: 'Actions',
  etf: 'ETF',
  opcvm: 'OPCVM',
  obligation: 'Obligations',
  crypto: 'Crypto',
  autre: 'Autres',
}

export function portfolio(state: AppState): Portfolio {
  const invested = sum(state.investments.map((i) => i.quantity * i.purchasePrice))
  const value = sum(state.investments.map((i) => i.quantity * i.currentPrice))
  const lines: InvestmentLine[] = state.investments
    .map((investment) => {
      const lineInvested = investment.quantity * investment.purchasePrice
      const lineValue = investment.quantity * investment.currentPrice
      return {
        ...investment,
        invested: lineInvested,
        value: lineValue,
        gain: lineValue - lineInvested,
        gainPct: lineInvested > 0 ? ((lineValue - lineInvested) / lineInvested) * 100 : 0,
        share: value > 0 ? (lineValue / value) * 100 : 0,
      }
    })
    .sort((a, b) => b.value - a.value)

  const typeTotals = new Map<string, number>()
  for (const line of lines) typeTotals.set(line.type, (typeTotals.get(line.type) ?? 0) + line.value)
  const byType = [...typeTotals.entries()]
    .map(([type, typeValue]) => ({
      type,
      label: INVESTMENT_TYPE_LABELS[type] ?? type,
      value: typeValue,
      share: value > 0 ? (typeValue / value) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value)

  return { invested, value, gain: value - invested, gainPct: invested > 0 ? ((value - invested) / invested) * 100 : 0, lines, byType }
}

export interface NetWorth {
  /** Actifs saisis manuellement (hors portefeuille). */
  manualAssets: number
  /** Valeur actuelle du portefeuille, reprise automatiquement. */
  portfolioValue: number
  assets: number
  debts: number
  net: number
}

export function netWorth(state: AppState): NetWorth {
  const manualAssets = sum(state.assets.map((asset) => asset.value))
  const portfolioValue = portfolio(state).value
  const debts = sum(state.debts.map((debt) => debt.balance))
  const assets = manualAssets + portfolioValue
  return { manualAssets, portfolioValue, assets, debts, net: assets - debts }
}

export interface NetWorthPoint {
  month: Month
  assets: number
  debts: number
  net: number
  /** Vrai pour le mois en cours, calculé en direct à partir des actifs et dettes. */
  live?: boolean
}

/**
 * Historique du patrimoine : les photographies enregistrées, complétées par le
 * mois en cours calculé à partir des actifs et dettes actuels.
 */
export function netWorthHistory(state: AppState, count = 12): NetWorthPoint[] {
  const thisMonth = currentMonth()
  const byMonth = new Map<Month, NetWorthPoint>()
  for (const snapshot of state.snapshots) {
    byMonth.set(snapshot.month, {
      month: snapshot.month,
      assets: snapshot.assets,
      debts: snapshot.debts,
      net: snapshot.assets - snapshot.debts,
    })
  }
  const current = netWorth(state)
  byMonth.set(thisMonth, { month: thisMonth, assets: current.assets, debts: current.debts, net: current.net, live: true })

  const months = monthRange(thisMonth, count)
  return months
    .map((month) => byMonth.get(month))
    .filter((point): point is NetWorthPoint => Boolean(point))
}

/** Variation en % entre le mois courant et le précédent. */
export function monthOverMonth(state: AppState, month: Month, field: keyof MonthTotals): number | null {
  const current = monthTotals(state, month)[field] as number
  const previous = monthTotals(state, addMonths(month, -1))[field] as number
  if (!previous) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

export const ASSET_TYPE_LABELS: Record<string, string> = {
  cash: 'Liquidités',
  bank: 'Comptes bancaires',
  savings: 'Épargne',
  vehicle: 'Véhicules',
  realestate: 'Immobilier',
  other: 'Autres',
}

export const DEBT_TYPE_LABELS: Record<string, string> = {
  mortgage: 'Crédit immobilier',
  loan: 'Prêt',
  credit: 'Crédit à la consommation',
  other: 'Autre',
}

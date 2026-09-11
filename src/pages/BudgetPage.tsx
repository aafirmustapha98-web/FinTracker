import { useMemo, useState } from 'react'
import type { Budget } from '../types'
import { useStore } from '../store/store'
import { useAppTheme } from '../lib/theme'
import { addMonths, currentMonth, formatMonth } from '../lib/date'
import { formatMoney, formatPercent, parseAmount } from '../lib/format'
import { budgetReport, type BudgetLine } from '../lib/selectors'
import { MonthPicker } from '../components/Filters'
import { FormModal } from '../components/ui/Modal'
import { Badge, Card, CardHeader, EmptyState, Meter, Money, Note, StatCard } from '../components/ui/primitives'
import { IconEdit, IconPlus, IconTrash } from '../components/ui/Icons'
import { createId } from '../lib/id'

const STATUS: Record<BudgetLine['status'], { label: string; tone: 'good' | 'warning' | 'critical' | 'neutral' }> = {
  ok: { label: 'Dans le budget', tone: 'good' },
  warning: { label: 'Bientôt atteint', tone: 'warning' },
  over: { label: 'Dépassement', tone: 'critical' },
  unbudgeted: { label: 'Sans budget', tone: 'neutral' },
}

export function BudgetPage() {
  const { state, upsert, remove } = useStore()
  const { theme } = useAppTheme()
  const [month, setMonth] = useState(currentMonth())
  const [editing, setEditing] = useState<{ categoryId: string; amount: string; id?: string } | null>(null)

  const report = useMemo(() => budgetReport(state, month), [state, month])
  const expenseCategories = state.categories.filter((category) => category.kind === 'expense')
  const previousMonth = addMonths(month, -1)
  const previousBudgets = state.budgets.filter((budget) => budget.month === previousMonth)

  const copyPreviousMonth = () => {
    for (const budget of previousBudgets) {
      upsert('budgets', { id: createId('bud'), month, categoryId: budget.categoryId, amount: budget.amount })
    }
  }

  const saveBudget = () => {
    if (!editing) return
    const amount = parseAmount(editing.amount)
    if (!Number.isFinite(amount) || amount < 0) return
    const existing = state.budgets.find((budget) => budget.month === month && budget.categoryId === editing.categoryId)
    const item: Budget = {
      id: existing?.id ?? editing.id ?? createId('bud'),
      month,
      categoryId: editing.categoryId,
      amount: Math.round(amount * 100) / 100,
    }
    upsert('budgets', item)
    setEditing(null)
  }

  const removeBudget = (categoryId: string) => {
    const existing = state.budgets.find((budget) => budget.month === month && budget.categoryId === categoryId)
    if (existing) remove('budgets', existing.id)
  }

  const remaining = report.totalBudget - report.totalSpent
  const budgetedLines = report.lines.filter((line) => line.status !== 'unbudgeted')
  const unbudgetedLines = report.lines.filter((line) => line.status === 'unbudgeted')

  return (
    <div className="page">
      <div className="toolbar row between">
        <MonthPicker month={month} onChange={setMonth} />
        <div className="row">
          {previousBudgets.length > 0 && report.totalBudget === 0 ? (
            <button type="button" className="btn btn-sm" onClick={copyPreviousMonth}>
              Reprendre les budgets de {formatMonth(previousMonth)}
            </button>
          ) : null}
          <button
            type="button" className="btn btn-primary btn-sm"
            onClick={() => setEditing({ categoryId: expenseCategories[0]?.id ?? '', amount: '' })}
            disabled={expenseCategories.length === 0}
          >
            <IconPlus size={14} /> Définir un budget
          </button>
        </div>
      </div>

      <div className="grid cols-4">
        <StatCard label="Budget total" value={formatMoney(report.totalBudget)} foot={`${budgetedLines.length} catégorie(s)`} />
        <StatCard label="Dépenses réelles" value={formatMoney(report.totalSpent)} />
        <StatCard
          label={remaining >= 0 ? 'Reste à dépenser' : 'Dépassement'}
          value={formatMoney(Math.abs(remaining))}
          tone={remaining >= 0 ? 'positive' : 'negative'}
        />
        <StatCard
          label="Catégories en dépassement"
          value={String(report.overCount)}
          tone={report.overCount > 0 ? 'negative' : 'positive'}
          foot={report.overCount === 0 ? 'Tout est sous contrôle' : 'À surveiller'}
        />
      </div>

      <Card>
        <CardHeader title="Budget prévu et dépenses réelles" subtitle={formatMonth(month)} />
        <div className="card-body">
          {budgetedLines.length === 0 ? (
            <EmptyState
              title="Aucun budget pour ce mois"
              hint="Définissez un montant par catégorie pour comparer le prévu et le réel."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th style={{ minWidth: 160 }}>Consommation</th>
                    <th className="right">Budget</th>
                    <th className="right">Réel</th>
                    <th className="right">Écart</th>
                    <th>Statut</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {budgetedLines.map((line) => (
                    <tr key={line.categoryId}>
                      <td>
                        <span className="cat">
                          <span className="dot" style={{ background: theme.slot(line.colorSlot) }} />
                          {line.name}
                        </span>
                      </td>
                      <td>
                        <Meter
                          ratio={line.ratio}
                          tone={line.status === 'over' ? 'critical' : line.status === 'warning' ? 'warning' : 'good'}
                        />
                        <span className="muted small num">{formatPercent(line.ratio, 0)}</span>
                      </td>
                      <td className="right nowrap num">{formatMoney(line.budget)}</td>
                      <td className="right nowrap num">{formatMoney(line.spent)}</td>
                      <td className="right nowrap">
                        <Money value={line.remaining} colored sign />
                      </td>
                      <td>
                        <Badge tone={STATUS[line.status].tone}>{STATUS[line.status].label}</Badge>
                      </td>
                      <td className="actions">
                        <button
                          type="button" className="icon-btn" aria-label="Modifier le budget"
                          onClick={() => setEditing({ categoryId: line.categoryId, amount: String(line.budget) })}
                        >
                          <IconEdit size={15} />
                        </button>
                        <button
                          type="button" className="icon-btn danger" aria-label="Supprimer le budget"
                          onClick={() => removeBudget(line.categoryId)}
                        >
                          <IconTrash size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {unbudgetedLines.length > 0 ? (
        <Card>
          <CardHeader
            title="Dépenses hors budget"
            subtitle="Catégories dépensées ce mois-ci sans budget défini"
          />
          <div className="card-body">
            <Note>
              Ces catégories ne sont pas encore budgétées : leur montant n'entre pas dans le total du budget prévu.
            </Note>
            <div className="table-wrap" style={{ marginTop: 12 }}>
              <table className="table">
                <tbody>
                  {unbudgetedLines.map((line) => (
                    <tr key={line.categoryId}>
                      <td>
                        <span className="cat">
                          <span className="dot" style={{ background: theme.slot(line.colorSlot) }} />
                          {line.name}
                        </span>
                      </td>
                      <td className="right nowrap num">{formatMoney(line.spent)}</td>
                      <td className="actions">
                        <button
                          type="button" className="btn btn-sm"
                          onClick={() => setEditing({ categoryId: line.categoryId, amount: String(Math.round(line.spent)) })}
                        >
                          Définir un budget
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      ) : null}

      {editing ? (
        <FormModal title="Budget mensuel" onClose={() => setEditing(null)} onSubmit={saveBudget}>
          <div className="field">
            <label htmlFor="budget-category">Catégorie</label>
            <select
              id="budget-category" className="select" value={editing.categoryId}
              onChange={(event) => setEditing({ ...editing, categoryId: event.target.value })}
            >
              {expenseCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="budget-amount">Montant du budget (MAD)</label>
            <input
              id="budget-amount" className="input" inputMode="decimal" value={editing.amount}
              onChange={(event) => setEditing({ ...editing, amount: event.target.value })} autoFocus
            />
            <span className="hint">Appliqué à {formatMonth(month)}.</span>
          </div>
        </FormModal>
      ) : null}
    </div>
  )
}

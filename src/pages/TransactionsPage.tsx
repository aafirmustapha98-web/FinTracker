import { useEffect, useMemo, useState } from 'react'
import type { CategoryKind, Transaction } from '../types'
import { useStore } from '../store/store'
import { useAppTheme } from '../lib/theme'
import { currentMonth, formatDate, monthOf, monthRange } from '../lib/date'
import { formatMoney, formatPercent } from '../lib/format'
import { breakdownByCategory } from '../lib/selectors'
import { filterTransactions, monthsInPeriod, resolvePeriod, type TransactionFilters } from '../lib/filters'
import { FilterBar } from '../components/Filters'
import { TransactionForm } from '../components/TransactionForm'
import { CategoryManager } from '../components/CategoryManager'
import { ConfirmDialog } from '../components/ui/Modal'
import { Badge, Card, CardHeader, EmptyState, Money, StatCard } from '../components/ui/primitives'
import { HorizontalBars } from '../components/charts/HorizontalBars'
import { MonthlyBars } from '../components/charts/TimeSeries'
import { IconEdit, IconPlus, IconSettings, IconTrash } from '../components/ui/Icons'

/** Page Revenus / Dépenses : même logique, deux natures d'opérations. */
export function TransactionsPage({ kind }: { kind: CategoryKind }) {
  const { state, upsert, remove } = useStore()
  const { theme } = useAppTheme()
  const isExpense = kind === 'expense'

  const [filters, setFilters] = useState<TransactionFilters>({
    period: resolvePeriod('last-3'),
    categoryId: 'all',
    search: '',
    nature: 'all',
  })
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [creating, setCreating] = useState(false)
  const [managingCategories, setManagingCategories] = useState(false)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [limit, setLimit] = useState(50)

  const categories = useMemo(
    () => state.categories.filter((category) => category.kind === kind),
    [state.categories, kind],
  )

  const all = useMemo(
    () => state.transactions.filter((transaction) => transaction.kind === kind),
    [state.transactions, kind],
  )
  const visible = useMemo(() => filterTransactions(all, filters), [all, filters])
  // Une liste filtrée repart toujours du début.
  useEffect(() => setLimit(50), [filters])
  const shown = visible.slice(0, limit)

  const total = visible.reduce((sum, transaction) => sum + transaction.amount, 0)
  const months = monthsInPeriod(filters.period, visible)
  const breakdown = useMemo(() => breakdownByCategory(state, visible), [state, visible])
  const fixedTotal = visible.filter((t) => t.nature === 'fixed').reduce((sum, t) => sum + t.amount, 0)

  const monthlySeries = useMemo(() => {
    const range = monthRange(currentMonth(), 12)
    return range.map((month) => ({
      month,
      total: all
        .filter((transaction) => monthOf(transaction.date) === month)
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    }))
  }, [all])

  const color = isExpense ? theme.expense : theme.income
  const categoryColor = (slot: number) => theme.slot(slot)

  return (
    <div className="page">
      <FilterBar filters={filters} onChange={setFilters} categories={categories} showNature={isExpense} />

      <div className="grid cols-4">
        <StatCard
          label={`Total ${isExpense ? 'des dépenses' : 'des revenus'} — période`}
          value={formatMoney(total)}
        />
        <StatCard label="Moyenne mensuelle" value={formatMoney(total / months)} foot={`Sur ${months} mois`} />
        <StatCard label="Opérations" value={String(visible.length)} foot={`${breakdown.length} catégorie(s)`} />
        {isExpense ? (
          <StatCard
            label="Part des dépenses fixes"
            value={formatPercent(total > 0 ? (fixedTotal / total) * 100 : 0, 0)}
            foot={`${formatMoney(fixedTotal)} de charges fixes`}
          />
        ) : (
          <StatCard
            label="Source principale"
            value={breakdown[0]?.name ?? '—'}
            foot={breakdown[0] ? `${formatPercent(breakdown[0].share, 0)} du total` : undefined}
          />
        )}
      </div>

      <div className="grid split">
        <Card>
          <CardHeader
            title={isExpense ? 'Dépenses par mois' : 'Revenus par mois'}
            subtitle="12 derniers mois — indépendant des filtres"
          />
          <div className="card-body tight">
            <MonthlyBars data={monthlySeries} theme={theme} dataKey="total" color={color} height={230} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Répartition par catégorie" subtitle="Sur la période filtrée" />
          <div className="card-body tight">
            {breakdown.length === 0 ? (
              <EmptyState title="Aucune donnée sur cette période" />
            ) : (
              <HorizontalBars
                total={total}
                items={breakdown.slice(0, 8).map((item) => ({
                  id: item.categoryId,
                  label: item.name,
                  value: item.total,
                  color: categoryColor(item.colorSlot),
                }))}
              />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Opérations"
          subtitle={`${visible.length} opération(s) affichée(s)`}
          action={(
            <div className="row">
              <button type="button" className="btn btn-sm" onClick={() => setManagingCategories(true)}>
                <IconSettings size={14} /> Catégories
              </button>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setCreating(true)}>
                <IconPlus size={14} /> {isExpense ? 'Ajouter une dépense' : 'Ajouter un revenu'}
              </button>
            </div>
          )}
        />
        <div className="card-body flush" style={{ marginTop: 14 }}>
          {visible.length === 0 ? (
            <EmptyState
              title="Aucune opération"
              hint="Modifiez les filtres ou ajoutez une première opération."
            />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Catégorie</th>
                    {isExpense ? <th>Nature</th> : null}
                    <th className="right">Montant</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {shown.map((transaction) => {
                    const category = state.categories.find((c) => c.id === transaction.categoryId)
                    return (
                      <tr key={transaction.id}>
                        <td className="muted nowrap num">{formatDate(transaction.date)}</td>
                        <td>{transaction.description}</td>
                        <td>
                          <span className="cat">
                            <span className="dot" style={{ background: categoryColor(category?.colorSlot ?? 1) }} />
                            {category?.name ?? 'Sans catégorie'}
                          </span>
                        </td>
                        {isExpense ? (
                          <td><Badge>{transaction.nature === 'fixed' ? 'Fixe' : 'Variable'}</Badge></td>
                        ) : null}
                        <td className="right nowrap">
                          <Money value={transaction.amount} />
                        </td>
                        <td className="actions">
                          <button type="button" className="icon-btn" aria-label="Modifier" onClick={() => setEditing(transaction)}>
                            <IconEdit size={15} />
                          </button>
                          <button type="button" className="icon-btn danger" aria-label="Supprimer" onClick={() => setDeleting(transaction)}>
                            <IconTrash size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          {visible.length > shown.length ? (
            <div className="row" style={{ justifyContent: 'center', padding: '14px 0' }}>
              <button type="button" className="btn btn-sm" onClick={() => setLimit(limit + 50)}>
                Afficher 50 opérations de plus ({visible.length - shown.length} restantes)
              </button>
            </div>
          ) : null}
        </div>
      </Card>

      {creating || editing ? (
        <TransactionForm
          kind={kind}
          categories={categories}
          initial={editing ?? undefined}
          onSave={(transaction) => upsert('transactions', transaction)}
          onClose={() => { setCreating(false); setEditing(null) }}
        />
      ) : null}

      {managingCategories ? <CategoryManager kind={kind} onClose={() => setManagingCategories(false)} /> : null}

      {deleting ? (
        <ConfirmDialog
          title="Supprimer l'opération"
          message={`« ${deleting.description} » (${formatMoney(deleting.amount)}) sera définitivement supprimée.`}
          onConfirm={() => remove('transactions', deleting.id)}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}

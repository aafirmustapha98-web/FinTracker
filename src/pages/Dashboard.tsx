import { useMemo } from 'react'
import { useStore } from '../store/store'
import { useAppTheme } from '../lib/theme'
import { currentMonth, formatDate, formatMonth } from '../lib/date'
import { formatMoney, formatPercent } from '../lib/format'
import {
  breakdownByCategory, budgetReport, monthOverMonth, monthTotals, monthlySeries,
  netWorth, netWorthHistory, portfolio, savingsSummary, transactionsOfMonth,
} from '../lib/selectors'
import { Badge, Card, CardHeader, Delta, EmptyState, Meter, Money, StatCard } from '../components/ui/primitives'
import { HorizontalBars } from '../components/charts/HorizontalBars'
import { IncomeExpenseBars, NetWorthTrend, SavingsTrend } from '../components/charts/TimeSeries'

export function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { state } = useStore()
  const { theme } = useAppTheme()
  const month = currentMonth()

  const totals = useMemo(() => monthTotals(state, month), [state, month])
  const series = useMemo(() => monthlySeries(state, 12), [state])
  const wealth = useMemo(() => netWorth(state), [state])
  const history = useMemo(() => netWorthHistory(state, 12), [state])
  const folio = useMemo(() => portfolio(state), [state])
  const savings = useMemo(() => savingsSummary(state, 12), [state])
  const budget = useMemo(() => budgetReport(state, month), [state, month])

  const expenseBreakdown = useMemo(() => {
    const expenses = transactionsOfMonth(state, month).filter((t) => t.kind === 'expense')
    return breakdownByCategory(state, expenses)
  }, [state, month])

  const netDelta = history.length >= 2
    ? ((history[history.length - 1].net - history[history.length - 2].net) / Math.abs(history[history.length - 2].net || 1)) * 100
    : null

  const recent = state.transactions.slice(0, 8)
  const overBudget = budget.lines.filter((line) => line.status === 'over')
  const watchList = (overBudget.length > 0 ? overBudget : budget.lines.filter((line) => line.budget > 0))
    .slice()
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 5)
  const targetReached = totals.savingsRate >= state.settings.savingsRateTarget

  return (
    <div className="page">
      <div className="grid cols-4">
        <StatCard
          label="Revenus du mois"
          value={formatMoney(totals.income)}
          delta={monthOverMonth(state, month, 'income')}
        />
        <StatCard
          label="Dépenses du mois"
          value={formatMoney(totals.expense)}
          delta={monthOverMonth(state, month, 'expense')}
          invertDelta
          foot={`dont ${formatMoney(totals.fixed)} de charges fixes`}
        />
        <StatCard
          label="Épargne du mois"
          value={formatMoney(totals.savings)}
          tone={totals.savings >= 0 ? 'positive' : 'negative'}
          foot={(
            <span className="row" style={{ gap: 6 }}>
              <Badge tone={targetReached ? 'good' : 'warning'}>
                Taux {formatPercent(totals.savingsRate, 0)}
              </Badge>
              <span className="muted">objectif {state.settings.savingsRateTarget} %</span>
            </span>
          )}
        />
        <StatCard
          label="Investissements"
          value={formatMoney(folio.value)}
          foot={(
            <span>
              <span className={folio.gain >= 0 ? 'pos' : 'neg'}>
                {formatMoney(folio.gain, { sign: true })} ({formatPercent(folio.gainPct, 1, true)})
              </span>
              <span className="muted"> de plus-value</span>
            </span>
          )}
        />
      </div>

      <div className="grid split">
        <Card>
          <CardHeader
            title="Patrimoine net"
            subtitle="Actifs et portefeuille, moins les dettes — 12 derniers mois"
            action={(
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('wealth')}>
                Détail
              </button>
            )}
          />
          <div className="card-body tight">
            <div className="row" style={{ gap: 12, alignItems: 'baseline', marginBottom: 4 }}>
              <span className="stat-value hero" style={{ marginTop: 0 }}>{formatMoney(wealth.net)}</span>
              {netDelta !== null ? <Delta value={netDelta} /> : null}
            </div>
            <p className="muted small" style={{ marginBottom: 10 }}>
              {formatMoney(wealth.assets)} d'actifs − {formatMoney(wealth.debts)} de dettes
            </p>
            <NetWorthTrend data={history} theme={theme} height={230} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Dépenses du mois par catégorie" subtitle={formatMonth(month)} />
          <div className="card-body tight">
            {expenseBreakdown.length === 0 ? (
              <EmptyState title="Aucune dépense ce mois-ci" />
            ) : (
              <HorizontalBars
                total={totals.expense}
                items={expenseBreakdown.slice(0, 6).map((item) => ({
                  id: item.categoryId,
                  label: item.name,
                  value: item.total,
                  color: theme.slot(item.colorSlot),
                }))}
              />
            )}
          </div>
        </Card>
      </div>

      <div className="grid split-even">
        <Card>
          <CardHeader title="Revenus et dépenses" subtitle="12 derniers mois" />
          <div className="card-body tight" style={{ paddingBottom: 0 }}>
            <IncomeExpenseBars data={series} theme={theme} height={230} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Suivi du budget"
            subtitle={formatMonth(month)}
            action={(
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('budget')}>
                Gérer
              </button>
            )}
          />
          <div className="card-body tight">
            {budget.totalBudget === 0 ? (
              <EmptyState title="Aucun budget défini" hint="Définissez un budget par catégorie pour suivre vos écarts." />
            ) : (
              <>
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span className="small secondary">
                    <Money value={budget.totalSpent} /> sur <Money value={budget.totalBudget} />
                  </span>
                  <Badge tone={budget.totalSpent > budget.totalBudget ? 'critical' : 'good'}>
                    {formatPercent(budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0, 0)} consommé
                  </Badge>
                </div>
                <Meter
                  ratio={(budget.totalSpent / budget.totalBudget) * 100}
                  tone={budget.totalSpent > budget.totalBudget ? 'critical' : 'good'}
                />
                <div style={{ marginTop: 16 }}>
                  <p className="small secondary" style={{ marginBottom: 8 }}>
                    {overBudget.length > 0
                      ? `${overBudget.length} catégorie(s) au-dessus du budget :`
                      : 'Aucun dépassement. Catégories les plus consommées :'}
                  </p>
                  {watchList.map((line) => (
                    <div key={line.categoryId} style={{ marginBottom: 11 }}>
                      <div className="row between small">
                        <span className="cat">
                          <span className="dot" style={{ background: theme.slot(line.colorSlot) }} />
                          {line.name}
                        </span>
                        <span className={line.remaining < 0 ? 'num neg' : 'num muted'}>
                          {line.remaining < 0
                            ? `${formatMoney(line.remaining)} de dépassement`
                            : `${formatMoney(line.remaining)} restants`}
                        </span>
                      </div>
                      <Meter
                        ratio={line.ratio}
                        tone={line.status === 'over' ? 'critical' : line.status === 'warning' ? 'warning' : 'good'}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      <div className="grid split-even">
        <Card>
          <CardHeader
            title="Épargne cumulée"
            subtitle={`${formatMoney(savings.total)} épargnés au total`}
            action={(
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => onNavigate('savings')}>
                Détail
              </button>
            )}
          />
          <div className="card-body tight">
            <SavingsTrend data={savings.cumulative} theme={theme} height={220} />
          </div>
        </Card>

        <Card>
          <CardHeader title="Dernières opérations" subtitle="Tous comptes confondus" />
          <div className="card-body flush" style={{ marginTop: 14 }}>
            {recent.length === 0 ? (
              <EmptyState title="Aucune opération enregistrée" />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <tbody>
                    {recent.map((transaction) => {
                      const category = state.categories.find((c) => c.id === transaction.categoryId)
                      return (
                        <tr key={transaction.id}>
                          <td className="muted nowrap num" style={{ width: 1 }}>{formatDate(transaction.date)}</td>
                          <td>
                            {transaction.description}
                            <span className="muted small"> · {category?.name}</span>
                          </td>
                          <td className="right nowrap">
                            <span className={transaction.kind === 'income' ? 'pos num' : 'num'}>
                              {transaction.kind === 'income' ? '+' : '−'}{formatMoney(transaction.amount)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

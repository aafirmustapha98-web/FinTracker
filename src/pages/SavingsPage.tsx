import { useMemo, useState } from 'react'
import type { SavingsEntry, SavingsGoal } from '../types'
import { useStore } from '../store/store'
import { useAppTheme } from '../lib/theme'
import { currentMonth, formatDate, today } from '../lib/date'
import { formatMoney, formatPercent, parseAmount } from '../lib/format'
import { monthTotals, savingsSummary } from '../lib/selectors'
import { createId } from '../lib/id'
import { ConfirmDialog, FormModal } from '../components/ui/Modal'
import { Badge, Card, CardHeader, EmptyState, Meter, Money, Note, StatCard } from '../components/ui/primitives'
import { MonthlyBars, SavingsTrend } from '../components/charts/TimeSeries'
import { IconEdit, IconPlus, IconTarget, IconTrash } from '../components/ui/Icons'

export function SavingsPage() {
  const { state, upsert, remove } = useStore()
  const { theme } = useAppTheme()
  const month = currentMonth()

  const summary = useMemo(() => savingsSummary(state, 12), [state])
  const totals = useMemo(() => monthTotals(state, month), [state, month])

  const [entryForm, setEntryForm] = useState<SavingsEntry | 'new' | null>(null)
  const [goalForm, setGoalForm] = useState<SavingsGoal | 'new' | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<SavingsEntry | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<SavingsGoal | null>(null)

  const goalName = (goalId: string | null) =>
    goalId ? state.savingsGoals.find((goal) => goal.id === goalId)?.name ?? 'Objectif supprimé' : 'Épargne disponible'

  return (
    <div className="page">
      <div className="grid cols-4">
        <StatCard
          label="Épargne du mois (revenus − dépenses)"
          value={formatMoney(totals.savings)}
          tone={totals.savings >= 0 ? 'positive' : 'negative'}
          foot={`Taux d'épargne ${formatPercent(totals.savingsRate, 0)}`}
        />
        <StatCard label="Versements du mois" value={formatMoney(summary.monthTotal)} foot="Mouvements enregistrés" />
        <StatCard label="Épargne cumulée" value={formatMoney(summary.total)} />
        <StatCard
          label="Épargne disponible"
          value={formatMoney(summary.available)}
          foot={`${formatMoney(summary.allocated)} affectés à un objectif`}
        />
      </div>

      <div className="grid split-even">
        <Card>
          <CardHeader title="Épargne cumulée" subtitle="12 derniers mois" />
          <div className="card-body tight">
            <SavingsTrend data={summary.cumulative} theme={theme} height={230} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Versements par mois" subtitle="Montant net épargné chaque mois" />
          <div className="card-body tight">
            <MonthlyBars data={summary.cumulative} theme={theme} dataKey="deposits" color={theme.savings} height={230} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Objectifs d'épargne"
          subtitle="Épargne destinée à un projet précis"
          action={(
            <button type="button" className="btn btn-sm" onClick={() => setGoalForm('new')}>
              <IconTarget size={14} /> Nouvel objectif
            </button>
          )}
        />
        <div className="card-body">
          {summary.goals.length === 0 ? (
            <EmptyState title="Aucun objectif" hint="Créez un objectif pour flécher une partie de votre épargne." />
          ) : (
            <div className="grid cols-3">
              {summary.goals.map((goal) => {
                const source = state.savingsGoals.find((item) => item.id === goal.id)!
                const reached = goal.saved >= goal.targetAmount
                return (
                  <div className="card" key={goal.id} style={{ boxShadow: 'none' }}>
                    <div className="card-body">
                      <div className="row between">
                        <span className="cat">
                          <span className="dot" style={{ background: theme.slot(goal.colorSlot) }} />
                          <strong>{goal.name}</strong>
                        </span>
                        <span className="row" style={{ gap: 0 }}>
                          <button type="button" className="icon-btn" aria-label="Modifier" onClick={() => setGoalForm(source)}>
                            <IconEdit size={15} />
                          </button>
                          <button type="button" className="icon-btn danger" aria-label="Supprimer" onClick={() => setDeletingGoal(source)}>
                            <IconTrash size={15} />
                          </button>
                        </span>
                      </div>
                      <div className="stat-value" style={{ fontSize: 20 }}>{formatMoney(goal.saved)}</div>
                      <p className="muted small" style={{ marginBottom: 8 }}>
                        sur {formatMoney(goal.targetAmount)}
                        {goal.targetDate ? ` · échéance ${formatDate(goal.targetDate)}` : ''}
                      </p>
                      <Meter ratio={goal.progress} tone={reached ? 'good' : 'accent'} />
                      <div className="row between small" style={{ marginTop: 7 }}>
                        <span className="muted num">{formatPercent(goal.progress, 0)}</span>
                        {reached
                          ? <Badge tone="good">Objectif atteint</Badge>
                          : <span className="muted num">reste {formatMoney(goal.targetAmount - goal.saved)}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Mouvements d'épargne"
          subtitle={`${state.savingsEntries.length} mouvement(s)`}
          action={(
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setEntryForm('new')}>
              <IconPlus size={14} /> Ajouter un versement
            </button>
          )}
        />
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <Note>
            Un montant négatif enregistre un retrait. L'épargne non affectée à un objectif reste disponible.
          </Note>
        </div>
        <div className="card-body flush" style={{ marginTop: 12 }}>
          {state.savingsEntries.length === 0 ? (
            <EmptyState title="Aucun mouvement" hint="Enregistrez votre premier versement d'épargne." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Affectation</th>
                    <th>Note</th>
                    <th className="right">Montant</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {state.savingsEntries.slice(0, 60).map((entry) => (
                    <tr key={entry.id}>
                      <td className="muted nowrap num">{formatDate(entry.date)}</td>
                      <td>
                        {entry.goalId ? (
                          <span className="cat">
                            <span className="dot" style={{ background: theme.slot(state.savingsGoals.find((g) => g.id === entry.goalId)?.colorSlot ?? 1) }} />
                            {goalName(entry.goalId)}
                          </span>
                        ) : <Badge>Disponible</Badge>}
                      </td>
                      <td className="secondary">{entry.note}</td>
                      <td className="right nowrap"><Money value={entry.amount} colored sign /></td>
                      <td className="actions">
                        <button type="button" className="icon-btn" aria-label="Modifier" onClick={() => setEntryForm(entry)}>
                          <IconEdit size={15} />
                        </button>
                        <button type="button" className="icon-btn danger" aria-label="Supprimer" onClick={() => setDeletingEntry(entry)}>
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

      {entryForm ? (
        <EntryForm
          initial={entryForm === 'new' ? undefined : entryForm}
          goals={state.savingsGoals}
          onSave={(entry) => upsert('savingsEntries', entry)}
          onClose={() => setEntryForm(null)}
        />
      ) : null}

      {goalForm ? (
        <GoalForm
          initial={goalForm === 'new' ? undefined : goalForm}
          onSave={(goal) => upsert('savingsGoals', goal)}
          onClose={() => setGoalForm(null)}
        />
      ) : null}

      {deletingEntry ? (
        <ConfirmDialog
          title="Supprimer le mouvement"
          message={`${formatMoney(deletingEntry.amount)} du ${formatDate(deletingEntry.date)} sera supprimé.`}
          onConfirm={() => remove('savingsEntries', deletingEntry.id)}
          onClose={() => setDeletingEntry(null)}
        />
      ) : null}

      {deletingGoal ? (
        <ConfirmDialog
          title="Supprimer l'objectif"
          message={`« ${deletingGoal.name} » sera supprimé. Les versements associés redeviendront de l'épargne disponible.`}
          onConfirm={() => remove('savingsGoals', deletingGoal.id)}
          onClose={() => setDeletingGoal(null)}
        />
      ) : null}
    </div>
  )
}

function EntryForm({ initial, goals, onSave, onClose }: {
  initial?: SavingsEntry
  goals: SavingsGoal[]
  onSave: (entry: SavingsEntry) => void
  onClose: () => void
}) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.date ?? today())
  const [goalId, setGoalId] = useState(initial?.goalId ?? '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')

  const submit = () => {
    const value = parseAmount(amount)
    if (!Number.isFinite(value) || value === 0) return setError('Saisissez un montant (négatif pour un retrait).')
    onSave({
      id: initial?.id ?? createId('sav'),
      date,
      amount: Math.round(value * 100) / 100,
      goalId: goalId || null,
      note: note.trim(),
    })
    onClose()
  }

  return (
    <FormModal title={initial ? 'Modifier le mouvement' : 'Ajouter un versement'} onClose={onClose} onSubmit={submit}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="sav-amount">Montant (MAD)</label>
          <input id="sav-amount" className="input" inputMode="decimal" value={amount}
            onChange={(event) => setAmount(event.target.value)} autoFocus />
          <span className="hint">Montant négatif = retrait.</span>
        </div>
        <div className="field">
          <label htmlFor="sav-date">Date</label>
          <input id="sav-date" type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="sav-goal">Affectation</label>
        <select id="sav-goal" className="select" value={goalId} onChange={(event) => setGoalId(event.target.value)}>
          <option value="">Épargne disponible</option>
          {goals.map((goal) => <option key={goal.id} value={goal.id}>{goal.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="sav-note">Note</label>
        <input id="sav-note" className="input" value={note} placeholder="Facultatif"
          onChange={(event) => setNote(event.target.value)} />
      </div>
      {error ? <p className="small" style={{ color: 'var(--critical)' }} role="alert">{error}</p> : null}
    </FormModal>
  )
}

function GoalForm({ initial, onSave, onClose }: {
  initial?: SavingsGoal
  onSave: (goal: SavingsGoal) => void
  onClose: () => void
}) {
  const { theme } = useAppTheme()
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial ? String(initial.targetAmount) : '')
  const [targetDate, setTargetDate] = useState(initial?.targetDate ?? '')
  const [colorSlot, setColorSlot] = useState(initial?.colorSlot ?? 1)
  const [error, setError] = useState('')

  const submit = () => {
    const value = parseAmount(target)
    if (!name.trim()) return setError('Donnez un nom à l\'objectif.')
    if (!Number.isFinite(value) || value <= 0) return setError('Le montant cible doit être supérieur à 0.')
    onSave({
      id: initial?.id ?? createId('goal'),
      name: name.trim(),
      targetAmount: Math.round(value * 100) / 100,
      targetDate: targetDate || undefined,
      colorSlot,
    })
    onClose()
  }

  return (
    <FormModal title={initial ? 'Modifier l\'objectif' : 'Nouvel objectif'} onClose={onClose} onSubmit={submit}>
      <div className="field">
        <label htmlFor="goal-name">Nom</label>
        <input id="goal-name" className="input" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="goal-target">Montant cible (MAD)</label>
          <input id="goal-target" className="input" inputMode="decimal" value={target}
            onChange={(event) => setTarget(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="goal-date">Échéance (facultative)</label>
          <input id="goal-date" type="date" className="input" value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Couleur</label>
        <div className="row" style={{ gap: 6 }}>
          {theme.series.map((color, index) => (
            <button
              key={color} type="button" aria-label={`Couleur ${index + 1}`} className="icon-btn"
              onClick={() => setColorSlot(index + 1)}
              style={{
                background: color, width: 26, height: 26, borderRadius: 7,
                border: colorSlot === index + 1 ? '2px solid var(--text-primary)' : '1px solid var(--border)',
              }}
            />
          ))}
        </div>
      </div>
      {error ? <p className="small" style={{ color: 'var(--critical)' }} role="alert">{error}</p> : null}
    </FormModal>
  )
}

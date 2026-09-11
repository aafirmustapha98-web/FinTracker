import { useMemo, useState } from 'react'
import type { Asset, AssetType, Debt, DebtType } from '../types'
import { useStore } from '../store/store'
import { useAppTheme } from '../lib/theme'
import { currentMonth, formatMonth, today } from '../lib/date'
import { formatMoney, formatPercent, parseAmount } from '../lib/format'
import { ASSET_TYPE_LABELS, DEBT_TYPE_LABELS, netWorth, netWorthHistory, portfolio } from '../lib/selectors'
import { createId } from '../lib/id'
import { ConfirmDialog, FormModal } from '../components/ui/Modal'
import { Badge, Card, CardHeader, Delta, EmptyState, Money, Note, StatCard } from '../components/ui/primitives'
import { HorizontalBars } from '../components/charts/HorizontalBars'
import { NetWorthTrend } from '../components/charts/TimeSeries'
import { IconEdit, IconPlus, IconTrash } from '../components/ui/Icons'

const ASSET_TYPES: AssetType[] = ['bank', 'savings', 'cash', 'realestate', 'vehicle', 'other']
const DEBT_TYPES: DebtType[] = ['mortgage', 'loan', 'credit', 'other']

export function WealthPage() {
  const { state, upsert, remove } = useStore()
  const { theme } = useAppTheme()

  const wealth = useMemo(() => netWorth(state), [state])
  const history = useMemo(() => netWorthHistory(state, 12), [state])
  const folio = useMemo(() => portfolio(state), [state])

  const [assetForm, setAssetForm] = useState<Asset | 'new' | null>(null)
  const [debtForm, setDebtForm] = useState<Debt | 'new' | null>(null)
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null)
  const [deletingDebt, setDeletingDebt] = useState<Debt | null>(null)

  const month = currentMonth()
  const snapshotOfMonth = state.snapshots.find((snapshot) => snapshot.month === month)

  const saveSnapshot = () => {
    upsert('snapshots', {
      id: snapshotOfMonth?.id ?? createId('snap'),
      month,
      assets: Math.round(wealth.assets),
      debts: Math.round(wealth.debts),
    })
  }

  const delta = history.length >= 2
    ? ((history[history.length - 1].net - history[history.length - 2].net) / Math.abs(history[history.length - 2].net || 1)) * 100
    : null

  const assetsByType = useMemo(() => {
    const totals = new Map<string, number>()
    for (const asset of state.assets) totals.set(asset.type, (totals.get(asset.type) ?? 0) + asset.value)
    const items = [...totals.entries()].map(([type, value]) => ({
      id: type,
      label: ASSET_TYPE_LABELS[type] ?? type,
      value,
    }))
    if (folio.value > 0) items.push({ id: 'investments', label: 'Investissements', value: folio.value })
    return items
      .sort((a, b) => b.value - a.value)
      .map((item, index) => ({ ...item, color: theme.slot(index + 1) }))
  }, [state.assets, folio.value, theme])

  const debtRatio = wealth.assets > 0 ? (wealth.debts / wealth.assets) * 100 : 0

  return (
    <div className="page">
      <div className="grid cols-4">
        <StatCard
          label="Patrimoine net"
          value={formatMoney(wealth.net)}
          tone={wealth.net >= 0 ? 'positive' : 'negative'}
          foot={delta !== null ? <span><Delta value={delta} /> vs mois précédent</span> : undefined}
        />
        <StatCard label="Total des actifs" value={formatMoney(wealth.assets)} foot={`dont ${formatMoney(wealth.portfolioValue)} d'investissements`} />
        <StatCard label="Total des dettes" value={formatMoney(wealth.debts)} foot={`${state.debts.length} dette(s)`} />
        <StatCard
          label="Taux d'endettement"
          value={formatPercent(debtRatio, 0)}
          foot="Dettes rapportées aux actifs"
          tone={debtRatio > 60 ? 'negative' : 'neutral'}
        />
      </div>

      <div className="grid split">
        <Card>
          <CardHeader
            title="Évolution du patrimoine"
            subtitle="12 derniers mois"
            action={(
              <button type="button" className="btn btn-sm" onClick={saveSnapshot}>
                {snapshotOfMonth ? 'Mettre à jour' : 'Enregistrer'} la photo de {formatMonth(month)}
              </button>
            )}
          />
          <div className="card-body tight">
            {history.length <= 1 ? (
              <EmptyState
                title="Pas encore d'historique"
                hint="Enregistrez une photo mensuelle pour construire votre courbe de patrimoine."
              />
            ) : (
              <NetWorthTrend data={history} theme={theme} height={250} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Composition des actifs" subtitle="Investissements inclus automatiquement" />
          <div className="card-body tight">
            {assetsByType.length === 0 ? (
              <EmptyState title="Aucun actif enregistré" />
            ) : (
              <HorizontalBars items={assetsByType} total={wealth.assets} />
            )}
          </div>
        </Card>
      </div>

      <div className="grid split-even">
        <Card>
          <CardHeader
            title="Actifs"
            subtitle="Liquidités, comptes, immobilier, véhicules…"
            action={(
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setAssetForm('new')}>
                <IconPlus size={14} /> Ajouter
              </button>
            )}
          />
          <div className="card-body flush" style={{ marginTop: 14 }}>
            {state.assets.length === 0 ? (
              <EmptyState title="Aucun actif" hint="Ajoutez vos comptes et biens pour calculer votre patrimoine." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Actif</th><th>Type</th><th className="right">Valeur</th><th /></tr>
                  </thead>
                  <tbody>
                    {[...state.assets].sort((a, b) => b.value - a.value).map((asset) => (
                      <tr key={asset.id}>
                        <td>
                          {asset.name}
                          {asset.note ? <div className="muted small">{asset.note}</div> : null}
                        </td>
                        <td><Badge>{ASSET_TYPE_LABELS[asset.type]}</Badge></td>
                        <td className="right num nowrap">{formatMoney(asset.value)}</td>
                        <td className="actions">
                          <button type="button" className="icon-btn" aria-label="Modifier" onClick={() => setAssetForm(asset)}>
                            <IconEdit size={15} />
                          </button>
                          <button type="button" className="icon-btn danger" aria-label="Supprimer" onClick={() => setDeletingAsset(asset)}>
                            <IconTrash size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={2} className="secondary"><strong>Portefeuille d'investissement</strong>
                        <div className="muted small">Calculé depuis la page Investissements</div>
                      </td>
                      <td className="right num nowrap"><strong>{formatMoney(folio.value)}</strong></td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Dettes"
            subtitle="Crédits et emprunts en cours"
            action={(
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setDebtForm('new')}>
                <IconPlus size={14} /> Ajouter
              </button>
            )}
          />
          <div className="card-body flush" style={{ marginTop: 14 }}>
            {state.debts.length === 0 ? (
              <EmptyState title="Aucune dette" hint="Tant mieux : votre patrimoine net est égal à vos actifs." />
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Dette</th><th className="right">Mensualité</th><th className="right">Capital restant</th><th /></tr>
                  </thead>
                  <tbody>
                    {[...state.debts].sort((a, b) => b.balance - a.balance).map((debt) => (
                      <tr key={debt.id}>
                        <td>
                          <div className="nowrap">{debt.name}</div>
                          <div className="muted small nowrap">
                            {DEBT_TYPE_LABELS[debt.type]}
                            {debt.rate ? ` · taux ${formatPercent(debt.rate, 2)}` : ''}
                          </div>
                        </td>
                        <td className="right num nowrap">{debt.monthlyPayment ? formatMoney(debt.monthlyPayment) : '—'}</td>
                        <td className="right num nowrap">{formatMoney(debt.balance)}</td>
                        <td className="actions">
                          <button type="button" className="icon-btn" aria-label="Modifier" onClick={() => setDebtForm(debt)}>
                            <IconEdit size={15} />
                          </button>
                          <button type="button" className="icon-btn danger" aria-label="Supprimer" onClick={() => setDeletingDebt(debt)}>
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
      </div>

      <Card>
        <CardHeader title="Historique mensuel" subtitle="Photographies enregistrées du patrimoine" />
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <Note>
            Le mois en cours est calculé en direct à partir de vos actifs, dettes et investissements.
            Enregistrez une photo en fin de mois pour figer la valeur dans l'historique.
          </Note>
        </div>
        <div className="card-body flush" style={{ marginTop: 12 }}>
          {state.snapshots.length === 0 ? (
            <EmptyState title="Aucune photo enregistrée" />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Mois</th><th className="right">Actifs</th><th className="right">Dettes</th><th className="right">Patrimoine net</th><th /></tr>
                </thead>
                <tbody>
                  {[...state.snapshots].sort((a, b) => (a.month < b.month ? 1 : -1)).map((snapshot) => (
                    <tr key={snapshot.id}>
                      <td className="nowrap">{formatMonth(snapshot.month)}</td>
                      <td className="right num nowrap">{formatMoney(snapshot.assets)}</td>
                      <td className="right num nowrap">{formatMoney(snapshot.debts)}</td>
                      <td className="right nowrap"><strong><Money value={snapshot.assets - snapshot.debts} /></strong></td>
                      <td className="actions">
                        <button
                          type="button" className="icon-btn danger" aria-label="Supprimer"
                          onClick={() => remove('snapshots', snapshot.id)}
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

      {assetForm ? (
        <AssetForm
          initial={assetForm === 'new' ? undefined : assetForm}
          onSave={(asset) => upsert('assets', asset)}
          onClose={() => setAssetForm(null)}
        />
      ) : null}

      {debtForm ? (
        <DebtForm
          initial={debtForm === 'new' ? undefined : debtForm}
          onSave={(debt) => upsert('debts', debt)}
          onClose={() => setDebtForm(null)}
        />
      ) : null}

      {deletingAsset ? (
        <ConfirmDialog
          title="Supprimer l'actif"
          message={`« ${deletingAsset.name} » sera retiré de votre patrimoine.`}
          onConfirm={() => remove('assets', deletingAsset.id)}
          onClose={() => setDeletingAsset(null)}
        />
      ) : null}

      {deletingDebt ? (
        <ConfirmDialog
          title="Supprimer la dette"
          message={`« ${deletingDebt.name} » sera retirée de votre patrimoine.`}
          onConfirm={() => remove('debts', deletingDebt.id)}
          onClose={() => setDeletingDebt(null)}
        />
      ) : null}
    </div>
  )
}

function AssetForm({ initial, onSave, onClose }: {
  initial?: Asset; onSave: (asset: Asset) => void; onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<AssetType>(initial?.type ?? 'bank')
  const [value, setValue] = useState(initial ? String(initial.value) : '')
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState('')

  const submit = () => {
    const parsed = parseAmount(value)
    if (!name.trim()) return setError('Le nom est obligatoire.')
    if (!Number.isFinite(parsed) || parsed < 0) return setError('La valeur doit être un nombre positif.')
    onSave({
      id: initial?.id ?? createId('ast'),
      name: name.trim(),
      type,
      value: Math.round(parsed * 100) / 100,
      note: note.trim() || undefined,
      updatedAt: today(),
    })
    onClose()
  }

  return (
    <FormModal title={initial ? 'Modifier l\'actif' : 'Ajouter un actif'} onClose={onClose} onSubmit={submit}>
      <div className="field">
        <label htmlFor="asset-name">Nom</label>
        <input id="asset-name" className="input" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="asset-type">Type</label>
          <select id="asset-type" className="select" value={type} onChange={(event) => setType(event.target.value as AssetType)}>
            {ASSET_TYPES.map((option) => <option key={option} value={option}>{ASSET_TYPE_LABELS[option]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="asset-value">Valeur (MAD)</label>
          <input id="asset-value" className="input" inputMode="decimal" value={value}
            onChange={(event) => setValue(event.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="asset-note">Note</label>
        <input id="asset-note" className="input" value={note} placeholder="Facultatif"
          onChange={(event) => setNote(event.target.value)} />
      </div>
      {error ? <p className="small" style={{ color: 'var(--critical)' }} role="alert">{error}</p> : null}
    </FormModal>
  )
}

function DebtForm({ initial, onSave, onClose }: {
  initial?: Debt; onSave: (debt: Debt) => void; onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<DebtType>(initial?.type ?? 'loan')
  const [balance, setBalance] = useState(initial ? String(initial.balance) : '')
  const [rate, setRate] = useState(initial?.rate ? String(initial.rate) : '')
  const [monthlyPayment, setMonthlyPayment] = useState(initial?.monthlyPayment ? String(initial.monthlyPayment) : '')
  const [error, setError] = useState('')

  const submit = () => {
    const parsed = parseAmount(balance)
    if (!name.trim()) return setError('Le nom est obligatoire.')
    if (!Number.isFinite(parsed) || parsed < 0) return setError('Le capital restant doit être un nombre positif.')
    const parsedRate = parseAmount(rate)
    const parsedPayment = parseAmount(monthlyPayment)
    onSave({
      id: initial?.id ?? createId('debt'),
      name: name.trim(),
      type,
      balance: Math.round(parsed * 100) / 100,
      rate: Number.isFinite(parsedRate) && rate.trim() ? parsedRate : undefined,
      monthlyPayment: Number.isFinite(parsedPayment) && monthlyPayment.trim() ? parsedPayment : undefined,
    })
    onClose()
  }

  return (
    <FormModal title={initial ? 'Modifier la dette' : 'Ajouter une dette'} onClose={onClose} onSubmit={submit}>
      <div className="field">
        <label htmlFor="debt-name">Nom</label>
        <input id="debt-name" className="input" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="debt-type">Type</label>
          <select id="debt-type" className="select" value={type} onChange={(event) => setType(event.target.value as DebtType)}>
            {DEBT_TYPES.map((option) => <option key={option} value={option}>{DEBT_TYPE_LABELS[option]}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="debt-balance">Capital restant dû (MAD)</label>
          <input id="debt-balance" className="input" inputMode="decimal" value={balance}
            onChange={(event) => setBalance(event.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="debt-rate">Taux annuel (%)</label>
          <input id="debt-rate" className="input" inputMode="decimal" value={rate} placeholder="Facultatif"
            onChange={(event) => setRate(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="debt-payment">Mensualité (MAD)</label>
          <input id="debt-payment" className="input" inputMode="decimal" value={monthlyPayment} placeholder="Facultatif"
            onChange={(event) => setMonthlyPayment(event.target.value)} />
        </div>
      </div>
      {error ? <p className="small" style={{ color: 'var(--critical)' }} role="alert">{error}</p> : null}
    </FormModal>
  )
}

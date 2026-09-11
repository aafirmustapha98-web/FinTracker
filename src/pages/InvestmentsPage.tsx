import { useMemo, useState } from 'react'
import type { Investment, InvestmentType } from '../types'
import { useStore } from '../store/store'
import { useAppTheme } from '../lib/theme'
import { formatDate, today } from '../lib/date'
import { formatMoney, formatNumber, formatPercent, parseAmount } from '../lib/format'
import { INVESTMENT_TYPE_LABELS, portfolio } from '../lib/selectors'
import { createId } from '../lib/id'
import { ConfirmDialog, FormModal } from '../components/ui/Modal'
import { Card, CardHeader, EmptyState, Money, Note, StatCard } from '../components/ui/primitives'
import { HorizontalBars } from '../components/charts/HorizontalBars'
import { ComparisonBars } from '../components/charts/ComparisonBars'
import { IconEdit, IconPlus, IconTrash } from '../components/ui/Icons'

const TYPE_OPTIONS: InvestmentType[] = ['action', 'etf', 'opcvm', 'obligation', 'crypto', 'autre']

export function InvestmentsPage() {
  const { state, upsert, remove } = useStore()
  const { theme } = useAppTheme()
  const folio = useMemo(() => portfolio(state), [state])

  const [form, setForm] = useState<Investment | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Investment | null>(null)

  const best = folio.lines.reduce<typeof folio.lines[number] | null>(
    (top, line) => (!top || line.gainPct > top.gainPct ? line : top), null)

  return (
    <div className="page">
      <div className="grid cols-4">
        <StatCard label="Valeur du portefeuille" value={formatMoney(folio.value)} foot={`${folio.lines.length} ligne(s)`} />
        <StatCard label="Montant investi" value={formatMoney(folio.invested)} />
        <StatCard
          label="Plus / moins-value"
          value={formatMoney(folio.gain, { sign: true })}
          tone={folio.gain >= 0 ? 'positive' : 'negative'}
          foot={formatPercent(folio.gainPct, 1, true)}
        />
        <StatCard
          label="Meilleure performance"
          value={best?.name ?? '—'}
          foot={best ? formatPercent(best.gainPct, 1, true) : undefined}
          tone={best && best.gainPct >= 0 ? 'positive' : 'neutral'}
        />
      </div>

      <div className="grid split-even">
        <Card>
          <CardHeader title="Allocation par type d'actif" subtitle="Part de chaque famille dans le portefeuille" />
          <div className="card-body tight">
            {folio.byType.length === 0 ? (
              <EmptyState title="Aucun investissement" />
            ) : (
              <HorizontalBars
                total={folio.value}
                items={folio.byType.map((item, index) => ({
                  id: item.type,
                  label: item.label,
                  value: item.value,
                  color: theme.slot(index + 1),
                }))}
              />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Montant investi et valeur actuelle" subtitle="Ligne par ligne" />
          <div className="card-body tight" style={{ paddingBottom: 0 }}>
            {folio.lines.length === 0 ? (
              <EmptyState title="Aucun investissement" />
            ) : (
              <ComparisonBars
                theme={theme}
                names={['Investi', 'Valeur actuelle']}
                data={folio.lines.map((line) => ({ label: line.name, a: line.invested, b: line.value }))}
              />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Mes investissements"
          subtitle="Mettez à jour le prix actuel pour suivre la performance"
          action={(
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setForm('new')}>
              <IconPlus size={14} /> Ajouter un investissement
            </button>
          )}
        />
        <div className="card-body flush" style={{ marginTop: 14 }}>
          {folio.lines.length === 0 ? (
            <EmptyState title="Aucun investissement" hint="Ajoutez une action, un ETF ou un OPCVM pour suivre sa performance." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Support</th>
                    <th>Type</th>
                    <th className="right">Quantité</th>
                    <th className="right">Prix d'achat</th>
                    <th className="right">Prix actuel</th>
                    <th className="right">Investi</th>
                    <th className="right">Valeur</th>
                    <th className="right">+/- value</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {folio.lines.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <strong>{line.name}</strong>
                        {line.ticker ? <span className="muted small"> · {line.ticker}</span> : null}
                        <div className="muted small">
                          {line.account ? `${line.account} · ` : ''}depuis le {formatDate(line.purchaseDate)}
                        </div>
                      </td>
                      <td className="secondary nowrap">{INVESTMENT_TYPE_LABELS[line.type]}</td>
                      <td className="right num">{formatNumber(line.quantity, 4)}</td>
                      <td className="right num nowrap">{formatMoney(line.purchasePrice, { decimals: 2 })}</td>
                      <td className="right num nowrap">{formatMoney(line.currentPrice, { decimals: 2 })}</td>
                      <td className="right num nowrap">{formatMoney(line.invested)}</td>
                      <td className="right num nowrap">{formatMoney(line.value)}</td>
                      <td className="right nowrap">
                        <Money value={line.gain} colored sign />
                        <div className={`small num ${line.gain >= 0 ? 'pos' : 'neg'}`}>
                          {formatPercent(line.gainPct, 1, true)}
                        </div>
                      </td>
                      <td className="actions">
                        <button type="button" className="icon-btn" aria-label="Modifier" onClick={() => setForm(line)}>
                          <IconEdit size={15} />
                        </button>
                        <button type="button" className="icon-btn danger" aria-label="Supprimer" onClick={() => setDeleting(line)}>
                          <IconTrash size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="secondary"><strong>Total</strong></td>
                    <td className="right num nowrap"><strong>{formatMoney(folio.invested)}</strong></td>
                    <td className="right num nowrap"><strong>{formatMoney(folio.value)}</strong></td>
                    <td className="right nowrap"><strong><Money value={folio.gain} colored sign /></strong></td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div className="card-body">
          <Note>
            La valeur du portefeuille est reprise automatiquement dans votre patrimoine net : inutile de la saisir
            une seconde fois dans la page Patrimoine.
          </Note>
        </div>
      </Card>

      {form ? (
        <InvestmentForm
          initial={form === 'new' ? undefined : form}
          onSave={(investment) => upsert('investments', investment)}
          onClose={() => setForm(null)}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Supprimer l'investissement"
          message={`« ${deleting.name} » sera définitivement supprimé du portefeuille.`}
          onConfirm={() => remove('investments', deleting.id)}
          onClose={() => setDeleting(null)}
        />
      ) : null}
    </div>
  )
}

function InvestmentForm({ initial, onSave, onClose }: {
  initial?: Investment
  onSave: (investment: Investment) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [ticker, setTicker] = useState(initial?.ticker ?? '')
  const [type, setType] = useState<InvestmentType>(initial?.type ?? 'action')
  const [quantity, setQuantity] = useState(initial ? String(initial.quantity) : '')
  const [purchasePrice, setPurchasePrice] = useState(initial ? String(initial.purchasePrice) : '')
  const [currentPrice, setCurrentPrice] = useState(initial ? String(initial.currentPrice) : '')
  const [purchaseDate, setPurchaseDate] = useState(initial?.purchaseDate ?? today())
  const [account, setAccount] = useState(initial?.account ?? '')
  const [error, setError] = useState('')

  const submit = () => {
    const q = parseAmount(quantity)
    const buy = parseAmount(purchasePrice)
    const now = parseAmount(currentPrice)
    if (!name.trim()) return setError('Le nom du support est obligatoire.')
    if (!Number.isFinite(q) || q <= 0) return setError('La quantité doit être supérieure à 0.')
    if (!Number.isFinite(buy) || buy <= 0) return setError('Le prix d\'achat doit être supérieur à 0.')
    if (!Number.isFinite(now) || now < 0) return setError('Le prix actuel est invalide.')

    onSave({
      id: initial?.id ?? createId('inv'),
      name: name.trim(),
      ticker: ticker.trim() || undefined,
      type,
      quantity: q,
      purchasePrice: buy,
      currentPrice: now,
      purchaseDate,
      account: account.trim() || undefined,
    })
    onClose()
  }

  return (
    <FormModal title={initial ? 'Modifier l\'investissement' : 'Ajouter un investissement'} onClose={onClose} onSubmit={submit}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="inv-name">Nom du support</label>
          <input id="inv-name" className="input" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="inv-ticker">Code / ticker</label>
          <input id="inv-ticker" className="input" value={ticker} placeholder="Facultatif"
            onChange={(event) => setTicker(event.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="inv-type">Type</label>
          <select id="inv-type" className="select" value={type} onChange={(event) => setType(event.target.value as InvestmentType)}>
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>{INVESTMENT_TYPE_LABELS[option]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="inv-quantity">Quantité</label>
          <input id="inv-quantity" className="input" inputMode="decimal" value={quantity}
            onChange={(event) => setQuantity(event.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="inv-buy">Prix d'achat unitaire (MAD)</label>
          <input id="inv-buy" className="input" inputMode="decimal" value={purchasePrice}
            onChange={(event) => setPurchasePrice(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="inv-now">Prix actuel unitaire (MAD)</label>
          <input id="inv-now" className="input" inputMode="decimal" value={currentPrice}
            onChange={(event) => setCurrentPrice(event.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="field">
          <label htmlFor="inv-date">Date d'achat</label>
          <input id="inv-date" type="date" className="input" value={purchaseDate}
            onChange={(event) => setPurchaseDate(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="inv-account">Compte</label>
          <input id="inv-account" className="input" value={account} placeholder="Facultatif"
            onChange={(event) => setAccount(event.target.value)} />
        </div>
      </div>
      {error ? <p className="small" style={{ color: 'var(--critical)' }} role="alert">{error}</p> : null}
    </FormModal>
  )
}

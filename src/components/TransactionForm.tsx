import { useState } from 'react'
import type { Category, CategoryKind, Transaction } from '../types'
import { createId } from '../lib/id'
import { parseAmount } from '../lib/format'
import { today } from '../lib/date'
import { FormModal } from './ui/Modal'

/** Création / modification d'un revenu ou d'une dépense. */
export function TransactionForm({ kind, categories, initial, onSave, onClose }: {
  kind: CategoryKind
  categories: Category[]
  initial?: Transaction
  onSave: (transaction: Transaction) => void
  onClose: () => void
}) {
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.date ?? today())
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? categories[0]?.id ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [nature, setNature] = useState(initial?.nature ?? categories.find((c) => c.id === categoryId)?.nature ?? 'variable')
  const [error, setError] = useState('')

  const handleCategoryChange = (id: string) => {
    setCategoryId(id)
    const category = categories.find((c) => c.id === id)
    if (kind === 'expense' && category?.nature) setNature(category.nature)
  }

  const submit = () => {
    const value = parseAmount(amount)
    if (!Number.isFinite(value) || value <= 0) return setError('Saisissez un montant supérieur à 0.')
    if (!date) return setError('La date est obligatoire.')
    if (!categoryId) return setError('Choisissez une catégorie.')

    onSave({
      id: initial?.id ?? createId('tx'),
      kind,
      amount: Math.round(value * 100) / 100,
      date,
      categoryId,
      description: description.trim() || categories.find((c) => c.id === categoryId)?.name || '',
      nature: kind === 'expense' ? nature : undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    })
    onClose()
  }

  const title = `${initial ? 'Modifier' : 'Ajouter'} ${kind === 'income' ? 'un revenu' : 'une dépense'}`

  return (
    <FormModal title={title} onClose={onClose} onSubmit={submit}>
      <div className="form-row">
        <div className="field">
          <label htmlFor="tx-amount">Montant (MAD)</label>
          <input
            id="tx-amount" className="input" inputMode="decimal" placeholder="0"
            value={amount} onChange={(event) => setAmount(event.target.value)} autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="tx-date">Date</label>
          <input id="tx-date" type="date" className="input" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="tx-category">Catégorie</label>
        <select id="tx-category" className="select" value={categoryId} onChange={(event) => handleCategoryChange(event.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      {kind === 'expense' ? (
        <div className="field">
          <label htmlFor="tx-nature">Nature de la dépense</label>
          <select id="tx-nature" className="select" value={nature} onChange={(event) => setNature(event.target.value as 'fixed' | 'variable')}>
            <option value="fixed">Fixe (récurrente, prévisible)</option>
            <option value="variable">Variable</option>
          </select>
        </div>
      ) : null}

      <div className="field">
        <label htmlFor="tx-description">Description</label>
        <input
          id="tx-description" className="input" placeholder="Facultatif"
          value={description} onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      {error ? <p className="error" role="alert" style={{ color: 'var(--critical)' }}>{error}</p> : null}
    </FormModal>
  )
}

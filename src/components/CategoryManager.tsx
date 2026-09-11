import { useState } from 'react'
import type { Category, CategoryKind } from '../types'
import { useStore } from '../store/store'
import { createId } from '../lib/id'
import { useAppTheme } from '../lib/theme'
import { Modal } from './ui/Modal'
import { IconCheck, IconEdit, IconPlus, IconTrash } from './ui/Icons'
import { Badge, EmptyState } from './ui/primitives'

/** Gestion des catégories personnalisables (nom, nature, couleur). */
export function CategoryManager({ kind, onClose }: { kind: CategoryKind; onClose: () => void }) {
  const { state, upsert, remove } = useStore()
  const { theme } = useAppTheme()
  const [editing, setEditing] = useState<Category | null>(null)
  const [name, setName] = useState('')
  const [nature, setNature] = useState<'fixed' | 'variable'>('variable')
  const [colorSlot, setColorSlot] = useState(1)
  const [error, setError] = useState('')

  const categories = state.categories.filter((category) => category.kind === kind)
  const usage = (categoryId: string) => state.transactions.filter((t) => t.categoryId === categoryId).length

  const reset = () => {
    setEditing(null); setName(''); setNature('variable'); setColorSlot(1); setError('')
  }

  const startEdit = (category: Category) => {
    setEditing(category)
    setName(category.name)
    setNature(category.nature ?? 'variable')
    setColorSlot(category.colorSlot)
    setError('')
  }

  const save = () => {
    const trimmed = name.trim()
    if (!trimmed) return setError('Le nom est obligatoire.')
    const duplicate = categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.id !== editing?.id)
    if (duplicate) return setError('Une catégorie porte déjà ce nom.')
    upsert('categories', {
      id: editing?.id ?? createId('cat'),
      name: trimmed,
      kind,
      nature: kind === 'expense' ? nature : undefined,
      colorSlot,
    })
    reset()
  }

  const handleDelete = (category: Category) => {
    const count = usage(category.id)
    if (count > 0) {
      setError(`« ${category.name} » est utilisée par ${count} opération(s). Réaffectez-les avant de la supprimer.`)
      return
    }
    remove('categories', category.id)
  }

  return (
    <Modal title={`Catégories — ${kind === 'income' ? 'revenus' : 'dépenses'}`} onClose={onClose}>
      <div className="modal-body">
        <div className="card" style={{ boxShadow: 'none' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label htmlFor="cat-name">{editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</label>
              <input id="cat-name" className="input" value={name} placeholder="Nom de la catégorie"
                onChange={(event) => setName(event.target.value)} />
            </div>
            {kind === 'expense' ? (
              <div className="field">
                <label htmlFor="cat-nature">Nature par défaut</label>
                <select id="cat-nature" className="select" value={nature}
                  onChange={(event) => setNature(event.target.value as 'fixed' | 'variable')}>
                  <option value="fixed">Fixe</option>
                  <option value="variable">Variable</option>
                </select>
              </div>
            ) : null}
            <div className="field">
              <label>Couleur</label>
              <div className="row" style={{ gap: 6 }}>
                {theme.series.map((color, index) => (
                  <button
                    key={color} type="button" aria-label={`Couleur ${index + 1}`}
                    onClick={() => setColorSlot(index + 1)}
                    className="icon-btn"
                    style={{
                      background: color, width: 26, height: 26, borderRadius: 7,
                      border: colorSlot === index + 1 ? '2px solid var(--text-primary)' : '1px solid var(--border)',
                      color: '#fff',
                    }}
                  >
                    {colorSlot === index + 1 ? <IconCheck size={14} /> : null}
                  </button>
                ))}
              </div>
            </div>
            {error ? <p className="small" style={{ color: 'var(--critical)' }} role="alert">{error}</p> : null}
            <div className="row end">
              {editing ? <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Annuler</button> : null}
              <button type="button" className="btn btn-primary btn-sm" onClick={save}>
                <IconPlus size={14} /> {editing ? 'Mettre à jour' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>

        {categories.length === 0 ? (
          <EmptyState title="Aucune catégorie" hint="Créez votre première catégorie ci-dessus." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <span className="cat">
                        <span className="dot" style={{ background: theme.slot(category.colorSlot) }} />
                        {category.name}
                      </span>
                    </td>
                    <td>
                      {category.nature ? (
                        <Badge>{category.nature === 'fixed' ? 'Fixe' : 'Variable'}</Badge>
                      ) : null}
                    </td>
                    <td className="right muted small nowrap">{usage(category.id)} op.</td>
                    <td className="actions">
                      <button type="button" className="icon-btn" aria-label="Modifier" onClick={() => startEdit(category)}>
                        <IconEdit size={15} />
                      </button>
                      <button type="button" className="icon-btn danger" aria-label="Supprimer" onClick={() => handleDelete(category)}>
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
      <div className="modal-foot">
        <button type="button" className="btn" onClick={onClose}>Fermer</button>
      </div>
    </Modal>
  )
}

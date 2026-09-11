import type { Category } from '../types'
import { PERIOD_OPTIONS, resolvePeriod, type Period, type TransactionFilters } from '../lib/filters'
import { addMonths, currentMonth, formatMonth } from '../lib/date'
import { IconChevronLeft, IconChevronRight, IconSearch } from './ui/Icons'

/** Barre de filtres partagée par les pages Revenus et Dépenses. */
export function FilterBar({ filters, onChange, categories, showNature = false }: {
  filters: TransactionFilters
  onChange: (filters: TransactionFilters) => void
  categories: Category[]
  showNature?: boolean
}) {
  const setPeriod = (period: Period) => onChange({ ...filters, period })

  return (
    <div className="toolbar">
      <div className="field search-wrap">
        <label htmlFor="filter-search">Recherche</label>
        <IconSearch size={15} />
        <input
          id="filter-search"
          className="input input-search"
          style={{ paddingLeft: 30 }}
          placeholder="Description…"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
      </div>

      <div className="field">
        <label htmlFor="filter-period">Période</label>
        <select
          id="filter-period"
          className="select"
          value={filters.period.preset}
          onChange={(event) => setPeriod(resolvePeriod(event.target.value as Period['preset'], filters.period))}
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {filters.period.preset === 'custom' ? (
        <>
          <div className="field">
            <label htmlFor="filter-from">Du</label>
            <input
              id="filter-from" type="date" className="input" value={filters.period.from}
              onChange={(event) => setPeriod({ ...filters.period, from: event.target.value })}
            />
          </div>
          <div className="field">
            <label htmlFor="filter-to">Au</label>
            <input
              id="filter-to" type="date" className="input" value={filters.period.to}
              onChange={(event) => setPeriod({ ...filters.period, to: event.target.value })}
            />
          </div>
        </>
      ) : null}

      <div className="field">
        <label htmlFor="filter-category">Catégorie</label>
        <select
          id="filter-category"
          className="select"
          value={filters.categoryId}
          onChange={(event) => onChange({ ...filters, categoryId: event.target.value })}
        >
          <option value="all">Toutes</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      {showNature ? (
        <div className="field">
          <label htmlFor="filter-nature">Type</label>
          <select
            id="filter-nature"
            className="select"
            value={filters.nature}
            onChange={(event) => onChange({ ...filters, nature: event.target.value as TransactionFilters['nature'] })}
          >
            <option value="all">Fixes et variables</option>
            <option value="fixed">Dépenses fixes</option>
            <option value="variable">Dépenses variables</option>
          </select>
        </div>
      ) : null}
    </div>
  )
}

/** Sélecteur de mois (budget, tableau de bord). */
export function MonthPicker({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const isCurrent = month === currentMonth()
  return (
    <div className="row" style={{ gap: 6 }}>
      <button type="button" className="icon-btn" aria-label="Mois précédent" onClick={() => onChange(addMonths(month, -1))}>
        <IconChevronLeft size={17} />
      </button>
      <strong style={{ minWidth: 130, textAlign: 'center', fontSize: 13.5 }}>{formatMonth(month)}</strong>
      <button
        type="button" className="icon-btn" aria-label="Mois suivant"
        onClick={() => onChange(addMonths(month, 1))}
        disabled={isCurrent}
        style={isCurrent ? { opacity: 0.35, cursor: 'not-allowed' } : undefined}
      >
        <IconChevronRight size={17} />
      </button>
      {!isCurrent ? (
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => onChange(currentMonth())}>
          Revenir au mois en cours
        </button>
      ) : null}
    </div>
  )
}

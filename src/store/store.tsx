import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import type { ReactNode } from 'react'
import type {
  AppState, Asset, Budget, Category, Debt, Investment, NetWorthSnapshot,
  SavingsEntry, SavingsGoal, Settings, Transaction,
} from '../types'
import { loadState, saveState } from './persistence'

/** Collections modifiables, indexées par leur clé dans `AppState`. */
export interface Collections {
  categories: Category
  transactions: Transaction
  budgets: Budget
  savingsGoals: SavingsGoal
  savingsEntries: SavingsEntry
  investments: Investment
  assets: Asset
  debts: Debt
  snapshots: NetWorthSnapshot
}
export type CollectionKey = keyof Collections

type UpsertAction = {
  [K in CollectionKey]: { type: 'upsert'; collection: K; item: Collections[K] }
}[CollectionKey]

export type Action =
  | UpsertAction
  | { type: 'remove'; collection: CollectionKey; id: string }
  | { type: 'settings/update'; patch: Partial<Settings> }
  | { type: 'state/replace'; state: AppState }

function sortCollection(collection: CollectionKey, items: unknown[]): unknown[] {
  switch (collection) {
    case 'transactions':
    case 'savingsEntries':
      return [...(items as Array<{ date: string }>)].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    case 'snapshots':
      return [...(items as Array<{ month: string }>)].sort((a, b) => (a.month < b.month ? -1 : 1))
    default:
      return items
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'upsert': {
      const list = state[action.collection] as Array<{ id: string }>
      const exists = list.some((item) => item.id === action.item.id)
      const next = exists
        ? list.map((item) => (item.id === action.item.id ? action.item : item))
        : [action.item, ...list]
      return { ...state, [action.collection]: sortCollection(action.collection, next) } as AppState
    }
    case 'remove': {
      const list = state[action.collection] as Array<{ id: string }>
      const next = { ...state, [action.collection]: list.filter((item) => item.id !== action.id) } as AppState
      if (action.collection === 'savingsGoals') {
        // Les versements restent, mais redeviennent de l'épargne disponible.
        next.savingsEntries = next.savingsEntries.map((entry) =>
          entry.goalId === action.id ? { ...entry, goalId: null } : entry)
      }
      if (action.collection === 'categories') {
        next.budgets = next.budgets.filter((budget) => budget.categoryId !== action.id)
      }
      return next
    }
    case 'settings/update':
      return { ...state, settings: { ...state.settings, ...action.patch } }
    case 'state/replace':
      return action.state
    default:
      return state
  }
}

interface StoreValue {
  state: AppState
  dispatch: (action: Action) => void
  upsert: <K extends CollectionKey>(collection: K, item: Collections[K]) => void
  remove: (collection: CollectionKey, id: string) => void
  updateSettings: (patch: Partial<Settings>) => void
  replaceState: (state: AppState) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  // Persistance : une écriture différée suffit et évite de bloquer la frappe.
  useEffect(() => {
    const timer = window.setTimeout(() => saveState(state), 150)
    return () => window.clearTimeout(timer)
  }, [state])

  const upsert = useCallback(
    <K extends CollectionKey>(collection: K, item: Collections[K]) =>
      dispatch({ type: 'upsert', collection, item } as Action),
    [],
  )
  const remove = useCallback(
    (collection: CollectionKey, id: string) => dispatch({ type: 'remove', collection, id }),
    [],
  )
  const updateSettings = useCallback((patch: Partial<Settings>) => dispatch({ type: 'settings/update', patch }), [])
  const replaceState = useCallback((next: AppState) => dispatch({ type: 'state/replace', state: next }), [])

  const value = useMemo(
    () => ({ state, dispatch, upsert, remove, updateSettings, replaceState }),
    [state, upsert, remove, updateSettings, replaceState],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const value = useContext(StoreContext)
  if (!value) throw new Error('useStore doit être utilisé à l\'intérieur de <StoreProvider>')
  return value
}

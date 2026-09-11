/**
 * Modèle de données de FinTracker.
 *
 * Tout l'état applicatif tient dans `AppState`, qui est sérialisé tel quel dans
 * le stockage persistant. Le champ `version` permet de faire évoluer le schéma
 * (voir `store/persistence.ts`) sans casser les données existantes.
 */

/** Date au format ISO court : `YYYY-MM-DD`. */
export type ISODate = string
/** Mois au format `YYYY-MM`. */
export type Month = string
export type ID = string

export type CategoryKind = 'income' | 'expense'
/** Une dépense est soit fixe (loyer, abonnement) soit variable (courses, loisirs). */
export type ExpenseNature = 'fixed' | 'variable'

export interface Category {
  id: ID
  name: string
  kind: CategoryKind
  /** Uniquement pour les catégories de dépenses. */
  nature?: ExpenseNature
  /** Index 1-8 dans la palette catégorielle. */
  colorSlot: number
  archived?: boolean
}

export interface Transaction {
  id: ID
  kind: CategoryKind
  /** Montant positif en MAD. */
  amount: number
  date: ISODate
  categoryId: ID
  description: string
  /** Recopié de la catégorie à la création, modifiable par transaction. */
  nature?: ExpenseNature
  createdAt: string
}

export interface Budget {
  id: ID
  month: Month
  categoryId: ID
  amount: number
}

export interface SavingsGoal {
  id: ID
  name: string
  targetAmount: number
  targetDate?: ISODate
  colorSlot: number
}

export interface SavingsEntry {
  id: ID
  date: ISODate
  /** Positif = versement, négatif = retrait. */
  amount: number
  /** `null` = épargne disponible (non affectée à un objectif). */
  goalId: ID | null
  note: string
}

export type InvestmentType = 'action' | 'etf' | 'opcvm' | 'obligation' | 'crypto' | 'autre'

export interface Investment {
  id: ID
  name: string
  ticker?: string
  type: InvestmentType
  quantity: number
  /** Prix unitaire d'achat (MAD). */
  purchasePrice: number
  /** Dernier prix unitaire connu (MAD), saisi manuellement. */
  currentPrice: number
  purchaseDate: ISODate
  account?: string
}

export type AssetType = 'cash' | 'bank' | 'savings' | 'vehicle' | 'realestate' | 'other'

export interface Asset {
  id: ID
  name: string
  type: AssetType
  value: number
  note?: string
  updatedAt: ISODate
}

export type DebtType = 'mortgage' | 'loan' | 'credit' | 'other'

export interface Debt {
  id: ID
  name: string
  type: DebtType
  /** Capital restant dû (MAD). */
  balance: number
  /** Taux annuel en %, optionnel. */
  rate?: number
  monthlyPayment?: number
  note?: string
}

/** Photographie du patrimoine à la fin d'un mois donné. */
export interface NetWorthSnapshot {
  id: ID
  month: Month
  assets: number
  debts: number
  note?: string
}

export interface Settings {
  currency: string
  locale: string
  /** Objectif de taux d'épargne en % (utilisé par le tableau de bord). */
  savingsRateTarget: number
  theme: 'light' | 'dark' | 'system'
}

export interface AppState {
  version: number
  categories: Category[]
  transactions: Transaction[]
  budgets: Budget[]
  savingsGoals: SavingsGoal[]
  savingsEntries: SavingsEntry[]
  investments: Investment[]
  assets: Asset[]
  debts: Debt[]
  snapshots: NetWorthSnapshot[]
  settings: Settings
}

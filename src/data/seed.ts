/**
 * Jeu de données fictif mais cohérent, généré relativement au mois courant :
 * 13 mois d'historique (12 mois complets + le mois en cours) afin que
 * l'application soit immédiatement utilisable et testable.
 */
import type {
  AppState, Asset, Budget, Category, Debt, Investment, NetWorthSnapshot,
  SavingsEntry, SavingsGoal, Transaction,
} from '../types'
import { addMonths, currentMonth, daysInMonth, today } from '../lib/date'

export const SCHEMA_VERSION = 1

/** Générateur pseudo-aléatoire déterministe (LCG) : le jeu de test est reproductible. */
function makeRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const rand = makeRandom(20260911)
const pick = <T,>(items: T[]): T => items[Math.floor(rand() * items.length)]
const between = (min: number, max: number) => min + rand() * (max - min)
const amount = (min: number, max: number, step = 10) => Math.round(between(min, max) / step) * step

const incomeCategories: Category[] = [
  { id: 'cat_salaire', name: 'Salaire', kind: 'income', colorSlot: 1 },
  { id: 'cat_freelance', name: 'Freelance', kind: 'income', colorSlot: 3 },
  { id: 'cat_primes', name: 'Primes & bonus', kind: 'income', colorSlot: 4 },
  { id: 'cat_rev_divers', name: 'Revenus divers', kind: 'income', colorSlot: 7 },
]

const expenseCategories: Category[] = [
  { id: 'cat_logement', name: 'Logement', kind: 'expense', nature: 'fixed', colorSlot: 1 },
  { id: 'cat_alimentation', name: 'Alimentation', kind: 'expense', nature: 'variable', colorSlot: 3 },
  { id: 'cat_transport', name: 'Transport', kind: 'expense', nature: 'variable', colorSlot: 2 },
  { id: 'cat_factures', name: 'Factures & abonnements', kind: 'expense', nature: 'fixed', colorSlot: 4 },
  { id: 'cat_loisirs', name: 'Loisirs & sorties', kind: 'expense', nature: 'variable', colorSlot: 5 },
  { id: 'cat_sante', name: 'Santé', kind: 'expense', nature: 'variable', colorSlot: 6 },
  { id: 'cat_famille', name: 'Famille & éducation', kind: 'expense', nature: 'fixed', colorSlot: 7 },
  { id: 'cat_shopping', name: 'Shopping', kind: 'expense', nature: 'variable', colorSlot: 8 },
  { id: 'cat_divers', name: 'Divers', kind: 'expense', nature: 'variable', colorSlot: 2 },
]

const labels: Record<string, string[]> = {
  cat_alimentation: ['Courses Marjane', 'Marché de quartier', 'Boulangerie', 'Épicerie du coin', 'Courses Carrefour'],
  cat_transport: ['Carburant', 'Taxi', 'Entretien voiture', 'Péage autoroute', 'Abonnement tramway'],
  cat_loisirs: ['Restaurant', 'Cinéma', 'Café entre amis', 'Salle de sport', 'Sortie week-end'],
  cat_sante: ['Pharmacie', 'Consultation médecin', 'Dentiste', 'Analyses médicales'],
  cat_shopping: ['Vêtements', 'Électronique', 'Chaussures', 'Décoration', 'Librairie'],
  cat_divers: ['Cadeau', 'Frais bancaires', 'Don', 'Imprévu'],
}

/** Dernier jour « utilisable » : le mois en cours s'arrête à aujourd'hui. */
function lastUsableDay(month: string): number {
  return month === currentMonth() ? Number(today().slice(8, 10)) : daysInMonth(month)
}

function day(month: string, d: number): string {
  const max = lastUsableDay(month)
  return `${month}-${`${Math.min(Math.max(d, 1), max)}`.padStart(2, '0')}`
}

let sequence = 0
const nextId = (prefix: string) => `${prefix}_seed${(sequence++).toString(36)}`

function addTx(
  list: Transaction[],
  kind: 'income' | 'expense',
  date: string,
  categoryId: string,
  description: string,
  value: number,
) {
  const category = [...incomeCategories, ...expenseCategories].find((c) => c.id === categoryId)
  list.push({
    id: nextId('tx'),
    kind,
    amount: Math.round(value * 100) / 100,
    date,
    categoryId,
    description,
    nature: kind === 'expense' ? category?.nature ?? 'variable' : undefined,
    createdAt: new Date(`${date}T09:00:00`).toISOString(),
  })
}

function buildTransactions(months: string[], todayISO: string): Transaction[] {
  const list: Transaction[] = []
  months.forEach((month, index) => {
    const monthsAgo = months.length - 1 - index
    const salary = monthsAgo >= 6 ? 18000 : 19500

    addTx(list, 'income', day(month, 27), 'cat_salaire', 'Salaire mensuel net', salary)
    if (rand() > 0.45) {
      addTx(list, 'income', day(month, Math.round(between(8, 22))), 'cat_freelance', 'Mission freelance', amount(2500, 7000, 100))
    }
    if (month.endsWith('-12') || rand() > 0.85) addTx(list, 'income', day(month, 28), 'cat_primes', 'Prime de performance', amount(4000, 12000, 500))
    if (rand() > 0.8) {
      addTx(list, 'income', day(month, Math.round(between(3, 25))), 'cat_rev_divers', 'Revente matériel', amount(400, 1800, 50))
    }

    // Dépenses fixes
    addTx(list, 'expense', day(month, 5), 'cat_logement', 'Loyer', 4800)
    addTx(list, 'expense', day(month, 8), 'cat_factures', 'Électricité & eau', amount(280, 560, 10))
    addTx(list, 'expense', day(month, 9), 'cat_factures', 'Internet & téléphone', 449)
    addTx(list, 'expense', day(month, 10), 'cat_factures', 'Abonnements (streaming, cloud)', 189)
    addTx(list, 'expense', day(month, 6), 'cat_famille', 'Frais de scolarité', 1600)
    addTx(list, 'expense', day(month, 12), 'cat_logement', 'Charges de copropriété', 350)

    // Dépenses variables
    const maxDay = lastUsableDay(month)
    // Mois en cours : on ne génère que la part des dépenses variables déjà écoulée.
    const elapsedRatio = maxDay / daysInMonth(month)
    const variablePlan: Array<[string, number, number, number]> = [
      ['cat_alimentation', 4, 380, 1250],
      ['cat_transport', 3, 150, 900],
      ['cat_loisirs', 3, 120, 850],
      ['cat_shopping', 1, 250, 1900],
      ['cat_sante', 1, 120, 900],
      ['cat_divers', 1, 80, 600],
    ]
    for (const [categoryId, baseCount, min, max] of variablePlan) {
      const count = Math.max(1, Math.round((baseCount + (rand() > 0.6 ? 1 : 0)) * elapsedRatio))
      for (let i = 0; i < count; i++) {
        if (categoryId === 'cat_sante' && rand() > 0.65) continue
        if (categoryId === 'cat_divers' && rand() > 0.7) continue
        addTx(
          list, 'expense',
          day(month, Math.round(between(2, Math.max(2, maxDay)))),
          categoryId,
          pick(labels[categoryId]),
          amount(min, max),
        )
      }
    }
  })
  // Le mois en cours s'arrête à aujourd'hui : pas d'opération dans le futur.
  return list.filter((t) => t.date <= todayISO).sort((a, b) => (a.date < b.date ? 1 : -1))
}

const budgetPlan: Record<string, number> = {
  cat_logement: 5200,
  cat_alimentation: 4200,
  cat_transport: 1800,
  cat_factures: 1100,
  cat_loisirs: 1500,
  cat_sante: 800,
  cat_famille: 1700,
  cat_shopping: 1200,
  cat_divers: 500,
}

function buildBudgets(months: string[]): Budget[] {
  const list: Budget[] = []
  for (const month of months) {
    for (const [categoryId, value] of Object.entries(budgetPlan)) {
      list.push({ id: nextId('bud'), month, categoryId, amount: value })
    }
  }
  return list
}

const savingsGoals: SavingsGoal[] = [
  { id: 'goal_urgence', name: "Fonds d'urgence", targetAmount: 60000, colorSlot: 1 },
  { id: 'goal_vehicule', name: 'Apport véhicule', targetAmount: 120000, targetDate: '2028-06-30', colorSlot: 3 },
  { id: 'goal_voyage', name: 'Voyage', targetAmount: 35000, targetDate: '2027-07-01', colorSlot: 5 },
]

function buildSavings(months: string[], todayISO: string): SavingsEntry[] {
  const list: SavingsEntry[] = []
  for (const month of months) {
    list.push({ id: nextId('sav'), date: day(month, 28), amount: 2000, goalId: 'goal_urgence', note: 'Virement automatique' })
    list.push({ id: nextId('sav'), date: day(month, 28), amount: 1500, goalId: 'goal_vehicule', note: 'Virement automatique' })
    if (rand() > 0.4) list.push({ id: nextId('sav'), date: day(month, 29), amount: amount(500, 1200, 50), goalId: 'goal_voyage', note: 'Épargne voyage' })
    if (rand() > 0.55) list.push({ id: nextId('sav'), date: day(month, 30), amount: amount(600, 2500, 100), goalId: null, note: 'Surplus du mois' })
    if (rand() > 0.9) list.push({ id: nextId('sav'), date: day(month, 18), amount: -amount(800, 2500, 100), goalId: null, note: 'Retrait imprévu' })
  }
  return list.filter((e) => e.date <= todayISO).sort((a, b) => (a.date < b.date ? 1 : -1))
}

const investments: Investment[] = [
  { id: 'inv_atw', name: 'Attijariwafa Bank', ticker: 'ATW', type: 'action', quantity: 40, purchasePrice: 462, currentPrice: 531, purchaseDate: '2024-03-14', account: 'Compte titres' },
  { id: 'inv_iam', name: 'Maroc Telecom', ticker: 'IAM', type: 'action', quantity: 120, purchasePrice: 98.5, currentPrice: 104.2, purchaseDate: '2024-09-02', account: 'Compte titres' },
  { id: 'inv_lbv', name: 'Label Vie', ticker: 'LBV', type: 'action', quantity: 6, purchasePrice: 4820, currentPrice: 4510, purchaseDate: '2025-01-20', account: 'Compte titres' },
  { id: 'inv_opcvm', name: 'OPCVM Attijari Obligations', type: 'opcvm', quantity: 55, purchasePrice: 1120, currentPrice: 1168, purchaseDate: '2024-06-10', account: 'Banque' },
  { id: 'inv_etf', name: 'ETF MSCI World', ticker: 'IWDA', type: 'etf', quantity: 25, purchasePrice: 980, currentPrice: 1145, purchaseDate: '2025-02-05', account: 'Courtier international' },
  { id: 'inv_btc', name: 'Bitcoin', ticker: 'BTC', type: 'crypto', quantity: 0.05, purchasePrice: 620000, currentPrice: 705000, purchaseDate: '2025-05-18', account: 'Plateforme crypto' },
]

const assets: Asset[] = [
  { id: 'ast_courant', name: 'Compte courant', type: 'bank', value: 26400, updatedAt: today(), note: 'Banque principale' },
  { id: 'ast_epargne', name: 'Compte sur carnet', type: 'savings', value: 88500, updatedAt: today() },
  { id: 'ast_cash', name: 'Liquidités', type: 'cash', value: 3200, updatedAt: today() },
  { id: 'ast_voiture', name: 'Voiture', type: 'vehicle', value: 145000, updatedAt: today(), note: 'Valeur de revente estimée' },
  { id: 'ast_appart', name: 'Appartement', type: 'realestate', value: 980000, updatedAt: today() },
]

const debts: Debt[] = [
  { id: 'debt_immo', name: 'Crédit immobilier', type: 'mortgage', balance: 612000, rate: 4.6, monthlyPayment: 5200 },
  { id: 'debt_auto', name: 'Crédit auto', type: 'loan', balance: 46500, rate: 6.1, monthlyPayment: 1850 },
]

function buildSnapshots(months: string[]): NetWorthSnapshot[] {
  // Historique lissé : les actifs progressent, les dettes s'amortissent.
  const list: NetWorthSnapshot[] = []
  const finalAssets = assets.reduce((s, a) => s + a.value, 0)
    + investments.reduce((s, i) => s + i.quantity * i.currentPrice, 0)
  const finalDebts = debts.reduce((s, d) => s + d.balance, 0)
  const count = months.length
  months.forEach((month, index) => {
    const progress = (index + 1) / count
    const assetsValue = Math.round((finalAssets * (0.9 + 0.1 * progress) - 42000 * (1 - progress)) / 100) * 100
    const debtsValue = Math.round((finalDebts + 7200 * (count - index)) / 100) * 100
    list.push({ id: nextId('snap'), month, assets: assetsValue, debts: debtsValue })
  })
  return list
}

/** Construit l'état initial complet de démonstration. */
export function createSeedState(): AppState {
  sequence = 0
  const thisMonth = currentMonth()
  const todayISO = today()
  const history = Array.from({ length: 13 }, (_, i) => addMonths(thisMonth, i - 12))
  const pastMonths = history.slice(0, 12)

  return {
    version: SCHEMA_VERSION,
    categories: [...incomeCategories, ...expenseCategories],
    transactions: buildTransactions(history, todayISO),
    budgets: buildBudgets(history),
    savingsGoals,
    savingsEntries: buildSavings(history, todayISO),
    investments,
    assets,
    debts,
    snapshots: buildSnapshots(pastMonths),
    settings: {
      currency: 'MAD',
      locale: 'fr-MA',
      savingsRateTarget: 20,
      theme: 'system',
    },
  }
}

/** État vide (utilisé par « repartir de zéro »). */
export function createEmptyState(): AppState {
  return {
    version: SCHEMA_VERSION,
    categories: [...incomeCategories, ...expenseCategories],
    transactions: [],
    budgets: [],
    savingsGoals: [],
    savingsEntries: [],
    investments: [],
    assets: [],
    debts: [],
    snapshots: [],
    settings: { currency: 'MAD', locale: 'fr-MA', savingsRateTarget: 20, theme: 'system' },
  }
}

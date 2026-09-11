/**
 * Couche de persistance.
 *
 * Aujourd'hui : `localStorage` (application 100 % locale, aucune donnée envoyée).
 * L'état étant sérialisable et versionné, remplacer cette couche par un appel
 * réseau ne demande de toucher à aucun composant.
 */
import type { AppState } from '../types'
import { SCHEMA_VERSION, createSeedState } from '../data/seed'

const STORAGE_KEY = 'fintracker:state'

/** Point d'entrée des migrations de schéma entre versions. */
function migrate(raw: AppState): AppState {
  let state = raw
  if (state.version < SCHEMA_VERSION) {
    // Aucune migration nécessaire pour l'instant : la v1 est la première version.
    state = { ...state, version: SCHEMA_VERSION }
  }
  return state
}

/** Vérifie que l'objet stocké ressemble bien à un état applicatif. */
function isValidState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false
  const s = value as Partial<AppState>
  const collections: Array<keyof AppState> = [
    'categories', 'transactions', 'budgets', 'savingsGoals', 'savingsEntries',
    'investments', 'assets', 'debts', 'snapshots',
  ]
  return typeof s.version === 'number'
    && !!s.settings
    && collections.every((key) => Array.isArray(s[key]))
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed: unknown = JSON.parse(raw)
    if (!isValidState(parsed)) return createSeedState()
    return migrate(parsed)
  } catch {
    // Stockage indisponible (navigation privée, quota) : on démarre sur la démo.
    return createSeedState()
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Écriture impossible : l'application reste utilisable en mémoire.
  }
}

export function clearStoredState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* rien à faire */
  }
}

/** Import d'un fichier JSON exporté précédemment. */
export function parseImportedState(json: string): AppState {
  const parsed: unknown = JSON.parse(json)
  if (!isValidState(parsed)) throw new Error('Fichier invalide : structure de données non reconnue.')
  return migrate(parsed)
}

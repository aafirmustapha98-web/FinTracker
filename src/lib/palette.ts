/**
 * Palette des graphiques.
 *
 * Les huit teintes catégorielles sont attribuées dans un ordre fixe (jamais
 * recyclé au-delà de 8 : le reste est agrégé dans « Autres »). Chaque mode a ses
 * propres pas, validés séparément contre la surface correspondante.
 */
export type Mode = 'light' | 'dark'

const CATEGORICAL: Record<Mode, string[]> = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
}

export interface ChartTheme {
  mode: Mode
  /** Teintes catégorielles, ordre fixe. */
  series: string[]
  /** Couleur d'une catégorie par son emplacement (1-8). */
  slot: (colorSlot: number) => string
  income: string
  expense: string
  savings: string
  neutral: string
  surface: string
  gridline: string
  axis: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  good: string
  critical: string
}

const CHROME: Record<Mode, Omit<ChartTheme, 'mode' | 'series' | 'slot' | 'income' | 'expense' | 'savings'>> = {
  light: {
    neutral: '#898781',
    surface: '#fcfcfb',
    gridline: '#e1e0d9',
    axis: '#c3c2b7',
    textPrimary: '#0b0b0b',
    textSecondary: '#52514e',
    textMuted: '#898781',
    good: '#006300',
    critical: '#d03b3b',
  },
  dark: {
    neutral: '#898781',
    surface: '#1a1a19',
    gridline: '#2c2c2a',
    axis: '#383835',
    textPrimary: '#ffffff',
    textSecondary: '#c3c2b7',
    textMuted: '#898781',
    good: '#0ca30c',
    critical: '#e66767',
  },
}

export function chartTheme(mode: Mode): ChartTheme {
  const series = CATEGORICAL[mode]
  return {
    mode,
    series,
    slot: (colorSlot: number) => series[(Math.max(1, colorSlot) - 1) % series.length],
    // Revenus / dépenses / épargne sont des identités, pas des statuts :
    // elles prennent les trois premiers emplacements catégoriels.
    income: series[0],
    expense: series[1],
    savings: series[2],
    ...CHROME[mode],
  }
}

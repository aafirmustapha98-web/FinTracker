const LOCALE = 'fr-MA'

/** « 12 450 MAD » — montant arrondi, sans décimales inutiles. */
export function formatMoney(value: number, opts: { decimals?: number; sign?: boolean } = {}): string {
  const decimals = opts.decimals ?? 0
  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value))
  const sign = value < 0 ? '−' : opts.sign ? '+' : ''
  return `${sign}${formatted} MAD`
}

/** Version compacte pour les axes : « 12,4 k », « 1,2 M ». */
export function formatMoneyCompact(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}${round(abs / 1_000_000)} M`
  if (abs >= 1_000) return `${sign}${round(abs / 1_000)} k`
  return `${sign}${new Intl.NumberFormat(LOCALE).format(Math.round(abs))}`
}

function round(v: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 }).format(v)
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1, sign = false): string {
  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.abs(value))
  const prefix = value < 0 ? '−' : sign ? '+' : ''
  return `${prefix}${formatted} %`
}

/** Parse une saisie utilisateur tolérante (« 1 200,50 » → 1200.5). */
export function parseAmount(input: string): number {
  const normalized = input.replace(/\s| | /g, '').replace(',', '.')
  const value = Number(normalized)
  return Number.isFinite(value) ? value : NaN
}

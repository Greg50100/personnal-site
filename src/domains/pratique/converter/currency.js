/**
 * Taux de change de référence de la BCE, via l'API publique Frankfurter (sans clé, CORS ouvert).
 * Les taux sont mis en cache dans le navigateur ; ils ne changent qu'une fois par jour ouvré.
 */
const API = 'https://api.frankfurter.dev/v1/latest?base=EUR'
const KEY = 'currency-rates'
const MAX_AGE = 6 * 3600 * 1000

/** Devises proposées en tête de liste. */
const FIRST = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD']

export function readCachedRates() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY))
    return data?.rates ? data : null
  } catch {
    return null
  }
}

export const isFresh = (data) => Boolean(data && Date.now() - data.fetched < MAX_AGE)

export async function fetchRates() {
  const res = await fetch(API)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const data = { date: json.date, fetched: Date.now(), rates: { EUR: 1, ...json.rates } }
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    // stockage indisponible : les taux restent en mémoire
  }
  return data
}

let names
const currencyName = (code) => {
  try {
    names ??= new Intl.DisplayNames(['fr'], { type: 'currency' })
    const name = names.of(code)
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return code
  }
}

const rank = (code) => (FIRST.includes(code) ? FIRST.indexOf(code) : FIRST.length)

/** Grandeur « Devises » construite à partir des taux (unité de base : l'euro). */
export function currencyQuantity(data) {
  const codes = Object.keys(data?.rates ?? {}).sort((a, b) => rank(a) - rank(b) || currencyName(a).localeCompare(currencyName(b), 'fr'))
  return {
    ...CURRENCY,
    units: codes.map((code) => ({ id: code, label: currencyName(code), symbol: code, factor: 1 / data.rates[code] })),
  }
}

export const CURRENCY = { id: 'devises', family: 'Vie courante', label: 'Devises', defaults: ['EUR', 'USD'], units: [], online: true }

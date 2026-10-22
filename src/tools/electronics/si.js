/** Lecture et écriture de valeurs avec préfixes SI (4k7, 2.2M, 470n, 20m…). */

const PREFIXES = [
  { p: 'G', f: 1e9 },
  { p: 'M', f: 1e6 },
  { p: 'k', f: 1e3 },
  { p: '', f: 1 },
  { p: 'm', f: 1e-3 },
  { p: 'µ', f: 1e-6 },
  { p: 'n', f: 1e-9 },
  { p: 'p', f: 1e-12 },
]

const FACTOR = { G: 1e9, M: 1e6, k: 1e3, K: 1e3, R: 1, m: 1e-3, u: 1e-6, µ: 1e-6, μ: 1e-6, n: 1e-9, p: 1e-12 }

/**
 * Accepte « 4.7k », « 4k7 », « 4,7 kΩ », « 470R », « 2M2 », « 20mA »… (l'unité finale est ignorée).
 * Renvoie NaN si la saisie est invalide.
 */
export function parseSI(input) {
  let s = String(input).trim().replace(/\s/g, '').replace(',', '.').replace(/(Ω|ohms?|V|A|W)$/i, '')
  if (!s) return NaN
  // notation « 4k7 » : le préfixe sert de virgule
  const infix = /^(\d+)([GMkKRmuµμnp])(\d+)$/.exec(s)
  if (infix) return Number(`${infix[1]}.${infix[3]}`) * FACTOR[infix[2]]
  const m = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)([GMkKRmuµμnp])?$/.exec(s)
  if (!m) return NaN
  return Number(m[1]) * (m[2] ? FACTOR[m[2]] : 1)
}

/** 4700 → « 4,7 k » ; 0.02 → « 20 m ». */
export function formatSI(value, unit = '', digits = 4) {
  if (!Number.isFinite(value)) return '—'
  if (value === 0) return `0 ${unit}`
  const abs = Math.abs(value)
  const pref = PREFIXES.find((x) => abs >= x.f * 0.9995) ?? PREFIXES[PREFIXES.length - 1]
  const scaled = parseFloat((value / pref.f).toPrecision(digits))
  return `${String(scaled).replace('.', ',').replace('-', '−')} ${pref.p}${unit}`
}

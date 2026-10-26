/** Code couleur des résistances (CEI 60062). */
export const COLORS = [
  { id: 'noir', label: 'Noir', hex: '#111111', digit: 0, mult: 1, tcr: 250 },
  { id: 'marron', label: 'Marron', hex: '#7c3f12', digit: 1, mult: 10, tol: 1, tcr: 100 },
  { id: 'rouge', label: 'Rouge', hex: '#dc2626', digit: 2, mult: 100, tol: 2, tcr: 50 },
  { id: 'orange', label: 'Orange', hex: '#f97316', digit: 3, mult: 1e3, tol: 0.05, tcr: 15 },
  { id: 'jaune', label: 'Jaune', hex: '#facc15', digit: 4, mult: 1e4, tol: 0.02, tcr: 25 },
  { id: 'vert', label: 'Vert', hex: '#16a34a', digit: 5, mult: 1e5, tol: 0.5, tcr: 20 },
  { id: 'bleu', label: 'Bleu', hex: '#2563eb', digit: 6, mult: 1e6, tol: 0.25, tcr: 10 },
  { id: 'violet', label: 'Violet', hex: '#7c3aed', digit: 7, mult: 1e7, tol: 0.1, tcr: 5 },
  { id: 'gris', label: 'Gris', hex: '#9ca3af', digit: 8, mult: 1e8, tol: 0.05, tcr: 1 },
  { id: 'blanc', label: 'Blanc', hex: '#f8fafc', digit: 9, mult: 1e9 },
  { id: 'or', label: 'Or', hex: '#d4a017', mult: 0.1, tol: 5 },
  { id: 'argent', label: 'Argent', hex: '#c0c0c0', mult: 0.01, tol: 10 },
]

export const COLOR = Object.fromEntries(COLORS.map((c) => [c.id, c]))

/** Rôle de chaque anneau selon le nombre d'anneaux. */
export const LAYOUTS = {
  4: ['digit', 'digit', 'mult', 'tol'],
  5: ['digit', 'digit', 'digit', 'mult', 'tol'],
  6: ['digit', 'digit', 'digit', 'mult', 'tol', 'tcr'],
}

export const ROLE_LABEL = { digit: 'Chiffre', mult: 'Multiplicateur', tol: 'Tolérance', tcr: 'Coef. temp.' }

export const optionsFor = (role) =>
  COLORS.filter((c) => (role === 'digit' ? c.digit !== undefined : role === 'mult' ? c.mult !== undefined : role === 'tol' ? c.tol !== undefined : c.tcr !== undefined))

export function decode(bands) {
  const layout = LAYOUTS[bands.length]
  let digits = 0
  let mult = 1
  let tol = 20
  let tcr = null
  bands.forEach((id, i) => {
    const c = COLOR[id]
    if (layout[i] === 'digit') digits = digits * 10 + c.digit
    else if (layout[i] === 'mult') mult = c.mult
    else if (layout[i] === 'tol') tol = c.tol
    else tcr = c.tcr
  })
  return { ohms: parseFloat((digits * mult).toPrecision(12)), tolerance: tol, tcr }
}

/** Valeur (Ω) → couleurs des chiffres et du multiplicateur (null si non représentable). */
export function encode(ohms, digitCount) {
  if (!(ohms > 0)) return null
  const exp = Math.floor(Math.log10(ohms)) - (digitCount - 1)
  const mantissa = Math.round(ohms / 10 ** exp)
  let e = exp
  let m = mantissa
  if (m >= 10 ** digitCount) {
    m /= 10
    e += 1
  }
  const multColor = COLORS.find((c) => c.mult !== undefined && Math.abs(Math.log10(c.mult) - e) < 1e-9)
  if (!multColor) return null
  const digits = String(m).padStart(digitCount, '0').split('').map((d) => COLORS.find((c) => c.digit === Number(d)).id)
  return { digits, mult: multColor.id, exact: Math.abs(m * 10 ** e - ohms) / ohms < 1e-9 }
}

export { nearestInSeries, seriesOf as eSeriesOf } from '../eseries'

/** Fonctions de formatage partagées (nombres, angles, dates) — conventions françaises. */

const nf = (options) => new Intl.NumberFormat('fr-FR', options)

/** Nombre à virgule fixe : fmt(3.14159, 2) → « 3,14 ». */
export function fmt(value, digits = 2) {
  if (!Number.isFinite(value)) return '—'
  return nf({ minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
}

/**
 * Nombre « intelligent » pour afficher un résultat de calcul : jusqu'à `precision` chiffres significatifs,
 * notation scientifique pour les valeurs très grandes ou très petites.
 */
export function smartNumber(value, precision = 10) {
  if (value === 0) return '0'
  if (!Number.isFinite(value)) return Number.isNaN(value) ? '—' : value > 0 ? '∞' : '−∞'
  const abs = Math.abs(value)
  if (abs >= 1e15 || abs < 1e-6) {
    const [mantissa, exponent] = value.toExponential(precision - 1).split('e')
    const m = parseFloat(mantissa).toString().replace('.', ',').replace('-', '−')
    return `${m} × 10${superscript(Number(exponent))}`
  }
  const rounded = parseFloat(value.toPrecision(precision))
  return nf({ maximumFractionDigits: 12 }).format(rounded).replace('-', '−')
}

const SUPERSCRIPT = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' }

/** Exposant en caractères Unicode : -12 → « ⁻¹² ». */
export const superscript = (n) => [...String(n)].map((c) => SUPERSCRIPT[c] ?? c).join('')

/** Lit un nombre saisi par l'utilisateur (accepte la virgule, les espaces et la notation 1e3). */
export function parseNumber(input) {
  if (typeof input === 'number') return input
  if (input == null) return NaN
  const cleaned = String(input).trim().replace(/[\s\u00a0\u202f]/g, '').replace(',', '.').replace('−', '-')
  if (cleaned === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(cleaned)) return NaN
  return Number(cleaned)
}

const pad = (n, size = 2) => String(n).padStart(size, '0')

/** Angle en degrés → « ±DD° MM′ SS″ ». */
export function fmtDMS(deg, { secondsDigits = 0, sign = true } = {}) {
  if (!Number.isFinite(deg)) return '—'
  const s = deg < 0 ? '−' : sign ? '+' : ''
  let total = Math.abs(deg) * 3600
  const factor = 10 ** secondsDigits
  total = Math.round(total * factor) / factor
  const d = Math.floor(total / 3600)
  const m = Math.floor((total - d * 3600) / 60)
  const sec = total - d * 3600 - m * 60
  const secStr = secondsDigits ? sec.toFixed(secondsDigits).padStart(3 + secondsDigits, '0') : pad(Math.round(sec))
  return `${s}${pad(d)}° ${pad(m)}′ ${secStr.replace('.', ',')}″`
}

/** Angle en degrés → « ±DD° MM,mm′ ». */
export function fmtDM(deg) {
  if (!Number.isFinite(deg)) return '—'
  const s = deg < 0 ? '−' : '+'
  const abs = Math.abs(deg)
  let d = Math.floor(abs)
  let m = (abs - d) * 60
  if (m >= 59.995) {
    d += 1
    m = 0
  }
  return `${s}${pad(d)}° ${m.toFixed(2).padStart(5, '0').replace('.', ',')}′`
}

/** Ascension droite en heures → « HHh MMm SSs ». */
export function fmtHMS(hours, secondsDigits = 0) {
  if (!Number.isFinite(hours)) return '—'
  let total = (((hours % 24) + 24) % 24) * 3600
  const factor = 10 ** secondsDigits
  total = Math.round(total * factor) / factor
  if (total >= 86400) total -= 86400
  const h = Math.floor(total / 3600)
  const m = Math.floor((total - h * 3600) / 60)
  const s = total - h * 3600 - m * 60
  const secStr = secondsDigits ? s.toFixed(secondsDigits).padStart(3 + secondsDigits, '0') : pad(Math.round(s))
  return `${pad(h)}h ${pad(m)}m ${secStr.replace('.', ',')}s`
}

/** Angle formaté selon le mode choisi : 'dms' | 'dm' | 'decimal'. */
export function fmtAngle(deg, mode = 'dms') {
  if (mode === 'decimal') return `${fmt(deg, 4)}°`
  if (mode === 'dm') return fmtDM(deg)
  return fmtDMS(deg)
}

const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO']

/** Azimut (degrés depuis le nord, vers l'est) → point cardinal français. */
export function compass(az) {
  if (!Number.isFinite(az)) return '—'
  return COMPASS[Math.round((((az % 360) + 360) % 360) / 22.5) % 16]
}

/** Latitude / longitude lisibles : « 49,634° N », « 1,622° O ». */
export const fmtLat = (lat, digits = 3) => `${fmt(Math.abs(lat), digits)}° ${lat >= 0 ? 'N' : 'S'}`
export const fmtLon = (lon, digits = 3) => `${fmt(Math.abs(lon), digits)}° ${lon >= 0 ? 'E' : 'O'}`

const timeFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const timeSecFmt = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
const dateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const shortDateFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const asDate = (d) => (d && d.date instanceof Date ? d.date : d)
const valid = (d) => d instanceof Date && !Number.isNaN(d.getTime())

export const fmtTime = (d, seconds = false) => {
  const date = asDate(d)
  if (!valid(date)) return '—'
  return (seconds ? timeSecFmt : timeFmt).format(date)
}
export const fmtDate = (d) => (valid(asDate(d)) ? dateFmt.format(asDate(d)) : '—')
export const fmtShortDate = (d) => (valid(asDate(d)) ? shortDateFmt.format(asDate(d)) : '—')

/** Durée en heures décimales → « 9 h 42 min ». */
export function fmtDuration(hours) {
  if (!Number.isFinite(hours)) return '—'
  const totalMin = Math.round(hours * 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h} h ${pad(m)} min` : `${m} min`
}

/** Valeur pour un <input type="datetime-local"> (heure locale). */
export function toDateTimeLocal(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Valeur pour un <input type="date"> (heure locale). */
export function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Décalage horaire du navigateur à une date donnée : « UTC+2 ». */
export function utcOffsetLabel(date = new Date()) {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '−'
  const h = Math.floor(Math.abs(offset) / 60)
  const m = Math.abs(offset) % 60
  return `UTC${sign}${h}${m ? `:${pad(m)}` : ''}`
}

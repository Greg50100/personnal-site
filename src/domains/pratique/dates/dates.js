/** Fonctions de calendrier (dates manipulées en UTC pour éviter les effets des changements d'heure). */

export const DAY = 86_400_000

export function parseISODate(s) {
  const m = /^(\d{1,4})-(\d{2})-(\d{2})$/.exec(String(s).trim())
  if (!m) return null
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  d.setUTCFullYear(Number(m[1]))
  return Number.isNaN(d.getTime()) ? null : d
}

const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
export const fmtLong = (d) => longFmt.format(d)

/** Écart calendaire en années, mois et jours (de a vers b, a ≤ b) : plus grand nombre de mois entiers, puis jours restants. */
export function ymdDiff(a, b) {
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth())
  while (months > 0 && addYMD(a, { m: months }) > b) months--
  const anchor = addYMD(a, { m: months })
  return { y: Math.floor(months / 12), m: months % 12, d: Math.round((b - anchor) / DAY) }
}

/** Nombre de jours ouvrés (lundi-vendredi) entre deux dates, borne de fin exclue. */
export function businessDays(a, b) {
  let count = 0
  for (let t = a.getTime(); t < b.getTime(); t += DAY) {
    const wd = new Date(t).getUTCDay()
    if (wd !== 0 && wd !== 6) count++
  }
  return count
}

/** Ajoute des années, mois et jours (le jour est ramené au dernier du mois si besoin : 31 janv. + 1 mois = 28/29 févr.). */
export function addYMD(date, { y = 0, m = 0, d = 0 }) {
  const year = date.getUTCFullYear() + y
  const month = date.getUTCMonth() + m
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const res = new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), last)))
  return new Date(res.getTime() + d * DAY)
}

/** Numéro de semaine ISO 8601. */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const wd = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - wd)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return Math.ceil(((d - yearStart) / DAY + 1) / 7)
}

export const dayOfYear = (date) => Math.floor((date - Date.UTC(date.getUTCFullYear(), 0, 1)) / DAY) + 1

/** Date de Pâques grégorienne (algorithme de Meeus/Jones/Butcher). */
export function easter(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(Date.UTC(year, month - 1, day))
}

/** Pâques orthodoxe (comput julien), exprimée dans le calendrier grégorien. */
export function orthodoxEaster(year) {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31)
  const day = ((d + e + 114) % 31) + 1
  const julian = Date.UTC(year, month - 1, day)
  // Écart entre calendriers julien et grégorien pour l'année considérée
  const century = Math.floor(year / 100)
  const shift = century - Math.floor(century / 4) - 2
  return new Date(julian + shift * DAY)
}

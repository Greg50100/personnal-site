/**
 * Échelles de temps et temps sidéral.
 * Références : Meeus, « Astronomical Algorithms » (chap. 7 et 12) ; IERS pour les secondes intercalaires.
 */
import { Astronomy } from './astro'

const DAY_MS = 86_400_000
const JD_UNIX = 2_440_587.5
const J2000 = 2_451_545

export const julianDay = (date) => date.getTime() / DAY_MS + JD_UNIX
export const dateFromJulianDay = (jd) => new Date((jd - JD_UNIX) * DAY_MS)
export const modifiedJulianDay = (date) => julianDay(date) - 2_400_000.5

/** Dates d'entrée en vigueur de TAI − UTC (s), depuis 1972. */
const LEAP_SECONDS = [
  ['1972-01-01', 10], ['1972-07-01', 11], ['1973-01-01', 12], ['1974-01-01', 13], ['1975-01-01', 14],
  ['1976-01-01', 15], ['1977-01-01', 16], ['1978-01-01', 17], ['1979-01-01', 18], ['1980-01-01', 19],
  ['1981-07-01', 20], ['1982-07-01', 21], ['1983-07-01', 22], ['1985-07-01', 23], ['1988-01-01', 24],
  ['1990-01-01', 25], ['1991-01-01', 26], ['1992-07-01', 27], ['1993-07-01', 28], ['1994-07-01', 29],
  ['1996-01-01', 30], ['1997-07-01', 31], ['1999-01-01', 32], ['2006-01-01', 33], ['2009-01-01', 34],
  ['2012-07-01', 35], ['2015-07-01', 36], ['2017-01-01', 37],
].map(([d, s]) => [Date.parse(`${d}T00:00:00Z`), s])

/** TAI − UTC en secondes (null avant 1972, où UTC n'avait pas de secondes intercalaires entières). */
export function taiMinusUtc(date) {
  const t = date.getTime()
  if (t < LEAP_SECONDS[0][0]) return null
  let s = LEAP_SECONDS[0][1]
  for (const [since, value] of LEAP_SECONDS) if (t >= since) s = value
  return s
}

/**
 * ΔT = TT − UT (s). Depuis 1972 : secondes intercalaires + 32,184 s (à moins d'une seconde près) ;
 * avant : modèle d'Espenak et Meeus utilisé par astronomy-engine.
 */
export function deltaT(date) {
  const tai = taiMinusUtc(date)
  if (tai != null) return tai + 32.184
  return Astronomy.DeltaT_EspenakMeeus(julianDay(date) - J2000)
}

const GPS_EPOCH = Date.parse('1980-01-06T00:00:00Z')

/** Temps GPS : semaine et secondes dans la semaine (GPS = TAI − 19 s). */
export function gpsTime(date) {
  const seconds = (date.getTime() - GPS_EPOCH) / 1000 + (taiMinusUtc(date) ?? 19) - 19
  const week = Math.floor(seconds / 604_800)
  return { week, seconds: seconds - week * 604_800, total: seconds }
}

const mod = (x, m) => ((x % m) + m) % m

/** Temps sidéral moyen de Greenwich (heures), formule IAU 1982 (Meeus 12.4). */
export function gmst(date) {
  const jd = julianDay(date)
  const T = (jd - J2000) / 36_525
  const deg = 280.46061837 + 360.98564736629 * (jd - J2000) + 0.000387933 * T * T - (T * T * T) / 38_710_000
  return mod(deg, 360) / 15
}

/** Temps sidéral apparent de Greenwich (heures), avec nutation. */
export const gast = (date) => Astronomy.SiderealTime(date)

/**
 * Temps solaire au lieu de longitude `lon` (degrés, est positif) :
 * temps solaire moyen, temps solaire vrai et équation du temps (minutes, vrai − moyen).
 */
export function solarTime(date, lon) {
  const utHours = (date.getTime() / 3_600_000) % 24
  const mean = mod(utHours + lon / 15, 24)
  const observer = new Astronomy.Observer(0, lon, 0)
  const apparent = mod(Astronomy.HourAngle(Astronomy.Body.Sun, date, observer) + 12, 24)
  let eot = (apparent - mean) * 60
  if (eot > 720) eot -= 1440
  if (eot < -720) eot += 1440
  return { mean, apparent, equationOfTime: eot }
}

/** Date du calendrier julien (proleptique) correspondant à un jour julien (Meeus chap. 7). */
export function julianCalendarDate(jd) {
  const z = Math.floor(jd + 0.5)
  const f = jd + 0.5 - z
  const b = z + 1524
  const c = Math.floor((b - 122.1) / 365.25)
  const d = Math.floor(365.25 * c)
  const e = Math.floor((b - d) / 30.6001)
  const day = b - d - Math.floor(30.6001 * e) + f
  const month = e < 14 ? e - 1 : e - 13
  const year = month > 2 ? c - 4716 : c - 4715
  return { year, month, day: Math.floor(day) }
}

/** Siècles juliens depuis J2000.0 (échelle TT). */
export const centuriesSinceJ2000 = (date) => (julianDay(date) + deltaT(date) / 86_400 - J2000) / 36_525

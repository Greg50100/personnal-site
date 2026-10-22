/**
 * Fonctions astronomiques partagées par les outils (basées sur Astronomy Engine de Don Cross,
 * le successeur moderne du moteur « astronomy.js » utilisé par ses pages Sky View / Solar System).
 */
import * as Astronomy from 'astronomy-engine'
import CONSTELLATIONS from '../data/constellations.json'

export { Astronomy }

export const DAY_MS = 86_400_000
export const SYNODIC_MONTH = 29.530588853

export const BODIES = [
  { id: 'Sun', name: 'Soleil', symbol: '☉', color: '#facc15' },
  { id: 'Moon', name: 'Lune', symbol: '☾', color: '#d4d4d8' },
  { id: 'Mercury', name: 'Mercure', symbol: '☿', color: '#a8a29e', planet: true, inner: true, nakedEye: true },
  { id: 'Venus', name: 'Vénus', symbol: '♀', color: '#fde68a', planet: true, inner: true, nakedEye: true },
  { id: 'Mars', name: 'Mars', symbol: '♂', color: '#f87171', planet: true, nakedEye: true },
  { id: 'Jupiter', name: 'Jupiter', symbol: '♃', color: '#fdba74', planet: true, nakedEye: true },
  { id: 'Saturn', name: 'Saturne', symbol: '♄', color: '#c8a96b', planet: true, nakedEye: true },
  { id: 'Uranus', name: 'Uranus', symbol: '⛢', color: '#67e8f9', planet: true },
  { id: 'Neptune', name: 'Neptune', symbol: '♆', color: '#60a5fa', planet: true },
  { id: 'Pluto', name: 'Pluton', symbol: '♇', color: '#c4b5fd', planet: true },
]

export const PLANETS = BODIES.filter((b) => b.planet)
export const BODY = Object.fromEntries(BODIES.map((b) => [b.id, b]))

const CONSTELLATION_FR = Object.fromEntries(CONSTELLATIONS.map((c) => [c.id, c.fr]))
// Le Serpent est découpé en deux parties dans le catalogue des tracés.
CONSTELLATION_FR.Ser = CONSTELLATION_FR.Ser ?? CONSTELLATION_FR.Ser1 ?? 'Serpent'

export const makeObserver = (loc) => new Astronomy.Observer(loc.lat, loc.lon, loc.elevation ?? 0)

export const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
export const addDays = (date, days) => new Date(date.getTime() + days * DAY_MS)
export const addHours = (date, hours) => new Date(date.getTime() + hours * 3_600_000)
export const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const toDate = (t) => (t ? t.date : null)

/** Coordonnées apparentes (équatoriales de la date et horizontales avec réfraction) d'un astre. */
export function bodyPosition(bodyId, date, observer) {
  const eq = Astronomy.Equator(bodyId, date, observer, true, true)
  const hor = Astronomy.Horizon(date, observer, eq.ra, eq.dec, 'normal')
  return { ra: eq.ra, dec: eq.dec, dist: eq.dist, alt: hor.altitude, az: hor.azimuth }
}

/** Constellation (nom français et abréviation) contenant une position RA (h) / Dec (°) J2000. */
export function constellationAt(ra, dec) {
  const c = Astronomy.Constellation(ra, dec)
  return { symbol: c.symbol, name: CONSTELLATION_FR[c.symbol] ?? c.name }
}

/** Constellation dans laquelle se trouve un astre du système solaire à un instant donné. */
export function bodyConstellation(bodyId, date, observer) {
  const eqj = Astronomy.Equator(bodyId, date, observer, false, true)
  return constellationAt(eqj.ra, eqj.dec)
}

/**
 * Lever, culmination et coucher d'un astre pendant le jour civil local qui contient `date`.
 * `state` vaut 'normal', 'up' (circumpolaire, toujours levé) ou 'down' (ne se lève pas).
 */
export function riseTransitSet(bodyId, observer, date) {
  const day = startOfDay(date)
  const rise = toDate(Astronomy.SearchRiseSet(bodyId, observer, +1, day, 1))
  const set = toDate(Astronomy.SearchRiseSet(bodyId, observer, -1, day, 1))
  const culm = Astronomy.SearchHourAngle(bodyId, observer, 0, day, +1)
  const transit = culm.time.date < addDays(day, 1) ? culm.time.date : null
  let state = 'normal'
  if (!rise && !set) state = bodyPosition(bodyId, addHours(day, 12), observer).alt > 0 ? 'up' : 'down'
  return { rise, transit, transitAlt: culm.hor.altitude, set, state }
}

/** Instants du Soleil pour un jour civil : crépuscules, lever, midi vrai, coucher (null si l'événement n'a pas lieu). */
export function sunDay(observer, date) {
  const day = startOfDay(date)
  const alt = (dir, deg) => toDate(Astronomy.SearchAltitude(Astronomy.Body.Sun, observer, dir, day, 1, deg))
  const { rise, transit, transitAlt, set, state } = riseTransitSet(Astronomy.Body.Sun, observer, day)
  return {
    astronomicalDawn: alt(+1, -18),
    nauticalDawn: alt(+1, -12),
    civilDawn: alt(+1, -6),
    sunrise: rise,
    noon: transit,
    noonAlt: transitAlt,
    sunset: set,
    civilDusk: alt(-1, -6),
    nauticalDusk: alt(-1, -12),
    astronomicalDusk: alt(-1, -18),
    dayLength: rise && set && set > rise ? (set - rise) / 3_600_000 : state === 'up' ? 24 : state === 'down' ? 0 : null,
    state,
  }
}

const PHASES = [
  { max: 7, name: 'Nouvelle lune' },
  { max: 83, name: 'Premier croissant' },
  { max: 97, name: 'Premier quartier' },
  { max: 173, name: 'Gibbeuse croissante' },
  { max: 187, name: 'Pleine lune' },
  { max: 263, name: 'Gibbeuse décroissante' },
  { max: 277, name: 'Dernier quartier' },
  { max: 353, name: 'Dernier croissant' },
  { max: 360, name: 'Nouvelle lune' },
]

/** Nom de la phase à partir de l'angle de phase (0 = nouvelle lune, 180 = pleine lune). */
export const moonPhaseName = (angle) => PHASES.find((p) => angle < p.max)?.name ?? 'Nouvelle lune'

export const QUARTER_NAMES = ['Nouvelle lune', 'Premier quartier', 'Pleine lune', 'Dernier quartier']

/** État de la Lune à un instant donné. */
export function moonInfo(date) {
  const phase = Astronomy.MoonPhase(date)
  const illum = Astronomy.Illumination(Astronomy.Body.Moon, date)
  const distanceKm = Astronomy.GeoMoon(date).Length() * Astronomy.KM_PER_AU
  return {
    phase,
    name: moonPhaseName(phase),
    illumination: illum.phase_fraction,
    magnitude: illum.mag,
    ageDays: (phase / 360) * SYNODIC_MONTH,
    distanceKm,
  }
}

/** Prochaines phases principales de la Lune à partir de `date`. */
export function nextMoonQuarters(date, count = 4) {
  const result = []
  let mq = Astronomy.SearchMoonQuarter(date)
  for (let i = 0; i < count; i++) {
    result.push({ quarter: mq.quarter, name: QUARTER_NAMES[mq.quarter], date: mq.time.date })
    mq = Astronomy.NextMoonQuarter(mq)
  }
  return result
}

/** Hauteur d'un astre échantillonnée entre deux dates (pour les graphiques et la visibilité). */
export function altitudeSeries(bodyId, observer, start, end, stepMinutes = 10) {
  const points = []
  for (let t = start.getTime(); t <= end.getTime(); t += stepMinutes * 60_000) {
    const d = new Date(t)
    points.push({ t: d, alt: bodyPosition(bodyId, d, observer).alt })
  }
  return points
}

/**
 * Visibilité d'une planète pendant la nuit qui suit `date` (du coucher au lever du Soleil) :
 * créneau où elle est à plus de `minAlt`° pendant que le Soleil est sous −6°.
 */
export function nightVisibility(bodyId, observer, date, { minAlt = 5, stepMinutes = 10 } = {}) {
  const noon = addHours(startOfDay(date), 12)
  const nextNoon = addDays(noon, 1)
  let start = null
  let end = null
  let best = null
  for (let t = noon.getTime(); t <= nextNoon.getTime(); t += stepMinutes * 60_000) {
    const d = new Date(t)
    const sunAlt = bodyPosition(Astronomy.Body.Sun, d, observer).alt
    if (sunAlt > -6) continue
    const { alt, az } = bodyPosition(bodyId, d, observer)
    if (alt < minAlt) continue
    if (!start) start = d
    end = d
    if (!best || alt > best.alt) best = { t: d, alt, az }
  }
  const elongation = Astronomy.Elongation(bodyId, date)
  const illum = Astronomy.Illumination(bodyId, date)
  return {
    visible: Boolean(start),
    start,
    end,
    best,
    magnitude: illum.mag,
    elongation: elongation.elongation,
    side: elongation.visibility === 'morning' ? 'matin' : 'soir',
  }
}

/** Vecteur unitaire équatorial J2000 à partir d'une RA/Dec en degrés. */
export function unitVector(raDeg, decDeg) {
  const ra = (raDeg * Math.PI) / 180
  const dec = (decDeg * Math.PI) / 180
  const c = Math.cos(dec)
  return [c * Math.cos(ra), c * Math.sin(ra), Math.sin(dec)]
}

/**
 * Prépare une fonction rapide J2000 (RA°, Dec°) → horizontal (alt°, az°) pour un instant et un lieu :
 * une seule matrice de rotation est calculée, puis appliquée à des milliers d'étoiles.
 */
export function makeJ2000ToHorizon(date, observer) {
  const { rot } = Astronomy.Rotation_EQJ_HOR(date, observer)
  return (raDeg, decDeg) => {
    const [x, y, z] = unitVector(raDeg, decDeg)
    const hx = rot[0][0] * x + rot[1][0] * y + rot[2][0] * z // nord
    const hy = rot[0][1] * x + rot[1][1] * y + rot[2][1] * z // ouest
    const hz = rot[0][2] * x + rot[1][2] * y + rot[2][2] * z // zénith
    const alt = (Math.asin(Math.max(-1, Math.min(1, hz))) * 180) / Math.PI
    let az = (Math.atan2(-hy, hx) * 180) / Math.PI
    if (az < 0) az += 360
    return { alt: alt + refraction(alt), az }
  }
}

/** Réfraction atmosphérique approchée (formule de Sæmundsson), en degrés, pour une hauteur vraie. */
export function refraction(alt) {
  if (alt < -1) return 0
  const a = Math.max(alt, -0.9)
  return 1.02 / Math.tan(((a + 10.3 / (a + 5.11)) * Math.PI) / 180) / 60
}

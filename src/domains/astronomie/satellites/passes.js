/**
 * Prévision des passages de satellites (SGP4 via satellite.js).
 * Un passage est « visible » quand le satellite est éclairé par le Soleil, que l'observateur
 * est dans la nuit (Soleil sous −6°) et que le satellite dépasse la hauteur minimale.
 */
import * as sat from 'satellite.js'
import { bodyPosition, makeObserver } from '../lib/astro'

const DEG = Math.PI / 180
const KM_PER_AU = 149_597_870.7

/** Satellites proposés par défaut (numéro NORAD et magnitude standard à 1 000 km, phase 90°). */
export const SATELLITES = [
  { id: 25544, name: 'ISS (Station spatiale internationale)', stdMag: -1.8 },
  { id: 48274, name: 'Tiangong (station chinoise)', stdMag: -0.8 },
  { id: 20580, name: 'Télescope spatial Hubble', stdMag: 2.2 },
]

/** Lit un TLE de 2 ou 3 lignes (la ligne de nom est facultative). */
export function parseTle(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  const i1 = lines.findIndex((l) => l.startsWith('1 '))
  if (i1 < 0 || !lines[i1 + 1]?.startsWith('2 ')) return null
  const name = i1 > 0 ? lines[i1 - 1].replace(/^0 /, '') : 'Satellite'
  const satrec = sat.twoline2satrec(lines[i1], lines[i1 + 1])
  if (satrec.error) return null
  return { name, line1: lines[i1], line2: lines[i1 + 1], satrec, epoch: epochDate(satrec) }
}

function epochDate(satrec) {
  // jdsatepoch (+ fraction selon les versions) → date JavaScript
  const jd = satrec.jdsatepoch + (satrec.jdsatepochF ?? 0)
  return new Date((jd - 2_440_587.5) * 86_400_000)
}

const EARTH_RADIUS_KM = 6378.137

/**
 * Le satellite est-il éclairé ? Modèle d'ombre cylindrique : il est dans l'ombre s'il se trouve
 * du côté nuit de la Terre et à moins d'un rayon terrestre de l'axe Terre–Soleil.
 */
export function isSunlit(satEci, sunEciAu) {
  const sunLen = Math.hypot(sunEciAu.x, sunEciAu.y, sunEciAu.z)
  const ux = sunEciAu.x / sunLen
  const uy = sunEciAu.y / sunLen
  const uz = sunEciAu.z / sunLen
  const along = satEci.x * ux + satEci.y * uy + satEci.z * uz
  if (along > 0) return true
  const perp = Math.hypot(satEci.x - along * ux, satEci.y - along * uy, satEci.z - along * uz)
  return perp > EARTH_RADIUS_KM
}

const observerGd = (loc) => ({ latitude: loc.lat * DEG, longitude: loc.lon * DEG, height: (loc.elevation ?? 0) / 1000 })

/** Position du satellite vue depuis le lieu à un instant. Retourne null si la propagation échoue. */
export function lookAt(satrec, date, loc) {
  const pv = sat.propagate(satrec, date)
  if (!pv || !pv.position) return null
  const gmst = sat.gstime(date)
  const gd = observerGd(loc)
  const look = sat.ecfToLookAngles(gd, sat.eciToEcf(pv.position, gmst))
  const geo = sat.eciToGeodetic(pv.position, gmst)
  const [sx, sy, sz] = sat.sunPos(sat.jday(date)).rsun // vecteur Terre → Soleil (ua)
  const sun = { x: sx, y: sy, z: sz }
  const sunlit = isSunlit(pv.position, sun)
  return {
    el: look.elevation / DEG,
    az: (look.azimuth / DEG + 360) % 360,
    range: look.rangeSat,
    lat: geo.latitude / DEG,
    lon: geo.longitude / DEG,
    height: geo.height,
    speed: Math.hypot(pv.velocity.x, pv.velocity.y, pv.velocity.z),
    sunlit,
    eci: pv.position,
    sun,
    gmst,
  }
}

/** Magnitude visuelle approchée (modèle de sphère diffusante) ; null si inconnue. */
export function estimateMagnitude(stdMag, look, loc) {
  if (stdMag == null || !look) return null
  const obsEci = sat.ecfToEci(sat.geodeticToEcf(observerGd(loc)), look.gmst)
  const toObs = { x: obsEci.x - look.eci.x, y: obsEci.y - look.eci.y, z: obsEci.z - look.eci.z }
  const toSun = { x: look.sun.x * KM_PER_AU - look.eci.x, y: look.sun.y * KM_PER_AU - look.eci.y, z: look.sun.z * KM_PER_AU - look.eci.z }
  const dot = toObs.x * toSun.x + toObs.y * toSun.y + toObs.z * toSun.z
  const phase = Math.acos(Math.max(-1, Math.min(1, dot / (Math.hypot(toObs.x, toObs.y, toObs.z) * Math.hypot(toSun.x, toSun.y, toSun.z)))))
  const f = Math.sin(phase) + (Math.PI - phase) * Math.cos(phase)
  if (f <= 0) return null
  return stdMag + 5 * Math.log10(look.range / 1000) - 2.5 * Math.log10(f)
}

/** Affine par dichotomie l'instant où la hauteur franchit `level` entre t1 et t2 (ms). */
function refineCrossing(satrec, loc, t1, t2, level = 0) {
  let a = t1
  let b = t2
  const above = (t) => (lookAt(satrec, new Date(t), loc)?.el ?? -90) >= level
  const aAbove = above(a)
  while (b - a > 1000) {
    const m = (a + b) / 2
    if (above(m) === aAbove) a = m
    else b = m
  }
  return (a + b) / 2
}

/**
 * Passages au-dessus de l'horizon entre `start` et `start + days`.
 * Chaque passage contient le tracé échantillonné et sa partie visible à l'œil nu.
 */
export function findPasses(satrec, loc, start, { days = 10, minEl = 10, stdMag = null } = {}) {
  const observer = makeObserver(loc)
  const passes = []
  const t0 = start.getTime()
  const tEnd = t0 + days * 86_400_000
  const coarse = 60_000
  let prevEl = lookAt(satrec, start, loc)?.el ?? -90
  for (let t = t0 + coarse; t <= tEnd; t += coarse) {
    const el = lookAt(satrec, new Date(t), loc)?.el ?? -90
    if (prevEl < 0 && el >= 0) {
      const aos = refineCrossing(satrec, loc, t - coarse, t)
      // Suit le passage par pas de 5 s jusqu'au coucher
      const samples = []
      let tt = aos
      let look = lookAt(satrec, new Date(tt), loc)
      while (look && look.el >= -0.5 && tt - aos < 30 * 60_000) {
        const sunAlt = bodyPosition('Sun', new Date(tt), observer).alt
        samples.push({ t: new Date(tt), el: look.el, az: look.az, range: look.range, sunlit: look.sunlit, sunAlt, look })
        tt += 5000
        look = lookAt(satrec, new Date(tt), loc)
      }
      const los = refineCrossing(satrec, loc, tt - 5000, tt)
      const max = samples.reduce((m, s) => (s.el > m.el ? s : m), samples[0])
      if (max && max.el >= minEl) {
        const vis = samples.filter((s) => s.sunlit && s.sunAlt < -6 && s.el >= minEl)
        const high = samples.filter((s) => s.el >= minEl)
        const part = vis.length ? vis : high
        const peak = part.reduce((m, s) => (s.el > m.el ? s : m), part[0])
        passes.push({
          aos: new Date(aos),
          los: new Date(los),
          max,
          visible: vis.length > 0,
          start: part[0],
          peak,
          end: part[part.length - 1],
          magnitude: vis.length ? estimateMagnitude(stdMag, peak.look, loc) : null,
          samples: samples.map(({ t, el, az, sunlit, sunAlt }) => ({ t, el, az, visible: sunlit && sunAlt < -6 })),
          sunAltAtMax: max.sunAlt,
        })
      }
      t = Math.max(t, Math.ceil((los - t0) / coarse) * coarse + t0)
    }
    prevEl = el
  }
  return passes
}

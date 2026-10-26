/**
 * Géométrie sur le globe terrestre pour les cartes équirectangulaires :
 * point subsolaire ou sublunaire, zones jour/nuit et empreintes circulaires (calottes sphériques).
 */
import { Astronomy } from './astro'

const DEG = Math.PI / 180
const mod = (x, m) => ((x % m) + m) % m
export const normLon = (lon) => mod(lon + 180, 360) - 180

/** Coordonnées SVG d'un point du globe sur la carte équirectangulaire (viewBox 0 0 360 180). */
export const xy = (lat, lon) => [lon + 180, 90 - lat]

/** Point de la Terre où l'astre est au zénith (latitude, longitude en degrés). */
export function subPoint(body, date) {
  const vec = Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(date), Astronomy.GeoVector(body, date, true))
  const eq = Astronomy.EquatorFromVector(vec)
  return { lat: eq.dec, lon: normLon((eq.ra - Astronomy.SiderealTime(date)) * 15), dist: eq.dist }
}

/** Distance angulaire (degrés) entre deux points du globe. */
export function angularDistance(a, b) {
  const c = Math.sin(a.lat * DEG) * Math.sin(b.lat * DEG) + Math.cos(a.lat * DEG) * Math.cos(b.lat * DEG) * Math.cos((a.lon - b.lon) * DEG)
  return Math.acos(Math.max(-1, Math.min(1, c))) / DEG
}

/**
 * Intervalle de latitudes [bas, haut] de la calotte (centre, rayon ≤ 90°) sur le méridien `lon`, ou null.
 * Sur un demi-méridien, l'intersection avec une calotte au plus hémisphérique est un seul intervalle.
 */
function capInterval(center, radius, lon) {
  const A = Math.sin(center.lat * DEG)
  const B = Math.cos(center.lat * DEG) * Math.cos((lon - center.lon) * DEG)
  const C = Math.cos(radius * DEG)
  const R = Math.hypot(A, B)
  if (R < 1e-12) return C <= 0 ? [-90, 90] : null
  const k = C / R
  if (k >= 1) return null
  if (k <= -1) return [-90, 90]
  // A sin φ + B cos φ = R cos(φ − ψ) ≥ C
  const psi = Math.atan2(A, B) / DEG
  const alpha = Math.acos(k) / DEG
  for (const shift of [0, 360, -360]) {
    const lo = Math.max(-90, psi - alpha + shift)
    const hi = Math.min(90, psi + alpha + shift)
    if (lo < hi) return [lo, hi]
  }
  return null
}

/**
 * Contours SVG d'une calotte sphérique en projection équirectangulaire (x = lon + 180, y = 90 − lat).
 * Fonctionne aussi quand la calotte contient un pôle ou chevauche l'antiméridien.
 */
export function capPath(center, radius, step = 1) {
  const cols = []
  for (let lon = -180; lon <= 180 + 1e-9; lon += step) cols.push([lon, capInterval(center, radius, lon)])
  let d = ''
  let run = []
  const flush = () => {
    if (run.length > 1) {
      const top = run.map(([lon, [, hi]]) => `${(lon + 180).toFixed(2)} ${(90 - hi).toFixed(2)}`)
      const bottom = run.map(([lon, [lo]]) => `${(lon + 180).toFixed(2)} ${(90 - lo).toFixed(2)}`).reverse()
      d += `M${top.join(' L')} L${bottom.join(' L')}Z`
    }
    run = []
  }
  for (const col of cols) {
    if (col[1]) run.push(col)
    else flush()
  }
  flush()
  return d
}

/**
 * Zones de nuit : calottes centrées sur le point antisolaire.
 * Hauteur du Soleil < h  ⇔  distance au point antisolaire < 90° + h.
 */
export function nightPaths(date) {
  const sun = subPoint(Astronomy.Body.Sun, date)
  const anti = { lat: -sun.lat, lon: normLon(sun.lon + 180) }
  return {
    sun,
    layers: [0, -6, -12, -18].map((h) => ({ h, d: capPath(anti, 90 + h) })),
  }
}

/** Rayon angulaire (degrés) de la zone d'où un satellite d'altitude `heightKm` est au-dessus de `minEl`. */
export function footprintRadius(heightKm, minEl = 0) {
  const Re = 6371
  const el = minEl * DEG
  return (Math.acos((Re / (Re + heightKm)) * Math.cos(el)) - el) / DEG
}

/** Découpe une trace au sol en segments qui ne traversent pas l'antiméridien. */
export function splitTrack(points) {
  const segments = []
  let seg = []
  for (const p of points) {
    if (seg.length && Math.abs(p.lon - seg[seg.length - 1].lon) > 180) {
      segments.push(seg)
      seg = []
    }
    seg.push(p)
  }
  if (seg.length) segments.push(seg)
  return segments
}

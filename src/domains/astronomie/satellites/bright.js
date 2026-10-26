/**
 * Prévisions quotidiennes des satellites brillants : tous les passages visibles à l'œil nu
 * (satellite éclairé, ciel sombre, hauteur suffisante) d'une liste de TLE sur une période donnée.
 */
import * as sat from 'satellite.js'
import { bodyPosition, makeObserver } from '../lib/astro'
import { SATELLITES, estimateMagnitude, isSunlit, parseTle } from './passes'

const DEG = Math.PI / 180

/** Magnitudes standard connues (à 1 000 km, phase 90°), par numéro NORAD. */
const STD_MAG = Object.fromEntries(SATELLITES.map((s) => [s.id, s.stdMag]))

/** Lit un fichier de TLE à trois lignes (nom, ligne 1, ligne 2) contenant plusieurs satellites. */
export function parseTleList(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim())
  const list = []
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].startsWith('1 ') || !lines[i + 1].startsWith('2 ')) continue
    const named = i > 0 && !lines[i - 1].startsWith('1 ') && !lines[i - 1].startsWith('2 ')
    const tle = parseTle(named ? `${lines[i - 1]}\n${lines[i]}\n${lines[i + 1]}` : `${lines[i]}\n${lines[i + 1]}`)
    if (tle) list.push({ ...tle, id: Number(tle.satrec.satnum), stdMag: STD_MAG[Number(tle.satrec.satnum)] ?? null })
  }
  return list
}

/**
 * Grille temporelle partagée par tous les satellites : temps sidéral, position du Soleil
 * et obscurité (Soleil sous −6°) à chaque pas.
 */
export function makeGrid(loc, start, hours, stepSeconds = 30) {
  const observer = makeObserver(loc)
  const n = Math.floor((hours * 3600) / stepSeconds) + 1
  const times = []
  const gmst = []
  const sun = []
  const dark = []
  let sunAlt = 0
  let sunVec = null
  for (let i = 0; i < n; i++) {
    const t = new Date(start.getTime() + i * stepSeconds * 1000)
    // Le Soleil se déplace lentement : recalculé toutes les 5 minutes
    if (i % Math.max(1, Math.round(300 / stepSeconds)) === 0) {
      sunAlt = bodyPosition('Sun', t, observer).alt
      const [x, y, z] = sat.sunPos(sat.jday(t)).rsun
      sunVec = { x, y, z }
    }
    times.push(t)
    gmst.push(sat.gstime(t))
    sun.push(sunVec)
    dark.push(sunAlt < -6)
  }
  return { times, gmst, sun, dark, stepSeconds, gd: { latitude: loc.lat * DEG, longitude: loc.lon * DEG, height: (loc.elevation ?? 0) / 1000 } }
}

/** Passages visibles d'un satellite sur la grille (hauteur ≥ minEl, éclairé, nuit). */
export function visiblePasses(tle, grid, loc, minEl = 10) {
  const passes = []
  let current = null
  const close = () => {
    if (current && current.samples.length > 1) {
      const peak = current.samples.reduce((m, s) => (s.el > m.el ? s : m), current.samples[0])
      passes.push({
        sat: tle,
        start: current.samples[0],
        peak,
        end: current.samples[current.samples.length - 1],
        samples: current.samples,
        magnitude: estimateMagnitude(tle.stdMag, peak.look, loc),
      })
    }
    current = null
  }
  for (let i = 0; i < grid.times.length; i++) {
    if (!grid.dark[i]) {
      close()
      continue
    }
    const pv = sat.propagate(tle.satrec, grid.times[i])
    if (!pv || !pv.position) {
      close()
      continue
    }
    const look = sat.ecfToLookAngles(grid.gd, sat.eciToEcf(pv.position, grid.gmst[i]))
    const el = look.elevation / DEG
    if (el < minEl || !isSunlit(pv.position, grid.sun[i])) {
      close()
      continue
    }
    current ??= { samples: [] }
    current.samples.push({
      t: grid.times[i],
      el,
      az: (look.azimuth / DEG + 360) % 360,
      visible: true,
      look: { eci: pv.position, sun: grid.sun[i], range: look.rangeSat, gmst: grid.gmst[i] },
    })
  }
  close()
  return passes
}

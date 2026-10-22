/**
 * Moteur du calendrier astronomique : recherche de tous les phénomènes d'une période.
 * S'appuie sur les fonctions de recherche d'Astronomy Engine (phases, apsides, saisons,
 * oppositions, élongations, éclipses) et sur un balayage pour les rapprochements.
 */
import { Astronomy, BODY, DAY_MS, QUARTER_NAMES, unitVector } from '../lib/astro'

export const EVENT_TYPES = {
  phase: { label: 'Phase de la Lune', color: '#a1a1aa' },
  apsis: { label: 'Périgée / apogée', color: '#38bdf8' },
  season: { label: 'Saison', color: '#34d399' },
  eclipse: { label: 'Éclipse', color: '#f97316' },
  opposition: { label: 'Opposition', color: '#f87171' },
  conjunction: { label: 'Conjonction solaire', color: '#fbbf24' },
  elongation: { label: 'Élongation maximale', color: '#a78bfa' },
  approach: { label: 'Rapprochement', color: '#60a5fa' },
  meteor: { label: "Pluie d'étoiles filantes", color: '#f472b6' },
  brightness: { label: 'Éclat maximal', color: '#facc15' },
}

const PLANETS = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
const OUTER = ['Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
const BRIGHT = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn']

/** Étoiles brillantes proches de l'écliptique, souvent approchées par la Lune (J2000). */
const ECLIPTIC_STARS = [
  { id: 'Aldebaran', near: "d'Aldébaran", ra: 68.98, dec: 16.51 },
  { id: 'Pleiades', near: 'des Pléiades', ra: 56.75, dec: 24.12 },
  { id: 'Regulus', near: 'de Régulus', ra: 152.09, dec: 11.97 },
  { id: 'Spica', near: 'de Spica', ra: 201.3, dec: -11.16 },
  { id: 'Antares', near: "d'Antarès", ra: 247.35, dec: -26.43 },
]

/** Maxima des principaux essaims (dates moyennes, à ±1 jour près selon les années). */
const METEOR_SHOWERS = [
  { month: 0, day: 3, name: 'Quadrantides', zhr: 110, radiant: 'Bouvier' },
  { month: 3, day: 22, name: 'Lyrides', zhr: 18, radiant: 'Lyre' },
  { month: 4, day: 6, name: 'Êta Aquarides', zhr: 50, radiant: 'Verseau' },
  { month: 6, day: 30, name: 'Delta Aquarides', zhr: 25, radiant: 'Verseau' },
  { month: 7, day: 12, name: 'Perséides', zhr: 100, radiant: 'Persée' },
  { month: 9, day: 8, name: 'Draconides', zhr: 10, radiant: 'Dragon' },
  { month: 9, day: 21, name: 'Orionides', zhr: 20, radiant: 'Orion' },
  { month: 10, day: 12, name: 'Taurides du Nord', zhr: 5, radiant: 'Taureau' },
  { month: 10, day: 17, name: 'Léonides', zhr: 15, radiant: 'Lion' },
  { month: 11, day: 14, name: 'Géminides', zhr: 150, radiant: 'Gémeaux' },
  { month: 11, day: 22, name: 'Ursides', zhr: 10, radiant: 'Petite Ourse' },
]

const ECLIPSE_KIND = {
  lunar: { penumbral: 'pénombrale', partial: 'partielle', total: 'totale' },
  solar: { partial: 'partielle', annular: 'annulaire', total: 'totale' },
}

const name = (id) => BODY[id]?.name ?? id
const fmtDeg = (x, d = 1) => `${x.toFixed(d).replace('.', ',')}°`

/** Golden-section : instant de séparation minimale entre t1 et t2 (ms). */
function minimize(f, t1, t2, iterations = 30) {
  const phi = (Math.sqrt(5) - 1) / 2
  let a = t1
  let b = t2
  let c = b - phi * (b - a)
  let d = a + phi * (b - a)
  let fc = f(c)
  let fd = f(d)
  for (let i = 0; i < iterations; i++) {
    if (fc < fd) {
      b = d
      d = c
      fd = fc
      c = b - phi * (b - a)
      fc = f(c)
    } else {
      a = c
      c = d
      fc = fd
      d = a + phi * (b - a)
      fd = f(d)
    }
  }
  const t = (a + b) / 2
  return { t, value: f(t) }
}

/** Détecte les minima locaux d'une fonction échantillonnée, sous un seuil. */
function findMinima(f, start, end, stepMs, threshold) {
  const results = []
  let prev2 = f(start - stepMs)
  let prev = f(start)
  for (let t = start + stepMs; t <= end + stepMs; t += stepMs) {
    const cur = f(t)
    if (prev <= prev2 && prev <= cur && prev < threshold * 1.5) {
      const m = minimize(f, t - 2 * stepMs, t)
      if (m.value <= threshold && m.t >= start && m.t < end) results.push(m)
    }
    prev2 = prev
    prev = cur
  }
  return results
}

/** Tous les événements entre deux dates, triés chronologiquement. */
export function findEvents(start, end, observer) {
  const events = []
  const inRange = (date) => date >= start && date < end
  const push = (date, type, title, detail, extra = {}) => {
    if (date && inRange(date)) events.push({ time: date, type, title, detail, ...extra })
  }

  // Phases de la Lune
  let mq = Astronomy.SearchMoonQuarter(start)
  while (mq.time.date < end) {
    push(mq.time.date, 'phase', QUARTER_NAMES[mq.quarter], null, { quarter: mq.quarter })
    mq = Astronomy.NextMoonQuarter(mq)
  }

  // Périgées et apogées
  let aps = Astronomy.SearchLunarApsis(start)
  while (aps.time.date < end) {
    const peri = aps.kind === Astronomy.ApsisKind.Pericenter
    push(aps.time.date, 'apsis', peri ? 'Lune au périgée' : "Lune à l'apogée", `${Math.round(aps.dist_km).toLocaleString('fr-FR')} km`)
    aps = Astronomy.NextLunarApsis(aps)
  }

  // Équinoxes et solstices
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    const s = Astronomy.Seasons(y)
    push(s.mar_equinox.date, 'season', 'Équinoxe de mars', 'Début du printemps (hémisphère nord)')
    push(s.jun_solstice.date, 'season', 'Solstice de juin', "Début de l'été (hémisphère nord)")
    push(s.sep_equinox.date, 'season', 'Équinoxe de septembre', "Début de l'automne (hémisphère nord)")
    push(s.dec_solstice.date, 'season', 'Solstice de décembre', "Début de l'hiver (hémisphère nord)")
  }

  // Oppositions et conjonctions avec le Soleil
  for (const p of PLANETS) {
    const outer = OUTER.includes(p)
    for (const target of [0, 180]) {
      let t = start
      for (let guard = 0; guard < 4; guard++) {
        const time = Astronomy.SearchRelativeLongitude(p, target, t).date
        if (time >= end) break
        if (target === 0 && outer) push(time, 'opposition', `Opposition de ${name(p)}`, 'Visible toute la nuit, au plus près de la Terre', { important: true })
        else if (target === 0) push(time, 'conjunction', `Conjonction inférieure de ${name(p)}`, 'Passe entre la Terre et le Soleil')
        else push(time, 'conjunction', `Conjonction ${outer ? '' : 'supérieure '}de ${name(p)}`.replace('  ', ' '), 'Derrière le Soleil, inobservable')
        t = new Date(time.getTime() + DAY_MS)
      }
    }
  }

  // Élongations maximales de Mercure et Vénus
  for (const p of ['Mercury', 'Venus']) {
    let t = start
    for (let guard = 0; guard < 4; guard++) {
      const e = Astronomy.SearchMaxElongation(p, t)
      if (e.time.date >= end) break
      const evening = e.visibility === 'evening'
      push(e.time.date, 'elongation', `${name(p)} à l'élongation maximale ${evening ? 'est' : 'ouest'}`, `${fmtDeg(e.elongation)} du Soleil, visible le ${evening ? 'soir' : 'matin'}`, {
        important: p === 'Mercury',
      })
      t = new Date(e.time.date.getTime() + DAY_MS)
    }
  }

  // Éclat maximal de Vénus
  {
    let t = start
    for (let guard = 0; guard < 3; guard++) {
      const pk = Astronomy.SearchPeakMagnitude('Venus', t)
      if (pk.time.date >= end) break
      push(pk.time.date, 'brightness', 'Éclat maximal de Vénus', `Magnitude ${pk.mag.toFixed(1).replace('.', ',')}`)
      t = new Date(pk.time.date.getTime() + 10 * DAY_MS)
    }
  }

  // Éclipses de Lune
  let le = Astronomy.SearchLunarEclipse(start)
  while (le.peak.date < end) {
    let visible = null
    if (observer) visible = Astronomy.Horizon(le.peak, observer, ...raDec('Moon', le.peak, observer), 'normal').altitude > 0
    push(le.peak.date, 'eclipse', `Éclipse ${ECLIPSE_KIND.lunar[le.kind]} de Lune`, visible === null ? null : visible ? 'Visible depuis votre lieu (Lune levée au maximum)' : 'Lune sous l’horizon au maximum chez vous', {
      important: true,
    })
    le = Astronomy.NextLunarEclipse(le.peak)
  }

  // Éclipses de Soleil (globales, avec visibilité locale)
  let se = Astronomy.SearchGlobalSolarEclipse(start)
  while (se.peak.date < end) {
    let detail = null
    if (observer) {
      const local = Astronomy.SearchLocalSolarEclipse(new Date(se.peak.date.getTime() - DAY_MS), observer)
      const sameEvent = Math.abs(local.peak.time.date - se.peak.date) < DAY_MS
      detail =
        sameEvent && local.peak.altitude > 0
          ? `Visible chez vous : ${Math.round(local.obscuration * 100)} % du Soleil masqué à ${local.peak.time.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
          : 'Non visible depuis votre lieu'
    }
    push(se.peak.date, 'eclipse', `Éclipse ${ECLIPSE_KIND.solar[se.kind]} de Soleil`, detail, { important: true })
    se = Astronomy.NextGlobalSolarEclipse(se.peak)
  }

  // Rapprochements de la Lune avec les planètes et les étoiles brillantes de l'écliptique
  const s0 = start.getTime()
  const e0 = end.getTime()
  const moonCache = new Map()
  const moonVec = (t) => {
    if (!moonCache.has(t)) moonCache.set(t, Astronomy.GeoVector('Moon', new Date(t), true))
    return moonCache.get(t)
  }
  for (const p of BRIGHT) {
    const f = (t) => Astronomy.AngleBetween(moonVec(t), Astronomy.GeoVector(p, new Date(t), true))
    for (const m of findMinima(f, s0, e0, 6 * 3_600_000, 5)) {
      push(new Date(m.t), 'approach', `La Lune près de ${name(p)}`, `${fmtDeg(m.value)} de séparation`)
    }
  }
  for (const star of ECLIPTIC_STARS) {
    const [x, y, z] = unitVector(star.ra, star.dec)
    const v = new Astronomy.Vector(x, y, z, Astronomy.MakeTime(start))
    const f = (t) => Astronomy.AngleBetween(moonVec(t), v)
    for (const m of findMinima(f, s0, e0, 6 * 3_600_000, 3)) {
      push(new Date(m.t), 'approach', `La Lune près ${star.near}`, `${fmtDeg(m.value)} de séparation`)
    }
  }

  // Conjonctions entre planètes brillantes
  for (let i = 0; i < BRIGHT.length; i++) {
    for (let j = i + 1; j < BRIGHT.length; j++) {
      const [a, b] = [BRIGHT[i], BRIGHT[j]]
      const f = (t) => Astronomy.AngleBetween(Astronomy.GeoVector(a, new Date(t), true), Astronomy.GeoVector(b, new Date(t), true))
      for (const m of findMinima(f, s0, e0, 12 * 3_600_000, 4)) {
        push(new Date(m.t), 'approach', `${name(a)} et ${name(b)} en conjonction`, `${fmtDeg(m.value, 2)} de séparation`, { important: m.value < 1 })
      }
    }
  }

  // Étoiles filantes (dates moyennes)
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    for (const sh of METEOR_SHOWERS) {
      push(new Date(y, sh.month, sh.day, 23), 'meteor', `Maximum des ${sh.name}`, `Jusqu'à ${sh.zhr} météores/h · radiant : ${sh.radiant} (date moyenne)`, {
        approximate: true,
      })
    }
  }

  return events.sort((a, b) => a.time - b.time)
}

function raDec(body, time, observer) {
  const eq = Astronomy.Equator(body, time, observer, true, true)
  return [eq.ra, eq.dec]
}

/** Clé de jour local « AAAA-M-J ». */
export const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

/** Événements d'un mois groupés par jour (inclut les jours voisins visibles dans la grille). */
export function monthEvents(year, month, observer) {
  const start = new Date(year, month, 1)
  start.setDate(start.getDate() - 7)
  const end = new Date(year, month + 1, 1)
  end.setDate(end.getDate() + 7)
  const byDay = new Map()
  for (const e of findEvents(start, end, observer)) {
    const key = dayKey(e.time)
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key).push(e)
  }
  return byDay
}

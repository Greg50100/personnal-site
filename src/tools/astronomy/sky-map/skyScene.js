/**
 * Calcul et dessin de la carte du ciel (projection stéréographique centrée sur le zénith,
 * horizon sur le cercle extérieur, nord en haut et est à gauche comme lorsqu'on lève les yeux).
 */
import STARS from '../data/stars.json'
import STAR_NAMES from '../data/star-names.json'
import CONSTELLATIONS from '../data/constellations.json'
import LINES from '../data/constellation-lines.json'
import MESSIER from '../data/messier.json'
import { Astronomy, BODIES, bodyPosition, constellationAt, makeJ2000ToHorizon, moonInfo } from '../lib/astro'

const NAME_BY_INDEX = new Map(STAR_NAMES)
const DEG = Math.PI / 180
const OBLIQUITY = 23.4392911 * DEG

/** Couleur approximative d'une étoile d'après son indice B−V. */
function starColor(bv) {
  if (bv < -0.1) return '#9db4ff'
  if (bv < 0.15) return '#c4d4ff'
  if (bv < 0.45) return '#f1f3ff'
  if (bv < 0.7) return '#fff6e5'
  if (bv < 1.1) return '#ffdcae'
  if (bv < 1.45) return '#ffc285'
  return '#ffa860'
}

/** Coordonnées horizontales de tout ce qui est affichable, pour un instant et un lieu. */
export function computeScene(date, observer) {
  const toHor = makeJ2000ToHorizon(date, observer)

  const stars = STARS.map(([ra, dec, mag, bv], i) => {
    const { alt, az } = toHor(ra, dec)
    return { i, ra, dec, mag, bv, alt, az, name: NAME_BY_INDEX.get(i) }
  })

  const lines = LINES.map((c) => ({ id: c.id, segments: c.l.map((seg) => seg.map(([ra, dec]) => toHor(ra, dec))) }))

  const labels = CONSTELLATIONS.map((c) => ({ ...c, ...toHor(c.ra, c.dec) }))

  const messier = MESSIER.map((m) => ({ ...m, ...toHor(m.ra, m.dec) }))

  const ecliptic = []
  for (let l = 0; l <= 360; l += 4) {
    const lam = l * DEG
    const ra = Math.atan2(Math.sin(lam) * Math.cos(OBLIQUITY), Math.cos(lam)) / DEG
    const dec = Math.asin(Math.sin(OBLIQUITY) * Math.sin(lam)) / DEG
    ecliptic.push(toHor((ra + 360) % 360, dec))
  }
  const equator = []
  for (let ra = 0; ra <= 360; ra += 4) equator.push(toHor(ra, 0))

  const bodies = BODIES.map((b) => {
    const pos = bodyPosition(b.id, date, observer)
    const mag = Astronomy.Illumination(b.id, date).mag
    const eqj = Astronomy.Equator(b.id, date, observer, false, true)
    return { ...b, ...pos, mag, ra2000: eqj.ra, dec2000: eqj.dec }
  })
  const moon = moonInfo(date)
  const sun = bodies.find((b) => b.id === 'Sun')

  return { stars, lines, labels, messier, ecliptic, equator, bodies, moonPhase: moon.phase, sunAlt: sun.alt }
}

/** Fabrique la projection (alt, az) → pixels pour un canevas de taille donnée. */
export function makeProjection(size, rotationDeg = 0) {
  const cx = size / 2
  const cy = size / 2
  const R = size / 2 - Math.max(22, size * 0.045)
  const rot = rotationDeg * DEG
  return {
    cx,
    cy,
    R,
    project(alt, az) {
      const r = R * Math.tan(((90 - alt) * DEG) / 2)
      const a = az * DEG + rot
      return [cx - r * Math.sin(a), cy - r * Math.cos(a)]
    },
  }
}

function skyBackground(sunAlt) {
  if (sunAlt > 0) return ['#1d4e89', '#3b82c4']
  if (sunAlt > -6) return ['#141b45', '#36407a']
  if (sunAlt > -12) return ['#0b1030', '#1b2152']
  if (sunAlt > -18) return ['#070a1f', '#10153a']
  return ['#03050f', '#0a0f24']
}

const CARDINALS = [
  ['N', 0],
  ['NE', 45],
  ['E', 90],
  ['SE', 135],
  ['S', 180],
  ['SO', 225],
  ['O', 270],
  ['NO', 315],
]

/**
 * Dessine la scène. Retourne la liste des cibles cliquables { x, y, r, info }.
 * options : { magLimit, lines, constellationNames, starNames, planets, messier, grid, ecliptic, rotation, selected }
 */
export function drawScene(ctx, size, scene, options) {
  const { cx, cy, R, project } = makeProjection(size, options.rotation)
  const targets = []
  const scale = size / 700
  ctx.clearRect(0, 0, size, size)

  // Fond du ciel (dégradé selon la hauteur du Soleil)
  const [inner, outer] = skyBackground(scene.sunAlt)
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R)
  grad.addColorStop(0, inner)
  grad.addColorStop(1, outer)
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.clip()

  const polyline = (points, minAlt = -10) => {
    let started = false
    ctx.beginPath()
    for (const p of points) {
      if (p.alt < minAlt) {
        started = false
        continue
      }
      const [x, y] = project(p.alt, p.az)
      if (started) ctx.lineTo(x, y)
      else ctx.moveTo(x, y)
      started = true
    }
    ctx.stroke()
  }

  // Grille alt-azimutale
  if (options.grid) {
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.18)'
    ctx.lineWidth = 1
    for (const alt of [30, 60]) {
      const r = R * Math.tan(((90 - alt) * DEG) / 2)
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    for (let az = 0; az < 360; az += 30) {
      const [x, y] = project(0, az)
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  // Équateur céleste et écliptique
  if (options.ecliptic) {
    ctx.setLineDash([6 * scale, 6 * scale])
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.55)'
    ctx.lineWidth = 1.2
    polyline(scene.ecliptic)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'
    polyline(scene.equator)
    ctx.setLineDash([])
  }

  // Tracés des constellations
  if (options.lines) {
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.35)'
    ctx.lineWidth = 1
    for (const c of scene.lines) for (const seg of c.segments) polyline(seg, -5)
  }

  // Objets Messier
  if (options.messier) {
    ctx.strokeStyle = 'rgba(167, 243, 208, 0.7)'
    ctx.fillStyle = 'rgba(167, 243, 208, 0.85)'
    ctx.lineWidth = 1
    ctx.font = `${Math.round(10 * Math.max(scale, 0.8))}px "JetBrains Mono", monospace`
    for (const m of scene.messier) {
      if (m.alt < 0) continue
      const [x, y] = project(m.alt, m.az)
      ctx.beginPath()
      ctx.arc(x, y, 3.5 * Math.max(scale, 0.8), 0, Math.PI * 2)
      ctx.stroke()
      if (options.starNames) ctx.fillText(m.id, x + 5, y - 4)
      targets.push({ x, y, r: 8, kind: 'messier', obj: m })
    }
  }

  // Étoiles (les plus faibles d'abord pour que les brillantes passent devant)
  const starScale = Math.max(scale, 0.7)
  for (let k = scene.stars.length - 1; k >= 0; k--) {
    const s = scene.stars[k]
    if (s.alt < 0 || s.mag > options.magLimit) continue
    const [x, y] = project(s.alt, s.az)
    const r = Math.max(0.55, (options.magLimit + 0.6 - s.mag) * 0.62) * starScale
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = starColor(s.bv)
    ctx.globalAlpha = s.mag > 4.5 ? 0.75 : 1
    ctx.fill()
    ctx.globalAlpha = 1
    if (s.mag < 4.5 || s.name) targets.push({ x, y, r: Math.max(r + 3, 6), kind: 'star', obj: s })
  }

  // Noms des constellations
  if (options.constellationNames) {
    ctx.textAlign = 'center'
    for (const c of scene.labels) {
      if (c.alt < 3 || (c.rank > 2 && size < 520)) continue
      const [x, y] = project(c.alt, c.az)
      ctx.font = `${c.rank === 1 ? 600 : 400} ${Math.round((c.rank === 1 ? 11 : 10) * Math.max(scale, 0.85))}px Inter, sans-serif`
      ctx.fillStyle = c.rank === 1 ? 'rgba(186, 230, 253, 0.75)' : 'rgba(186, 230, 253, 0.5)'
      ctx.fillText(c.fr.toUpperCase(), x, y)
    }
    ctx.textAlign = 'left'
  }

  // Noms des étoiles brillantes
  if (options.starNames) {
    ctx.font = `${Math.round(11 * Math.max(scale, 0.85))}px Inter, sans-serif`
    ctx.fillStyle = 'rgba(244, 244, 245, 0.8)'
    for (const s of scene.stars) {
      if (!s.name || s.alt < 1 || s.mag > Math.min(options.magLimit, size < 520 ? 1.6 : 2.3)) continue
      const [x, y] = project(s.alt, s.az)
      ctx.fillText(s.name, x + 5, y + 11)
    }
  }

  // Soleil, Lune et planètes
  if (options.planets) {
    for (const b of scene.bodies) {
      if (b.alt < -1) continue
      const [x, y] = project(b.alt, b.az)
      let r
      if (b.id === 'Sun') {
        r = 9 * starScale
        ctx.beginPath()
        ctx.arc(x, y, r * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(250, 204, 21, 0.25)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = '#facc15'
        ctx.fill()
      } else if (b.id === 'Moon') {
        r = 9 * starScale
        drawMoon(ctx, x, y, r, scene.moonPhase)
      } else {
        r = Math.max(2.5, Math.min(5.5, 4.5 - b.mag * 0.5)) * starScale
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = b.color
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.6)'
        ctx.stroke()
      }
      ctx.font = `600 ${Math.round(12 * Math.max(scale, 0.85))}px Inter, sans-serif`
      ctx.fillStyle = b.color
      ctx.fillText(b.name, x + r + 4, y - r)
      targets.push({ x, y, r: r + 6, kind: 'body', obj: b, priority: 2 })
    }
  }

  // Sélection
  if (options.selected) {
    const sel = options.selected
    if (sel.alt > -1) {
      const [x, y] = project(sel.alt, sel.az)
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 12 * starScale, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
  ctx.restore()

  // Horizon et points cardinaux
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, cy, R, 0, Math.PI * 2)
  ctx.stroke()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const [label, az] of CARDINALS) {
    const main = label.length === 1
    const r = R + (size / 2 - R) / 2
    const a = az * DEG + options.rotation * DEG
    ctx.font = `${main ? 700 : 500} ${Math.round((main ? 14 : 10) * Math.max(scale, 0.85))}px "JetBrains Mono", monospace`
    ctx.fillStyle = main ? '#f97316' : '#a1a1aa'
    ctx.fillText(label, cx - r * Math.sin(a), cy - r * Math.cos(a))
  }
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  return targets
}

function drawMoon(ctx, x, y, r, phase) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fillStyle = '#3f3f46'
  ctx.fill()
  const p = phase * DEG
  const rx = Math.abs(Math.cos(p)) * r
  const waxing = phase < 180
  const gibbous = Math.cos(p) < 0
  ctx.beginPath()
  // Bord éclairé (demi-disque) puis terminateur elliptique
  ctx.arc(x, y, r, -Math.PI / 2, Math.PI / 2, !waxing)
  ctx.ellipse(x, y, rx, r, 0, Math.PI / 2, -Math.PI / 2, waxing ? !gibbous : gibbous)
  ctx.fillStyle = '#f4f4f5'
  ctx.fill()
}

/** Description d'un objet pointé (pour le panneau d'information). */
export function describe(target) {
  const o = target.obj
  // Les constellations se déterminent en coordonnées J2000 (RA en heures).
  const cst = (raHours, dec) => constellationAt(raHours, dec).name
  if (target.kind === 'body') {
    return {
      title: o.name,
      subtitle: o.id === 'Sun' ? 'Étoile' : o.id === 'Moon' ? 'Satellite naturel' : 'Planète',
      mag: o.mag,
      alt: o.alt,
      az: o.az,
      raHours: o.ra,
      dec: o.dec,
      constellation: cst(o.ra2000, o.dec2000),
      distance: o.dist,
      ref: o,
    }
  }
  if (target.kind === 'messier') {
    return {
      title: `${o.id}${o.nom ? ` — ${o.nom}` : ''}`,
      subtitle: `${o.type}${o.ngc ? ` · ${o.ngc}` : ''}`,
      mag: o.mag,
      alt: o.alt,
      az: o.az,
      raHours: o.ra / 15,
      dec: o.dec,
      constellation: cst(o.ra / 15, o.dec),
      ref: o,
    }
  }
  return {
    title: o.name ?? 'Étoile',
    subtitle: 'Étoile',
    mag: o.mag,
    alt: o.alt,
    az: o.az,
    raHours: o.ra / 15,
    dec: o.dec,
    constellation: cst(o.ra / 15, o.dec),
    ref: o,
  }
}

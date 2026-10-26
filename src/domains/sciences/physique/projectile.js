import { GRAVITY_PRESETS } from './gravite'

/** Trajectoire d'un projectile sans frottement. */
export function projectile({ v0, angle, h0, g }) {
  const a = (angle * Math.PI) / 180
  const vx = v0 * Math.cos(a)
  const vy = v0 * Math.sin(a)
  const tFlight = (vy + Math.sqrt(vy * vy + 2 * g * h0)) / g
  const tApex = Math.max(0, vy / g)
  return {
    vx,
    vy,
    tFlight,
    tApex,
    range: vx * tFlight,
    hMax: h0 + (vy > 0 ? (vy * vy) / (2 * g) : 0),
    vImpact: Math.hypot(vx, vy - g * tFlight),
  }
}

export default {
  inputs: [
    { id: 'v0', label: 'Vitesse initiale', unit: 'm/s', value: '20' },
    { id: 'angle', label: 'Angle de tir', type: 'number', unit: '°', value: '45' },
    { id: 'h0', label: 'Hauteur de départ', unit: 'm', value: '0' },
    { id: 'g', label: 'Pesanteur g', unit: 'm/s²', value: '9.80665', presets: GRAVITY_PRESETS },
  ],
  compute(v) {
    if (!(v.g > 0) || v.h0 < 0) return { error: 'g doit être positif et la hauteur de départ positive ou nulle.' }
    const p = projectile(v)
    const ts = Array.from({ length: 81 }, (_, i) => (i / 80) * p.tFlight)
    return {
      results: [
        { label: 'Portée', value: p.range, unit: 'm', format: 'num', digits: 2, main: true },
        { label: 'Hauteur maximale', value: p.hMax, unit: 'm', format: 'num', digits: 2 },
        { label: 'Durée du vol', value: p.tFlight, unit: 's', format: 'num', digits: 3 },
        { label: 'Instant du sommet', value: p.tApex, unit: 's', format: 'num', digits: 3 },
        { label: "Vitesse à l'impact", value: p.vImpact, unit: 'm/s', format: 'num', digits: 2 },
      ],
      chart: {
        title: 'Trajectoire',
        x: { label: 'Distance (m)' },
        y: { label: 'Hauteur (m)', min: 0 },
        series: [{ name: 'Trajectoire', points: ts.map((t) => [p.vx * t, v.h0 + p.vy * t - 0.5 * v.g * t * t]) }],
        markers: [{ x: p.vx * p.tApex, y: p.hMax, label: 'sommet' }],
      },
    }
  },
  formulas: ['x = v₀ cos α · t', 'y = h₀ + v₀ sin α · t − ½ g t²', 'Portée (h₀ = 0) = v₀² sin 2α / g'],
  notes: ['Sans frottement, la portée est maximale pour un angle de 45° depuis le sol.'],
}

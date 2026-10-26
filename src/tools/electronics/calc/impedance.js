import { RlcSchema } from '../schemas.jsx'
const DEG = 180 / Math.PI

/** Impédance complexe d'un circuit R, L, C en série ou en parallèle à la fréquence f. */
export function impedance({ r, l, c, f, parallel }) {
  const w = 2 * Math.PI * f
  const parts = []
  if (r > 0) parts.push({ re: r, im: 0 })
  if (l > 0) parts.push({ re: 0, im: w * l })
  if (c > 0) parts.push({ re: 0, im: -1 / (w * c) })
  if (!parts.length) return null
  if (!parallel) return parts.reduce((a, b) => ({ re: a.re + b.re, im: a.im + b.im }), { re: 0, im: 0 })
  // Parallèle : somme des admittances 1/Z
  const y = parts.reduce(
    (acc, z) => {
      const d = z.re * z.re + z.im * z.im
      return { re: acc.re + z.re / d, im: acc.im - z.im / d }
    },
    { re: 0, im: 0 },
  )
  const d = y.re * y.re + y.im * y.im
  return { re: y.re / d, im: -y.im / d }
}

export default {
  schematic: RlcSchema,
  inputs: [
    {
      id: 'mode',
      label: 'Montage',
      type: 'choice',
      value: 'series',
      options: [
        { value: 'series', label: 'Série' },
        { value: 'parallel', label: 'Parallèle' },
      ],
    },
    { id: 'r', label: 'Résistance R', unit: 'Ω', value: '1k', optional: true },
    { id: 'l', label: 'Inductance L', unit: 'H', value: '10m', optional: true },
    { id: 'c', label: 'Capacité C', unit: 'F', value: '100n', optional: true },
    { id: 'f', label: 'Fréquence', unit: 'Hz', value: '1k' },
  ],
  compute(v) {
    const params = { r: v.r || 0, l: v.l || 0, c: v.c || 0, f: v.f, parallel: v.mode === 'parallel' }
    const z = impedance(params)
    if (!z) return { error: 'Renseignez au moins un composant.' }
    const mag = Math.hypot(z.re, z.im)
    const freqs = Array.from({ length: 81 }, (_, i) => v.f * 10 ** ((i - 40) / 20))
    return {
      results: [
        { label: 'Module |Z|', value: mag, unit: 'Ω', main: true },
        { label: 'Déphasage φ', value: Math.atan2(z.im, z.re) * DEG, unit: '°', format: 'num', digits: 2 },
        { label: 'Partie réelle', value: z.re, unit: 'Ω' },
        { label: 'Partie imaginaire', value: z.im, unit: 'Ω' },
        { label: 'Nature', value: Math.abs(z.im) < 1e-9 * mag ? 'résistive' : z.im > 0 ? 'inductive' : 'capacitive', format: 'text' },
      ],
      chart: {
        title: '|Z| selon la fréquence',
        x: { label: 'Fréquence (Hz)', log: true },
        y: { label: '|Z| (Ω)' },
        series: [{ name: '|Z|', points: freqs.map((f) => { const zz = impedance({ ...params, f }); return [f, Math.hypot(zz.re, zz.im)] }) }],
      },
    }
  },
  formulas: ['Z_R = R, Z_L = jωL, Z_C = 1/(jωC)', 'Série : Z = ΣZᵢ', 'Parallèle : 1/Z = Σ1/Zᵢ'],
  notes: ['Laissez vide un composant absent du circuit.'],
}

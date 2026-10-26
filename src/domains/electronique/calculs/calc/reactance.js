import { ReactanceSchema } from '../schemas.jsx'
export default {
  schematic: ReactanceSchema,
  inputs: [
    {
      id: 'type',
      label: 'Composant',
      type: 'choice',
      value: 'c',
      options: [
        { value: 'c', label: 'Condensateur' },
        { value: 'l', label: 'Inductance' },
      ],
    },
    { id: 'f', label: 'Fréquence', unit: 'Hz', value: '1k' },
    { id: 'c', label: 'Capacité', unit: 'F', value: '1µ', show: (v) => v.type === 'c' },
    { id: 'l', label: 'Inductance', unit: 'H', value: '10m', show: (v) => v.type === 'l' },
  ],
  compute(v) {
    const w = 2 * Math.PI * v.f
    const x = v.type === 'c' ? 1 / (w * v.c) : w * v.l
    const freqs = Array.from({ length: 61 }, (_, i) => v.f * 10 ** ((i - 30) / 15))
    return {
      results: [
        { label: v.type === 'c' ? 'Réactance capacitive Xc' : 'Réactance inductive Xl', value: x, unit: 'Ω', main: true },
        { label: 'Pulsation ω', value: w, unit: 'rad/s' },
      ],
      chart: {
        title: 'Réactance selon la fréquence',
        x: { label: 'Fréquence (Hz)', log: true },
        y: { label: 'X (Ω)' },
        series: [{ name: v.type === 'c' ? 'Xc' : 'Xl', points: freqs.map((f) => [f, v.type === 'c' ? 1 / (2 * Math.PI * f * v.c) : 2 * Math.PI * f * v.l]) }],
      },
    }
  },
  formulas: ['Xc = 1 / (2π f C)', 'Xl = 2π f L'],
}

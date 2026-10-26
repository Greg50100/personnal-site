import { RlcSchema } from '../schemas.jsx'
export default {
  schematic: RlcSchema,
  inputs: [
    { id: 'l', label: 'Inductance L', unit: 'H', value: '10m' },
    { id: 'c', label: 'Capacité C', unit: 'F', value: '100n' },
    { id: 'r', label: 'Résistance série R', unit: 'Ω', value: '10' },
  ],
  compute(v) {
    const f0 = 1 / (2 * Math.PI * Math.sqrt(v.l * v.c))
    const q = Math.sqrt(v.l / v.c) / v.r
    return {
      results: [
        { label: 'Fréquence de résonance f₀', value: f0, unit: 'Hz', main: true },
        { label: 'Facteur de qualité Q', value: q, format: 'auto', digits: 4 },
        { label: 'Bande passante (−3 dB)', value: f0 / q, unit: 'Hz' },
        { label: 'Impédance caractéristique √(L/C)', value: Math.sqrt(v.l / v.c), unit: 'Ω' },
        { label: 'Pulsation ω₀', value: 2 * Math.PI * f0, unit: 'rad/s' },
      ],
    }
  },
  formulas: ['f₀ = 1 / (2π √(LC))', 'Q = (1/R) × √(L/C)', 'BP = f₀ / Q'],
}

const TWO_PI = 2 * Math.PI

/** Gain (dB) d'un filtre passif du premier ordre (RC/RL) ou LC (second ordre, non amorti) à la fréquence f. */
export function filterGain(type, pass, fc, f) {
  const x = f / fc
  if (type === 'lc') {
    const h = pass === 'low' ? 1 / Math.abs(1 - x * x) : (x * x) / Math.abs(1 - x * x)
    return 20 * Math.log10(Math.min(h, 1e3))
  }
  const h = pass === 'low' ? 1 / Math.sqrt(1 + x * x) : x / Math.sqrt(1 + x * x)
  return 20 * Math.log10(h)
}

export default {
  inputs: [
    {
      id: 'type',
      label: 'Circuit',
      type: 'choice',
      value: 'rc',
      options: [
        { value: 'rc', label: 'RC' },
        { value: 'rl', label: 'RL' },
        { value: 'lc', label: 'LC' },
      ],
    },
    {
      id: 'pass',
      label: 'Type de filtre',
      type: 'choice',
      value: 'low',
      options: [
        { value: 'low', label: 'Passe-bas' },
        { value: 'high', label: 'Passe-haut' },
      ],
    },
    { id: 'r', label: 'Résistance R', unit: 'Ω', value: '1k', show: (v) => v.type !== 'lc' },
    { id: 'c', label: 'Capacité C', unit: 'F', value: '100n', show: (v) => v.type !== 'rl' },
    { id: 'l', label: 'Inductance L', unit: 'H', value: '10m', show: (v) => v.type !== 'rc' },
  ],
  compute(v) {
    const fc = v.type === 'rc' ? 1 / (TWO_PI * v.r * v.c) : v.type === 'rl' ? v.r / (TWO_PI * v.l) : 1 / (TWO_PI * Math.sqrt(v.l * v.c))
    const freqs = Array.from({ length: 121 }, (_, i) => fc * 10 ** ((i - 60) / 30))
    return {
      results: [
        { label: v.type === 'lc' ? 'Fréquence de coupure (résonance)' : 'Fréquence de coupure (−3 dB)', value: fc, unit: 'Hz', main: true },
        { label: 'Pulsation de coupure', value: TWO_PI * fc, unit: 'rad/s' },
        ...(v.type !== 'lc' ? [{ label: 'Constante de temps τ', value: v.type === 'rc' ? v.r * v.c : v.l / v.r, unit: 's' }] : []),
        { label: 'Pente', value: v.type === 'lc' ? '40 dB par décade' : '20 dB par décade', format: 'text' },
      ],
      chart: {
        title: 'Diagramme de Bode (gain)',
        x: { label: 'Fréquence (Hz)', log: true },
        y: { label: 'Gain (dB)', min: -60, max: v.type === 'lc' ? 20 : 3 },
        series: [{ name: 'Gain', points: freqs.map((f) => [f, Math.max(-60, filterGain(v.type, v.pass, fc, f))]) }],
        markers: [{ x: fc, y: v.type === 'lc' ? 0 : -3.01, label: 'fc' }],
      },
    }
  },
  formulas: ['RC : fc = 1 / (2π R C)', 'RL : fc = R / (2π L)', 'LC : f₀ = 1 / (2π √(LC))'],
  notes: ['Le filtre LC est représenté sans amortissement : en pratique la résistance de la source et de la charge limite le pic de résonance.'],
}

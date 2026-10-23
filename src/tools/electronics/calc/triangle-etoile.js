export default {
  inputs: [
    {
      id: 'dir',
      label: 'Conversion',
      type: 'choice',
      value: 'd2y',
      options: [
        { value: 'd2y', label: 'Triangle → étoile' },
        { value: 'y2d', label: 'Étoile → triangle' },
      ],
    },
    { id: 'a', label: (v) => (v?.dir === 'y2d' ? 'R1 (branche de A)' : 'Rab'), unit: 'Ω', value: '100' },
    { id: 'b', label: (v) => (v?.dir === 'y2d' ? 'R2 (branche de B)' : 'Rbc'), unit: 'Ω', value: '100' },
    { id: 'c', label: (v) => (v?.dir === 'y2d' ? 'R3 (branche de C)' : 'Rca'), unit: 'Ω', value: '100' },
  ],
  compute(v) {
    const { a, b, c } = v
    if (v.dir === 'd2y') {
      const s = a + b + c
      return {
        results: [
          { label: 'R1 (vers A)', value: (a * c) / s, unit: 'Ω', main: true },
          { label: 'R2 (vers B)', value: (a * b) / s, unit: 'Ω', main: true },
          { label: 'R3 (vers C)', value: (b * c) / s, unit: 'Ω', main: true },
        ],
      }
    }
    const p = a * b + b * c + c * a
    return {
      results: [
        { label: 'Rab', value: p / c, unit: 'Ω', main: true },
        { label: 'Rbc', value: p / a, unit: 'Ω', main: true },
        { label: 'Rca', value: p / b, unit: 'Ω', main: true },
      ],
    }
  },
  formulas: ['Δ → Y : R1 = Rab·Rca / (Rab + Rbc + Rca)', 'Y → Δ : Rab = (R1R2 + R2R3 + R3R1) / R3'],
  notes: ['Transformation de Kennelly. Trois résistances égales R en triangle équivalent à R/3 en étoile.'],
}

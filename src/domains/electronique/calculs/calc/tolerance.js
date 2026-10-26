export default {
  inputs: [
    { id: 'nominal', label: 'Valeur nominale', unit: 'Ω', value: '100', hint: 'Unité indicative : fonctionne pour tout composant' },
    { id: 'tol', label: 'Tolérance', type: 'number', unit: '%', value: '5', presets: [0.1, 1, 2, 5, 10, 20].map((t) => ({ label: `${String(t).replace('.', ',')} %`, value: String(t) })) },
  ],
  compute(v) {
    const delta = Math.abs(v.nominal * v.tol) / 100
    return {
      results: [
        { label: 'Valeur minimale', value: v.nominal - delta, unit: 'Ω', digits: 5, main: true },
        { label: 'Valeur maximale', value: v.nominal + delta, unit: 'Ω', digits: 5, main: true },
        { label: 'Écart absolu', value: delta, unit: 'Ω', digits: 4 },
      ],
    }
  },
  formulas: ['min = N × (1 − t/100)', 'max = N × (1 + t/100)'],
}

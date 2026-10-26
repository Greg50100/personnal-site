const WAVES = {
  sine: { label: 'Sinusoïdal', rms: 1 / Math.SQRT2, avg: 2 / Math.PI, shape: (t) => Math.sin(2 * Math.PI * t) },
  square: { label: 'Carré', rms: 1, avg: 1, shape: (t) => (t % 1 < 0.5 ? 1 : -1) },
  triangle: { label: 'Triangulaire', rms: 1 / Math.sqrt(3), avg: 0.5, shape: (t) => 1 - 4 * Math.abs(((t + 0.25) % 1) - 0.5) },
  saw: { label: 'Dent de scie', rms: 1 / Math.sqrt(3), avg: 0.5, shape: (t) => 2 * (t % 1) - 1 },
}

export default {
  inputs: [
    { id: 'wave', label: 'Forme du signal', type: 'choice', value: 'sine', options: Object.entries(WAVES).map(([value, w]) => ({ value, label: w.label })) },
    {
      id: 'kind',
      label: 'Valeur connue',
      type: 'choice',
      value: 'peak',
      options: [
        { value: 'peak', label: 'Crête' },
        { value: 'pp', label: 'Crête à crête' },
        { value: 'rms', label: 'Efficace' },
      ],
    },
    { id: 'x', label: 'Valeur', unit: 'V', value: '10' },
  ],
  compute(v) {
    const w = WAVES[v.wave]
    const peak = v.kind === 'peak' ? v.x : v.kind === 'pp' ? v.x / 2 : v.x / w.rms
    const ts = Array.from({ length: 201 }, (_, i) => (i / 200) * 2)
    return {
      results: [
        { label: 'Valeur efficace (RMS)', value: peak * w.rms, unit: 'V', main: true },
        { label: 'Valeur crête', value: peak, unit: 'V' },
        { label: 'Crête à crête', value: 2 * peak, unit: 'V' },
        { label: 'Valeur moyenne redressée', value: peak * w.avg, unit: 'V' },
        { label: 'Facteur de crête', value: 1 / w.rms, format: 'auto', digits: 4 },
        { label: 'Facteur de forme', value: w.rms / w.avg, format: 'auto', digits: 4 },
      ],
      chart: {
        title: 'Deux périodes du signal',
        x: { label: 'Périodes' },
        y: { label: 'Tension (V)' },
        series: [
          { name: 'Signal', points: ts.map((t) => [t, peak * w.shape(t)]) },
          { name: 'Valeur efficace', color: '#60a5fa', dashed: true, points: [[0, peak * w.rms], [2, peak * w.rms]] },
        ],
      },
    }
  },
  formulas: ['Sinus : Ueff = Û / √2', 'Triangle, dent de scie : Ueff = Û / √3', 'Carré : Ueff = Û'],
}

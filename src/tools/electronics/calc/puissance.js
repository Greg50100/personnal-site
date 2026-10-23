const DEG = 180 / Math.PI

export default {
  inputs: [
    {
      id: 'type',
      label: 'Réseau',
      type: 'choice',
      value: 'mono',
      options: [
        { value: 'dc', label: 'Continu' },
        { value: 'mono', label: 'Monophasé' },
        { value: 'tri', label: 'Triphasé' },
      ],
    },
    { id: 'u', label: 'Tension', unit: 'V', value: '230', hint: (v) => (v.type === 'tri' ? 'Tension entre phases (ex. 400 V)' : undefined) },
    { id: 'i', label: 'Courant', unit: 'A', value: '10' },
    { id: 'pf', label: 'Facteur de puissance cos φ', type: 'number', value: '0.85', show: (v) => v.type !== 'dc' },
  ],
  compute(v) {
    if (v.type === 'dc') {
      return {
        results: [
          { label: 'Puissance', value: v.u * v.i, unit: 'W', main: true },
          { label: 'Résistance équivalente', value: v.u / v.i, unit: 'Ω' },
          { label: 'Énergie en 1 heure', value: (v.u * v.i) / 1000, unit: 'kWh', format: 'num', digits: 3 },
        ],
      }
    }
    if (!(v.pf > 0 && v.pf <= 1)) return { error: 'cos φ doit être compris entre 0 et 1.' }
    const s = (v.type === 'tri' ? Math.sqrt(3) : 1) * v.u * v.i
    const phi = Math.acos(v.pf)
    return {
      results: [
        { label: 'Puissance active P', value: s * v.pf, unit: 'W', main: true },
        { label: 'Puissance apparente S', value: s, unit: 'VA' },
        { label: 'Puissance réactive Q', value: s * Math.sin(phi), unit: 'var' },
        { label: 'Déphasage φ', value: phi * DEG, unit: '°', format: 'num', digits: 1 },
        { label: 'Énergie en 1 heure', value: (s * v.pf) / 1000, unit: 'kWh', format: 'num', digits: 3 },
      ],
    }
  },
  formulas: ['Continu : P = U × I', 'Mono : S = U × I, P = S × cos φ', 'Tri : S = √3 × U × I', 'Q = S × sin φ'],
}

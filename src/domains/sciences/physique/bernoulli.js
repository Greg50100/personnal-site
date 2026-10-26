const G = 9.80665
const NAMES = { p1: 'P₁', v1: 'v₁', h1: 'h₁', p2: 'P₂', v2: 'v₂', h2: 'h₂' }
const UNITS = { p1: 'Pa', p2: 'Pa', v1: 'm/s', v2: 'm/s', h1: 'm', h2: 'm' }

export default {
  inputs: [
    { id: 'unknown', label: 'Inconnue', type: 'choice', value: 'p2', options: Object.entries(NAMES).map(([value, label]) => ({ value, label })) },
    { id: 'rho', label: 'Masse volumique ρ', unit: 'kg/m³', value: '1000', presets: [{ label: 'Eau', value: '1000' }, { label: 'Air', value: '1.204' }, { label: 'Huile', value: '900' }] },
    ...['p1', 'v1', 'h1', 'p2', 'v2', 'h2'].map((id) => ({
      id,
      label: `${NAMES[id]} (${id.startsWith('p') ? 'pression' : id.startsWith('v') ? 'vitesse' : 'altitude'}, point ${id[1]})`,
      unit: UNITS[id],
      value: { p1: '200k', v1: '2', h1: '0', p2: '150k', v2: '5', h2: '3' }[id],
      show: (v) => v.unknown !== id,
    })),
  ],
  compute(v) {
    const { rho } = v
    // Charge totale : P + ½ρv² + ρgh, identique aux deux points
    const head = (p, vel, h) => p + 0.5 * rho * vel * vel + rho * G * h
    let value
    if (v.unknown === 'p1') value = head(v.p2, v.v2, v.h2) - 0.5 * rho * v.v1 ** 2 - rho * G * v.h1
    if (v.unknown === 'p2') value = head(v.p1, v.v1, v.h1) - 0.5 * rho * v.v2 ** 2 - rho * G * v.h2
    if (v.unknown === 'h1') value = (head(v.p2, v.v2, v.h2) - v.p1 - 0.5 * rho * v.v1 ** 2) / (rho * G)
    if (v.unknown === 'h2') value = (head(v.p1, v.v1, v.h1) - v.p2 - 0.5 * rho * v.v2 ** 2) / (rho * G)
    if (v.unknown === 'v1' || v.unknown === 'v2') {
      const other = v.unknown === 'v1' ? 2 : 1
      const self = v.unknown === 'v1' ? 1 : 2
      const k = (2 / rho) * (head(v[`p${other}`], v[`v${other}`], v[`h${other}`]) - v[`p${self}`] - rho * G * v[`h${self}`])
      if (k < 0) return { error: 'Pas de solution physique (vitesse imaginaire) avec ces valeurs.' }
      value = Math.sqrt(k)
    }
    return { results: [{ label: NAMES[v.unknown], value, unit: UNITS[v.unknown], digits: 5, main: true }] }
  },
  formulas: ['P₁ + ½ρv₁² + ρgh₁ = P₂ + ½ρv₂² + ρgh₂'],
  notes: ['Fluide parfait, incompressible, en écoulement permanent le long d’une ligne de courant.'],
}

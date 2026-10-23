const VARS = { f: { label: 'Force F', unit: 'N' }, m: { label: 'Masse m', unit: 'kg' }, a: { label: 'Accélération a', unit: 'm/s²' } }

export default {
  inputs: [
    { id: 'unknown', label: 'Grandeur à calculer', type: 'choice', value: 'f', options: Object.entries(VARS).map(([value, x]) => ({ value, label: x.label })) },
    { id: 'f', label: 'Force F', unit: 'N', value: '100', show: (v) => v.unknown !== 'f' },
    { id: 'm', label: 'Masse m', unit: 'kg', value: '10', show: (v) => v.unknown !== 'm' },
    { id: 'a', label: 'Accélération a', unit: 'm/s²', value: '9.80665', show: (v) => v.unknown !== 'a' },
  ],
  compute(v) {
    const value = { f: v.m * v.a, m: v.f / v.a, a: v.f / v.m }[v.unknown]
    const x = VARS[v.unknown]
    const results = [{ label: x.label, value, unit: x.unit, digits: 5, main: true }]
    if (v.unknown === 'f') results.push({ label: 'En kilogrammes-force', value: value / 9.80665, unit: 'kgf', format: 'auto', digits: 5 })
    if (v.unknown === 'a') results.push({ label: 'En g', value: value / 9.80665, unit: 'g', format: 'auto', digits: 5 })
    return { results }
  },
  formulas: ['F = m × a'],
}

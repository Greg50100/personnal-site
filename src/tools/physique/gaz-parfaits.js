const R = 8.314462618 // J·mol⁻¹·K⁻¹

const VARS = {
  p: { label: 'Pression P', unit: 'Pa' },
  v: { label: 'Volume V', unit: 'm³' },
  n: { label: 'Quantité de matière n', unit: 'mol' },
  t: { label: 'Température T', unit: 'K' },
}

export default {
  inputs: [
    { id: 'unknown', label: 'Grandeur à calculer', type: 'choice', value: 'p', options: Object.entries(VARS).map(([value, x]) => ({ value, label: x.label.replace(/ [A-Za-z]$/, '') })) },
    { id: 'p', label: 'Pression P', unit: 'Pa', value: '101325', show: (v) => v.unknown !== 'p', hint: '1 atm = 101 325 Pa, 1 bar = 100k' },
    { id: 'v', label: 'Volume V', unit: 'm³', value: '22.4m', show: (v) => v.unknown !== 'v', hint: '1 L = 1m (millième de m³)' },
    { id: 'n', label: 'Quantité de matière n', unit: 'mol', value: '1', show: (v) => v.unknown !== 'n' },
    { id: 't', label: 'Température T', unit: 'K', value: '273.15', show: (v) => v.unknown !== 't', hint: 'T (K) = θ (°C) + 273,15' },
  ],
  compute(v) {
    const value = { p: (v.n * R * v.t) / v.v, v: (v.n * R * v.t) / v.p, n: (v.p * v.v) / (R * v.t), t: (v.p * v.v) / (v.n * R) }[v.unknown]
    const x = VARS[v.unknown]
    const results = [{ label: x.label, value, unit: x.unit, digits: 5, main: true }]
    if (v.unknown === 't') results.push({ label: 'En degrés Celsius', value: value - 273.15, unit: '°C', format: 'num', digits: 2 })
    if (v.unknown === 'v') results.push({ label: 'En litres', value: value * 1000, unit: 'L', format: 'auto', digits: 5 })
    if (v.unknown === 'p') results.push({ label: 'En bar', value: value / 1e5, unit: 'bar', format: 'auto', digits: 5 })
    return { results }
  },
  formulas: ['P V = n R T', 'R = 8,314 462 618 J·mol⁻¹·K⁻¹'],
}

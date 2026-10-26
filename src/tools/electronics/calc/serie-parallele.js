import { parseSI } from '../../../lib/si'
import { SerieParalleleSchema } from '../schemas.jsx'

const UNITS = { r: 'Ω', l: 'H', c: 'F' }

/** Équivalent série et parallèle d'une liste de composants. */
export function combine(values, kind) {
  const sum = values.reduce((a, b) => a + b, 0)
  const inv = 1 / values.reduce((a, b) => a + 1 / b, 0)
  // Les condensateurs s'additionnent en parallèle et suivent la loi inverse en série.
  return kind === 'c' ? { series: inv, parallel: sum } : { series: sum, parallel: inv }
}

export default {
  schematic: SerieParalleleSchema,
  inputs: [
    {
      id: 'kind',
      label: 'Composants',
      type: 'choice',
      value: 'r',
      options: [
        { value: 'r', label: 'Résistances' },
        { value: 'c', label: 'Condensateurs' },
        { value: 'l', label: 'Inductances' },
      ],
    },
    { id: 'list', label: 'Valeurs (séparées par des espaces ou des ;)', type: 'text', value: '1k 2k2 4k7', hint: 'Préfixes acceptés : p, n, µ/u, m, k, M…' },
  ],
  compute(v) {
    const parts = v.list.split(/[\s;]+/).filter(Boolean)
    const values = parts.map(parseSI)
    const bad = parts.filter((_, i) => !(values[i] > 0))
    if (!parts.length) return null
    if (bad.length) return { error: `Valeur non reconnue ou nulle : ${bad.join(', ')}` }
    const unit = UNITS[v.kind]
    const { series, parallel } = combine(values, v.kind)
    return {
      results: [
        { label: 'En série', value: series, unit, digits: 5, main: true },
        { label: 'En parallèle', value: parallel, unit, digits: 5, main: true },
        { label: 'Nombre de composants', value: String(values.length), format: 'text' },
      ],
    }
  },
  formulas: ['R, L série : X = X₁ + X₂ + …', 'R, L parallèle : 1/X = 1/X₁ + 1/X₂ + …', 'C série : 1/C = 1/C₁ + 1/C₂ + …', 'C parallèle : C = C₁ + C₂ + …'],
  notes: ['Deux résistances égales en parallèle valent la moitié de l’une d’elles.'],
}

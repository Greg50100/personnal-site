import { BobineSchema } from '../schemas.jsx'
export default {
  schematic: BobineSchema,
  inputs: [
    { id: 'n', label: 'Nombre de spires', type: 'number', value: '50' },
    { id: 'd', label: 'Diamètre de la bobine', unit: 'm', value: '20m', hint: 'Diamètre moyen, ex. 20m = 20 mm' },
    { id: 'len', label: "Longueur de l'enroulement", unit: 'm', value: '30m' },
  ],
  compute(v) {
    // Formule de Wheeler (bobine monocouche à air), dimensions en pouces → µH
    const dIn = v.d / 0.0254
    const lIn = v.len / 0.0254
    const r = dIn / 2
    const uh = (r * r * v.n * v.n) / (9 * r + 10 * lIn)
    return {
      results: [
        { label: 'Inductance', value: uh * 1e-6, unit: 'H', main: true },
        { label: 'Longueur de fil (approx.)', value: v.n * Math.PI * v.d, unit: 'm' },
        { label: 'Rapport longueur / diamètre', value: v.len / v.d, format: 'num', digits: 2, hint: v.len / v.d < 0.4 ? 'Formule moins précise pour une bobine courte' : undefined },
      ],
    }
  },
  formulas: ['Wheeler : L (µH) = r² N² / (9r + 10l)  (r, l en pouces)'],
  notes: ['Précision de l’ordre de 1 % pour une bobine monocouche à air dont la longueur dépasse 0,4 fois le diamètre.'],
}

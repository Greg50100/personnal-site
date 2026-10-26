import { closestInSeries } from '../eseries'
import { attenuator } from '../formulas'
import { AttenuateurSchema } from '../schemas.jsx'

/**
 * ATTÉNUATEUR RÉSISTIF ADAPTÉ (en T ou en π, symétrique)
 * K = 10^(A/20). En T : bras série R1 = Z₀ (K − 1)/(K + 1), branche R2 = 2 Z₀ K / (K² − 1).
 * En π : branches R1 = Z₀ (K + 1)/(K − 1), série R2 = Z₀ (K² − 1) / (2K).
 */

export default {
  schematic: AttenuateurSchema,
  inputs: [
    {
      id: 'topo',
      label: 'Montage',
      type: 'choice',
      value: 't',
      options: [
        { value: 't', label: 'En T' },
        { value: 'pi', label: 'En π' },
      ],
    },
    { id: 'z0', label: 'Impédance', unit: 'Ω', value: '50', presets: [{ label: '50 Ω', value: '50' }, { label: '75 Ω', value: '75' }, { label: '600 Ω', value: '600' }] },
    { id: 'db', label: 'Atténuation (dB)', type: 'number', value: '10' },
  ],
  compute(v) {
    if (!(v.z0 > 0) || !(v.db > 0)) return null
    const r = attenuator(v.z0, v.db, v.topo)
    const pi = v.topo === 'pi'
    return {
      results: [
        { label: pi ? 'R1 (chaque branche à la masse)' : 'R1 (chaque bras série)', value: pi ? r.shunt : r.series, unit: 'Ω', main: true, hint: `E96 : ${closestInSeries(pi ? r.shunt : r.series, 'E96')} Ω` },
        { label: pi ? 'R2 (série)' : 'R2 (vers la masse)', value: pi ? r.series : r.shunt, unit: 'Ω', main: true, hint: `E96 : ${closestInSeries(pi ? r.series : r.shunt, 'E96')} Ω` },
        { label: 'Rapport de tensions', value: 10 ** (-v.db / 20), format: 'auto', digits: 4 },
        { label: 'Rapport de puissances', value: 10 ** (-v.db / 10), format: 'auto', digits: 4 },
      ],
    }
  },
  formulas: [
    { f: 'K = 10^(A / 20)', ref: 'wiki' },
    { f: 'T : R1 = Z₀ (K − 1) / (K + 1) ; R2 = 2 Z₀ K / (K² − 1)', ref: 'wiki' },
    { f: 'π : R1 = Z₀ (K + 1) / (K − 1) ; R2 = Z₀ (K² − 1) / (2K)', ref: 'wiki' },
  ],
  notes: ['Adapté des deux côtés : l’entrée et la sortie présentent Z₀ quand l’autre côté est chargé par Z₀.', 'Pour une forte atténuation, mettre plusieurs cellules en cascade (les dB s’additionnent).'],
  references: [{ id: 'wiki', label: 'Attenuator (electronics) (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Attenuator_(electronics)' }],
}

import { ThermalSchema } from '../schemas.jsx'

/**
 * DISSIPATEUR THERMIQUE
 * Tj = Ta + P × (Rθjc + Rθcs + Rθsa) : la chaleur traverse en série jonction → boîtier → dissipateur → air.
 */

export const requiredSinkResistance = ({ p, ta, tj, rjc, rcs }) => (tj - ta) / p - rjc - rcs

export default {
  schematic: ThermalSchema,
  inputs: [
    { id: 'p', label: 'Puissance dissipée', unit: 'W', value: '5' },
    { id: 'ta', label: 'Température de l’air', type: 'number', unit: '°C', value: '40' },
    { id: 'tj', label: 'Température de jonction visée', type: 'number', unit: '°C', value: '110', presets: [{ label: '110 °C (marge)', value: '110' }, { label: '125 °C', value: '125' }, { label: '150 °C (max. courant)', value: '150' }] },
    { id: 'rjc', label: 'Rθ jonction-boîtier (fiche)', type: 'number', unit: '°C/W', value: '1.5' },
    {
      id: 'rcs',
      label: 'Rθ boîtier-dissipateur',
      type: 'number',
      unit: '°C/W',
      value: '0.5',
      presets: [
        { label: 'Pâte : 0,2', value: '0.2' },
        { label: 'Pâte + mica : 0,5', value: '0.5' },
        { label: 'Pad silicone : 1', value: '1' },
      ],
    },
    { id: 'rja', label: 'Rθ jonction-air sans dissipateur (fiche)', type: 'number', unit: '°C/W', value: '50', presets: [{ label: 'TO-220 : 50', value: '50' }, { label: 'TO-92 : 200', value: '200' }, { label: 'SOT-223 : 60 à 100', value: '80' }] },
  ],
  compute(v) {
    if (!(v.p > 0)) return null
    if (v.tj <= v.ta) return { error: 'La température de jonction doit dépasser celle de l’air.' }
    const bare = v.ta + v.p * v.rja
    const pMaxBare = (v.tj - v.ta) / v.rja
    const rsa = requiredSinkResistance(v)
    const needed = bare > v.tj
    return {
      results: [
        needed
          ? rsa > 0
            ? { label: 'Dissipateur nécessaire : Rθ au plus', value: rsa, unit: '°C/W', format: 'num', digits: 2, main: true }
            : { label: 'Dissipateur', value: 'impossible : réduire la puissance ou Rθ boîtier', format: 'text', main: true }
          : { label: 'Dissipateur', value: 'inutile', format: 'text', main: true, hint: `${bare.toFixed(0)} °C sans dissipateur` },
        { label: 'Jonction sans dissipateur', value: bare, unit: '°C', format: 'num', digits: 0, hint: needed ? 'trop chaud' : 'acceptable' },
        { label: 'Puissance max. sans dissipateur', value: pMaxBare, unit: 'W', format: 'num', digits: 2 },
        rsa > 0 && { label: 'Jonction avec ce dissipateur', value: v.ta + v.p * (v.rjc + v.rcs + rsa), unit: '°C', format: 'num', digits: 0 },
      ].filter(Boolean),
      notes: needed && rsa > 0 ? ['Choisir un dissipateur dont la résistance thermique (°C/W) est inférieure à cette valeur ; elle baisse avec la ventilation.'] : [],
    }
  },
  formulas: [
    { f: 'Tj = Ta + P × (Rθjc + Rθcs + Rθsa)', ref: 'spra953' },
    'Rθsa max = (Tj − Ta) / P − Rθjc − Rθcs',
    'Sans dissipateur : Tj = Ta + P × Rθja',
  ],
  notes: [
    'Rθjc et Rθja se lisent dans la fiche du composant (« thermal resistance »).',
    'Puissance d’un régulateur linéaire : P = (Vin − Vout) × I ; d’un MOSFET : P = RDS(on) × I².',
    'Garder de la marge : la durée de vie d’un semi-conducteur chute quand il chauffe.',
  ],
  references: [
    { id: 'spra953', label: 'Texas Instruments, Semiconductor and IC Package Thermal Metrics (SPRA953)', url: 'https://www.ti.com/lit/pdf/spra953' },
    { id: 'wiki', label: 'Thermal resistance (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Thermal_resistance' },
  ],
}

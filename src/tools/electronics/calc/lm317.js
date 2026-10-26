import { closestInSeries } from '../eseries'
import { LM317_VREF as VREF, lm317R2, lm317Vout } from '../formulas'
import { Lm317Schema } from '../schemas.jsx'

/**
 * RÉGULATEUR LM317
 * Vout = Vref × (1 + R2 / R1) + Iadj × R2, avec Vref = 1,25 V et Iadj ≈ 50 µA.
 * En source de courant : I = Vref / R.
 */

const DROPOUT = 3 // V, marge conseillée entre entrée et sortie

export default {
  schematic: Lm317Schema,
  inputs: [
    {
      id: 'mode',
      label: 'Montage',
      type: 'choice',
      value: 'r2',
      options: [
        { value: 'r2', label: 'Tension → R2' },
        { value: 'vout', label: 'R1, R2 → tension' },
        { value: 'current', label: 'Source de courant' },
      ],
    },
    { id: 'vout', label: 'Tension de sortie voulue', unit: 'V', value: '5', show: (v) => v.mode === 'r2' },
    { id: 'r1', label: 'R1 (entre OUT et ADJ)', unit: 'Ω', value: '240', show: (v) => v.mode !== 'current', presets: [{ label: '240 Ω', value: '240' }, { label: '120 Ω', value: '120' }] },
    { id: 'r2', label: 'R2 (entre ADJ et la masse)', unit: 'Ω', value: '720', show: (v) => v.mode === 'vout' },
    { id: 'iout', label: (v) => (v.mode === 'current' ? 'Courant voulu' : 'Courant de charge'), unit: 'A', value: '0.5' },
    { id: 'vin', label: 'Tension d’entrée', unit: 'V', value: '12' },
  ],
  compute(v) {
    if (v.mode === 'current') {
      if (!(v.iout > 0)) return null
      const r = VREF / v.iout
      const rStd = closestInSeries(r, 'E24')
      return {
        results: [
          { label: 'Résistance R', value: r, unit: 'Ω', main: true },
          { label: 'Valeur E24 la plus proche', value: rStd, unit: 'Ω', hint: `courant obtenu : ${(VREF / rStd).toFixed(3)} A` },
          { label: 'Puissance dans R', value: VREF * v.iout, unit: 'W' },
          { label: 'Tension max. aux bornes de la charge', value: v.vin - VREF - DROPOUT, unit: 'V' },
        ],
        notes: ['Le courant traverse R puis la charge, branchée entre ADJ (et R) et la masse : pour une LED de puissance, par exemple.'],
      }
    }
    if (!(v.r1 > 0)) return null
    const r2 = v.mode === 'r2' ? lm317R2(v.vout, v.r1) : v.r2
    if (!(r2 > 0)) return { error: 'La tension de sortie doit dépasser 1,25 V.' }
    const vout = lm317Vout(v.r1, r2)
    const r2Std = closestInSeries(r2, 'E24')
    const r2E96 = closestInSeries(r2, 'E96')
    const dropout = v.vin - vout
    const p = dropout * v.iout
    return {
      results: [
        v.mode === 'r2' ? { label: 'R2', value: r2, unit: 'Ω', main: true } : { label: 'Tension de sortie', value: vout, unit: 'V', main: true },
        v.mode === 'r2' && { label: 'R2 en E24', value: r2Std, unit: 'Ω', hint: `sortie : ${lm317Vout(v.r1, r2Std).toFixed(2)} V` },
        v.mode === 'r2' && { label: 'R2 en E96 (1 %)', value: r2E96, unit: 'Ω', hint: `sortie : ${lm317Vout(v.r1, r2E96).toFixed(3)} V` },
        { label: 'Écart entrée-sortie', value: dropout, unit: 'V', hint: dropout < DROPOUT ? 'insuffisant : 3 V au moins à pleine charge' : 'suffisant' },
        { label: 'Puissance dissipée', value: p, unit: 'W', hint: p > 1.5 ? 'dissipateur indispensable' : p > 0.5 ? 'dissipateur conseillé' : '' },
      ].filter(Boolean),
    }
  },
  formulas: [{ f: 'Vout = 1,25 V × (1 + R2 / R1) + Iadj × R2', ref: 'lm317' }, 'R2 = (Vout − 1,25) / (1,25 / R1 + Iadj), Iadj ≈ 50 µA', 'Source de courant : I = 1,25 V / R', 'P = (Vin − Vout) × I'],
  notes: [
    { text: 'R1 de 120 à 240 Ω assure le courant minimal de charge (environ 5 à 10 mA).', ref: 'lm317' },
    'Condensateurs : 100 nF en entrée, 1 µF (ou plus) en sortie ; 10 µF entre ADJ et la masse améliore la réjection d’ondulation.',
    'Même calcul pour le LM338 (5 A) et le LM350 (3 A). Calcul du dissipateur : outil Dissipateur thermique.',
  ],
  references: [{ id: 'lm317', label: 'Texas Instruments, LM317 3-Terminal Adjustable Regulator', detail: 'fiche technique', url: 'https://www.ti.com/lit/ds/symlink/lm317.pdf' }],
}

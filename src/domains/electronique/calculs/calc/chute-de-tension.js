import { MATERIALS, SECTIONS } from './cables'
import { CableSchema } from '../schemas.jsx'

export default {
  schematic: CableSchema,
  inputs: [
    { id: 'u', label: 'Tension de la source', unit: 'V', value: '12' },
    { id: 'i', label: 'Courant', unit: 'A', value: '5' },
    { id: 'len', label: 'Longueur du câble (aller simple)', unit: 'm', value: '10' },
    { id: 's', label: 'Section du conducteur', type: 'number', unit: 'mm²', value: '2.5', presets: SECTIONS.slice(2, 9).map((s) => ({ label: `${String(s).replace('.', ',')}`, value: String(s) })) },
    { id: 'mat', label: 'Matériau', type: 'choice', value: 'cu', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
    {
      id: 'circuit',
      label: 'Circuit',
      type: 'choice',
      value: '2',
      options: [
        { value: '2', label: 'Aller-retour (2 fils)' },
        { value: '1', label: 'Un seul conducteur' },
      ],
    },
  ],
  compute(v) {
    if (!(v.s > 0)) return { error: 'La section doit être positive.' }
    const length = v.len * Number(v.circuit)
    const r = (MATERIALS[v.mat].rho * length) / (v.s * 1e-6)
    const drop = v.i * r
    return {
      results: [
        { label: 'Chute de tension', value: drop, unit: 'V', main: true, hint: `${((drop / v.u) * 100).toFixed(2).replace('.', ',')} % de la tension` },
        { label: 'Tension disponible en bout de ligne', value: v.u - drop, unit: 'V' },
        { label: 'Résistance du câble', value: r, unit: 'Ω' },
        { label: 'Puissance perdue dans le câble', value: v.i * v.i * r, unit: 'W' },
      ],
      notes: [drop / v.u > 0.03 ? 'Au-delà de 3 % de chute, augmentez la section ou raccourcissez la ligne.' : 'Chute inférieure à 3 % : acceptable pour la plupart des usages.'],
    }
  },
  formulas: ['R = ρ × L / S', 'ΔU = R × I', 'ρ(Cu) = 1,68 × 10⁻⁸ Ω·m, ρ(Al) = 2,65 × 10⁻⁸ Ω·m'],
}

import { BjtSchema } from '../schemas.jsx'
export default {
  schematic: BjtSchema,
  inputs: [
    { id: 'vcc', label: 'Alimentation Vcc', unit: 'V', value: '12' },
    { id: 'r1', label: 'R1 (base → Vcc)', unit: 'Ω', value: '10k' },
    { id: 'r2', label: 'R2 (base → masse)', unit: 'Ω', value: '2k2' },
    { id: 'rc', label: 'Rc (collecteur)', unit: 'Ω', value: '1k' },
    { id: 're', label: 'Re (émetteur)', unit: 'Ω', value: '100' },
    { id: 'beta', label: 'Gain en courant β (hFE)', type: 'number', value: '100' },
    { id: 'vbe', label: 'Tension base-émetteur Vbe', unit: 'V', value: '0.7' },
  ],
  compute(v) {
    // Modèle de Thévenin du pont de base (plus précis que l'approximation « pont non chargé »)
    const vth = (v.vcc * v.r2) / (v.r1 + v.r2)
    const rth = (v.r1 * v.r2) / (v.r1 + v.r2)
    const ib = Math.max(0, (vth - v.vbe) / (rth + (v.beta + 1) * v.re))
    let ic = v.beta * ib
    const ie = ib + ic
    const ve = ie * v.re
    let vce = v.vcc - ic * v.rc - ve
    let region = 'active (amplification)'
    if (ib <= 0) {
      region = 'bloqué'
      ic = 0
      vce = v.vcc
    } else if (vce < 0.2) {
      region = 'saturé'
      vce = 0.2
      ic = (v.vcc - 0.2) / (v.rc + v.re)
    }
    return {
      results: [
        { label: 'Courant collecteur Ic', value: ic, unit: 'A', main: true },
        { label: 'Tension Vce', value: vce, unit: 'V', main: true },
        { label: 'Régime', value: region, format: 'text' },
        { label: 'Tension de base Vb', value: ib * rth > 0 ? vth - ib * rth : vth, unit: 'V' },
        { label: 'Tension émetteur Ve', value: ve, unit: 'V' },
        { label: 'Courant de base Ib', value: ib, unit: 'A' },
        { label: 'Puissance dissipée (Vce × Ic)', value: vce * ic, unit: 'W' },
      ],
    }
  },
  formulas: ['Vth = Vcc × R2 / (R1 + R2), Rth = R1 ∥ R2', 'Ib = (Vth − Vbe) / (Rth + (β+1) Re)', 'Ic = β Ib, Vce = Vcc − Ic Rc − Ie Re'],
  notes: ['Montage NPN à polarisation par pont diviseur et résistance d’émetteur.'],
}

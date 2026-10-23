export default {
  inputs: [
    { id: 'vin', label: "Tension d'entrée", unit: 'V', value: '12' },
    { id: 'vz', label: 'Tension Zener', unit: 'V', value: '5.1' },
    { id: 'rl', label: 'Résistance de charge', unit: 'Ω', value: '1k' },
    { id: 'pz', label: 'Puissance max. de la Zener', unit: 'W', value: '0.5' },
  ],
  compute(v) {
    if (v.vin <= v.vz) return { error: "La tension d'entrée doit dépasser la tension Zener." }
    const il = v.vz / v.rl
    const izMax = v.pz / v.vz
    const izMin = 0.1 * izMax // règle empirique : 10 % du courant maximal
    const rs = (v.vin - v.vz) / (il + izMin)
    const iz = (v.vin - v.vz) / rs - il
    const noLoad = (v.vin - v.vz) / rs
    return {
      results: [
        { label: 'Résistance série Rs', value: rs, unit: 'Ω', main: true },
        { label: 'Puissance dans Rs', value: (v.vin - v.vz) ** 2 / rs, unit: 'W' },
        { label: 'Courant de charge', value: il, unit: 'A' },
        { label: 'Courant Zener (en charge)', value: iz, unit: 'A' },
        { label: 'Courant Zener à vide', value: noLoad, unit: 'A', hint: noLoad > izMax ? 'dépasse le maximum : Zener à vide en danger' : 'dans les limites' },
        { label: 'Puissance Zener à vide', value: noLoad * v.vz, unit: 'W' },
      ],
    }
  },
  formulas: ['I_L = Vz / R_L', 'Iz_min ≈ 0,1 × Pz / Vz', 'Rs = (Vin − Vz) / (I_L + Iz_min)'],
}

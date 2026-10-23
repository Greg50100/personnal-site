export default {
  inputs: [
    { id: 'np', label: 'Spires au primaire Np', type: 'number', value: '1000' },
    { id: 'ns', label: 'Spires au secondaire Ns', type: 'number', value: '100' },
    { id: 'vp', label: 'Tension primaire Vp', unit: 'V', value: '230' },
    { id: 'is', label: 'Courant secondaire Is', unit: 'A', value: '2', optional: true },
  ],
  compute(v) {
    if (!(v.np > 0 && v.ns > 0)) return { error: 'Les nombres de spires doivent être positifs.' }
    const m = v.ns / v.np
    const vs = v.vp * m
    const results = [
      { label: 'Tension secondaire Vs', value: vs, unit: 'V', main: true },
      { label: 'Rapport de transformation m = Ns/Np', value: m, format: 'auto', digits: 5 },
      { label: 'Rapport des impédances (Np/Ns)²', value: (v.np / v.ns) ** 2, format: 'auto', digits: 5 },
      { label: 'Type', value: m > 1 ? 'élévateur' : m < 1 ? 'abaisseur' : "d'isolement", format: 'text' },
    ]
    if (Number.isFinite(v.is)) {
      results.push({ label: 'Courant primaire Ip', value: v.is * m, unit: 'A' })
      results.push({ label: 'Puissance apparente', value: vs * v.is, unit: 'VA' })
    }
    return { results }
  },
  formulas: ['Vs / Vp = Ns / Np = m', 'Ip / Is = m (transformateur parfait)', 'Zp = Zs / m²'],
  notes: ['Calcul pour un transformateur parfait : les pertes réelles réduisent la tension secondaire en charge de quelques pour cent.'],
}

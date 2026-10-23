export default {
  inputs: [
    { id: 'cap', label: 'Capacité de la batterie', type: 'number', unit: 'mAh', value: '2000' },
    { id: 'i', label: 'Consommation moyenne', type: 'number', unit: 'mA', value: '150' },
    { id: 'eff', label: 'Capacité réellement utilisable', type: 'number', unit: '%', value: '85', hint: 'Vieillissement, température, tension de coupure' },
    { id: 'v', label: 'Tension nominale', unit: 'V', value: '3.7', optional: true },
  ],
  compute(v) {
    if (!(v.i > 0)) return { error: 'La consommation doit être positive.' }
    const hours = (v.cap * (v.eff / 100)) / v.i
    const results = [
      { label: 'Autonomie estimée', value: hours, format: 'duration', main: true },
      { label: 'En heures', value: hours, unit: 'h', format: 'num', digits: 1 },
      { label: 'En jours', value: hours / 24, unit: 'j', format: 'num', digits: 2 },
    ]
    if (Number.isFinite(v.v)) results.push({ label: 'Énergie stockée', value: (v.cap / 1000) * v.v, unit: 'Wh', format: 'num', digits: 2 })
    return { results }
  },
  formulas: ['Autonomie (h) = Capacité (mAh) × rendement / Consommation (mA)'],
}

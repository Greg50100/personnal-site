export default {
  inputs: [
    { id: 'p', label: "Puissance de l'appareil", unit: 'W', value: '1500' },
    { id: 'h', label: "Durée d'utilisation par jour", type: 'number', unit: 'h', value: '2' },
    { id: 'price', label: 'Prix du kWh', type: 'number', unit: '€', value: '0.20', hint: 'Indiquez le prix TTC du kWh de votre contrat' },
  ],
  compute(v) {
    const kwhDay = (v.p * v.h) / 1000
    const day = kwhDay * v.price
    const money = (x) => `${x.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
    return {
      results: [
        { label: 'Coût par an', value: money(day * 365.25), format: 'text', main: true },
        { label: 'Coût par mois', value: money(day * 30.44), format: 'text' },
        { label: 'Coût par jour', value: money(day), format: 'text' },
        { label: 'Consommation par jour', value: kwhDay, unit: 'kWh', format: 'num', digits: 3 },
        { label: 'Consommation par an', value: kwhDay * 365.25, unit: 'kWh', format: 'num', digits: 0 },
      ],
    }
  },
  formulas: ['E (kWh) = P (W) × t (h) / 1000', 'Coût = E × prix du kWh'],
}

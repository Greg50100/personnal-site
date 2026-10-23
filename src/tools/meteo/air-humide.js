import { absoluteHumidity, dewPoint, enthalpy, humidityRatio, relativeHumidityFromDewPoint, saturationVaporPressure, specificVolume, wetBulb } from './psychro'

export default {
  inputs: [
    { id: 't', label: 'Température de l’air (sèche)', unit: '°C', type: 'number', value: '20' },
    { id: 'known', label: 'Humidité connue par', type: 'choice', value: 'rh', options: [{ value: 'rh', label: 'Humidité relative' }, { value: 'td', label: 'Point de rosée' }] },
    { id: 'rh', label: 'Humidité relative', unit: '%', type: 'number', value: '50', show: (v) => v.known === 'rh' },
    { id: 'td', label: 'Point de rosée', unit: '°C', type: 'number', value: '9.3', show: (v) => v.known === 'td' },
    { id: 'p', label: 'Pression atmosphérique', unit: 'hPa', type: 'number', value: '1013.25', hint: 'Pression locale (non ramenée au niveau de la mer)' },
  ],
  compute(v) {
    if (v.t < -40 || v.t > 60) return { error: 'Température hors du domaine de validité (−40 à +60 °C).' }
    const rh = v.known === 'rh' ? v.rh : relativeHumidityFromDewPoint(v.t, v.td)
    if (!(rh > 0 && rh <= 100)) return { error: v.known === 'rh' ? 'L’humidité relative doit être comprise entre 0 et 100 %.' : 'Le point de rosée ne peut pas dépasser la température de l’air.' }
    if (!(v.p > 100 && v.p < 1200)) return { error: 'Pression attendue en hPa (entre 100 et 1 200).' }
    const es = saturationVaporPressure(v.t)
    const e = (rh / 100) * es
    const w = humidityRatio(e, v.p)
    const results = [
      v.known === 'rh'
        ? { label: 'Point de rosée', value: dewPoint(v.t, rh), unit: '°C', format: 'num', digits: 1, main: true }
        : { label: 'Humidité relative', value: rh, unit: '%', format: 'num', digits: 1, main: true },
      { label: 'Température humide', value: wetBulb(v.t, e, v.p), unit: '°C', format: 'num', digits: 1, hint: 'Température de saturation adiabatique (bulbe humide)' },
      { label: 'Pression de vapeur saturante', value: es, unit: 'hPa', format: 'num', digits: 2 },
      { label: 'Pression partielle de vapeur', value: e, unit: 'hPa', format: 'num', digits: 2 },
      { label: 'Rapport de mélange', value: w * 1000, unit: 'g/kg air sec', format: 'num', digits: 2 },
      { label: 'Humidité absolue', value: absoluteHumidity(v.t, e), unit: 'g/m³', format: 'num', digits: 2 },
      { label: 'Enthalpie spécifique', value: enthalpy(v.t, w), unit: 'kJ/kg air sec', format: 'num', digits: 2 },
      { label: 'Volume spécifique', value: specificVolume(v.t, w, v.p), unit: 'm³/kg air sec', format: 'num', digits: 4 },
    ]
    // Courbe de saturation et point courant (diagramme de l'air humide simplifié)
    const sat = []
    for (let t = -10; t <= 45; t += 1) sat.push([t, humidityRatio(saturationVaporPressure(t), v.p) * 1000])
    const half = sat.map(([t]) => [t, humidityRatio(0.5 * saturationVaporPressure(t), v.p) * 1000])
    return {
      results,
      chart: {
        title: 'Diagramme de l’air humide (simplifié)',
        x: { label: 'Température sèche (°C)' },
        y: { label: 'Rapport de mélange (g/kg)', min: 0 },
        series: [
          { name: 'Saturation (100 %)', color: '#38bdf8', points: sat },
          { name: '50 %', color: '#94a3b8', points: half, dashed: true },
        ],
        markers: [{ x: v.t, y: w * 1000, label: 'Votre air', color: '#f59e0b' }],
      },
    }
  },
  formulas: [
    'es(T) = 6,1094 · exp(17,625 T / (T + 243,04))  (hPa, Magnus)',
    'e = HR · es(T) ;  Td = 243,04 · ln(e/6,1094) / (17,625 − ln(e/6,1094))',
    'w = 0,622 · e / (P − e) ;  h = 1,006 T + w (2 501 + 1,86 T)',
  ],
  notes: ['Formules valables au-dessus de l’eau liquide, de −40 à +60 °C. La température humide est la température de saturation adiabatique (méthode ASHRAE).'],
}

import { cloudBase, dewPoint, heatIndex, humidex, potentialTemperature, seaLevelPressure, standardPressure, windChill } from './psychro'
import { refs } from './references'

export default {
  inputs: [
    { id: 't', label: 'Température de l’air', unit: '°C', type: 'number', value: '30' },
    { id: 'rh', label: 'Humidité relative', unit: '%', type: 'number', value: '60' },
    { id: 'wind', label: 'Vent moyen (à 10 m)', unit: 'km/h', type: 'number', value: '10' },
    { id: 'p', label: 'Pression mesurée', unit: 'hPa', type: 'number', value: '1000', optional: true, hint: 'Facultatif : pression lue sur un baromètre non corrigé' },
    { id: 'h', label: 'Altitude du lieu', unit: 'm', type: 'number', value: '100' },
  ],
  compute(v) {
    if (!(v.rh > 0 && v.rh <= 100)) return { error: 'L’humidité relative doit être comprise entre 0 et 100 %.' }
    const td = dewPoint(v.t, v.rh)
    const results = []
    const hot = v.t >= 26.7
    const cold = v.t <= 10 && v.wind >= 4.8
    if (cold) results.push({ label: 'Refroidissement éolien', value: windChill(v.t, v.wind), unit: '°C', format: 'num', digits: 1, main: true })
    if (hot) results.push({ label: 'Indice de chaleur (NOAA)', value: heatIndex(v.t, v.rh), unit: '°C', format: 'num', digits: 1, main: !cold })
    results.push({ label: 'Humidex', value: humidex(v.t, td), unit: '', format: 'num', digits: 1, main: !hot && !cold, hint: 'Indice canadien : inconfort à partir de 30, danger au-delà de 40' })
    results.push({ label: 'Point de rosée', value: td, unit: '°C', format: 'num', digits: 1 })
    results.push({ label: 'Base des cumulus (≈)', value: cloudBase(v.t, td) + v.h, unit: 'm d’altitude', format: 'num', digits: 0, hint: '125 m par degré d’écart entre température et point de rosée' })
    results.push({ label: 'Pression standard à cette altitude', value: standardPressure(v.h), unit: 'hPa', format: 'num', digits: 1 })
    if (Number.isFinite(v.p) && v.p > 0) {
      results.push({ label: 'Pression ramenée au niveau de la mer', value: seaLevelPressure(v.p, v.h, v.t), unit: 'hPa', format: 'num', digits: 1 })
      results.push({ label: 'Température potentielle', value: potentialTemperature(v.t, v.p), unit: '°C', format: 'num', digits: 1 })
    }
    return {
      results,
      notes: [
        !hot && 'L’indice de chaleur ne s’applique qu’à partir de 27 °C environ.',
        !cold && 'Le refroidissement éolien ne s’applique qu’en dessous de 10 °C avec un vent d’au moins 4,8 km/h.',
      ].filter(Boolean),
    }
  },
  formulas: [
    { f: 'Indice de chaleur : 0,5 (F + 61 + 1,2 (F − 68) + 0,094 HR), moyenné avec F ; régression de Rothfusz si ≥ 80 °F', ref: ['noaa', 'rothfusz'] },
    { f: 'Humidex : T + 0,5555 (e − 10), e = 6,11 exp(5 417,753 (1/273,16 − 1/Td))', ref: 'masterton' },
    { f: 'Refroidissement éolien : 13,12 + 0,6215 T − 11,37 V^0,16 + 0,3965 T V^0,16', ref: ['windChillNws', 'osczevski'] },
    { f: 'Base des cumulus ≈ 125 m × (T − Td)', ref: ['amsLcl', 'lawrence'] },
    { f: 'Pression standard : 1 013,25 (1 − 2,25577·10⁻⁵ h)^5,25588', ref: ['ashrae', 'icao'] },
    { f: 'Pression au niveau de la mer : P (1 − 0,0065 h / (T + 0,0065 h + 273,15))^−5,257', ref: 'icao' },
    { f: 'Température potentielle : θ = T (1 000 / P)^0,2857', ref: 'amsTheta' },
  ],
  notes: [{ text: 'Point de rosée par la formule de Magnus (coefficients d’Alduchov et Eskridge), comme l’outil « Air humide ».', ref: 'alduchov' }],
  references: refs('noaa', 'rothfusz', 'masterton', 'windChillNws', 'osczevski', 'amsLcl', 'lawrence', 'ashrae', 'icao', 'amsTheta', 'alduchov'),
}

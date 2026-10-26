import { fmt } from '../../../lib/format'
import { cite, refs } from './references'
import * as TC from './thermal-comfort'

const REFS = refs(
  'tcCode',
  'tcDoc',
  'wahiduddin',
  'goffGratch',
  'dewWiki',
  'carnot',
  'bolton',
  'pon',
  'ashrae',
  'psychrolib',
  'noaa',
  'rothfusz',
  'humidexWiki',
  'masterton',
  'stull',
  'thom',
  'thermofeelDi',
  'epstein',
  'rsi',
  'scharlau',
  'simmer',
  'simmerScale',
  'windChillNws',
  'osczevski',
  'bom',
  'steadman',
  'fohm',
  'iso13788',
)
const c = (...ids) => cite(REFS, ...ids)

const num = (value, unit, digits = 1) => `${fmt(value, digits)}${unit ? ` ${unit}` : ''}`
/** Ligne de tableau pour un capteur à état texte : libellé français, état Home Assistant, renvoi. */
const stateRow = (name, labels, key, ref, extra = '') => [name, `${labels[key]}${extra}`, key, ref]

export default {
  inputs: [
    { id: 't', label: 'Température', unit: '°C', type: 'number', value: '21' },
    { id: 'rh', label: 'Humidité relative', unit: '%', type: 'number', value: '55' },
    { id: 'p', label: 'Pression atmosphérique', unit: 'hPa', type: 'number', value: '1013.25', hint: 'Sans capteur de pression, l’intégration prend 1 013,25 hPa' },
    { id: 'wind', label: 'Vent moyen (à 10 m)', unit: 'km/h', type: 'number', value: '', optional: true, hint: 'Pour le refroidissement éolien et la température apparente' },
    { id: 'to', label: 'Température extérieure', unit: '°C', type: 'number', value: '', optional: true, hint: 'Pour l’excès d’humidité et l’aération' },
    { id: 'rho', label: 'Humidité extérieure', unit: '%', type: 'number', value: '', optional: true },
  ],
  compute({ t, rh, p, wind, to, rho }) {
    if (!(rh > 0 && rh <= 100)) return { error: 'L’humidité relative doit être comprise entre 0 et 100 %.' }
    if (!(p >= 300 && p <= 1200)) return { error: 'Pression attendue en hPa (entre 300 et 1 200).' }
    const S = TC.STATES
    const td = TC.dewPoint(t, rh)
    const hx = TC.humidex(t, rh)
    const ah = TC.absoluteHumidity(t, rh)
    const fp = TC.frostPoint(t, rh)
    const frost = TC.frostRisk(t, rh)
    const tw = TC.wetBulb(t, rh)
    const hi = TC.heatIndex(t, rh)
    const thom = TC.thomsDiscomfort(t, rh)
    const rsi = TC.relativeStrain(t, rh)
    const summer = TC.summerScharlau(t, rh)
    const winter = TC.winterScharlau(t, rh)
    const si = TC.summerSimmer(t, rh)
    const vpd = TC.vaporPressureDeficit(t, rh)
    const hasWind = Number.isFinite(wind) && wind >= 0
    const hasOutdoor = Number.isFinite(to) && rho > 0 && rho <= 100

    const results = [
      { label: 'Humidex', value: hx, format: 'num', digits: 1, main: true, hint: S.humidex_perception[TC.humidexPerception(hx)] },
      { label: 'Point de rosée', value: td, unit: '°C', format: 'num', digits: 1, hint: S.dew_point_perception[TC.dewPointPerception(td)] },
      { label: 'Humidité absolue', value: ah, unit: 'g/m³', format: 'num', digits: 2 },
      { label: 'Risque de gelée', value: S.frost_risk[frost], format: 'text', hint: `Point de gelée ${num(fp, '°C')}` },
      { label: 'Indice de chaleur', value: hi, unit: '°C', format: 'num', digits: 1 },
      { label: 'Température humide', value: tw, unit: '°C', format: 'num', digits: 1, hint: 'Approximation de Stull (2011)' },
    ]

    const rows = [
      ['Point de rosée', num(td, '°C'), '—', c('wahiduddin', 'goffGratch')],
      stateRow('Sensation point de rosée', S.dew_point_perception, TC.dewPointPerception(td), c('dewWiki')),
      ['Point de gelée', num(fp, '°C'), '—', c('pon')],
      stateRow('Risque de gelée', S.frost_risk, frost, c('pon', 'tcCode')),
      ['Humidité absolue', num(ah, 'g/m³', 2), '—', c('carnot', 'bolton')],
      ['Rapport de mélange', num(TC.humidityRatioGrams(t, rh, p), 'g/kg', 2), '—', c('ashrae', 'psychrolib')],
      ['Déficit de pression de vapeur', num(vpd.deficit, 'kPa', 3), '—', c('ashrae')],
      ['Enthalpie spécifique', num(TC.moistAirEnthalpy(t, rh, p), 'kJ/kg', 2), '—', c('ashrae', 'psychrolib')],
      ['Indice de chaleur', num(hi, '°C'), '—', c('noaa', 'rothfusz')],
      ['Humidex', num(hx, ''), '—', c('humidexWiki', 'masterton')],
      stateRow('Sensation Humidex', S.humidex_perception, TC.humidexPerception(hx), c('humidexWiki')),
      ['Température humide', num(tw, '°C'), '—', c('stull')],
      ['Indice de Thom', num(thom.index, '', 2), '—', c('thom', 'thermofeelDi')],
      stateRow('Indice de Thom (THI)', S.thoms_discomfort_perception, thom.perception, c('thermofeelDi')),
      ['Indice d’Epstein et Moran (attribut)', num(thom.epsteinMoran, '', 2), '—', c('epstein')],
      stateRow('Confort Thermique Relatif', S.relative_strain_perception, rsi.perception, c('rsi'), ` (RSI ${fmt(rsi.index, 2)})`),
      stateRow('Sensation indice d’été de Scharlau', S.scharlau_perception, summer.perception, c('scharlau'), ` (${fmt(summer.index, 2)})`),
      stateRow('Sensation indice d’hiver de Scharlau', S.scharlau_perception, winter.perception, c('scharlau'), ` (${fmt(winter.index, 2)})`),
      ['Indice d’été Simmer', num(si, '°C'), '—', c('simmer')],
      stateRow('Sensation indice d’été Simmer', S.summer_simmer_perception, TC.summerSimmerPerception(si), c('simmerScale')),
    ]
    if (hasWind) {
      rows.push(['Refroidissement éolien', num(TC.windChill(t, wind), '°C'), '—', c('windChillNws', 'osczevski')])
      rows.push(['Température apparente', num(TC.apparentTemperature(t, rh, wind), '°C'), '—', c('bom', 'steadman')])
    }
    if (hasOutdoor) {
      const m = TC.moistureExcess(t, rh, to, rho)
      rows.push(['Excès d’humidité', num(m.excess, 'g/m³', 2), '—', c('fohm')])
      rows.push(['HR de l’air extérieur une fois réchauffé (attribut)', num(m.ventilatedRh, '%', 2), '—', c('tcDoc')])
      rows.push(stateRow('Conseil d’aération', S.ventilation_advice, TC.ventilationAdvice(m), c('iso13788', 'tcDoc')))
      rows.push(stateRow('Besoin de ventilation', S.ventilation_need, TC.ventilationNeed(m, to), c('fohm')))
    }

    return {
      results,
      table: { title: 'Tous les capteurs de l’intégration', columns: ['Capteur', 'Valeur', 'État HA', 'Réf.'], rows, wrap: [0, 1] },
      notes: [
        !hasWind && 'Renseignez le vent pour le refroidissement éolien et la température apparente.',
        !hasOutdoor && 'Renseignez la température et l’humidité extérieures pour l’excès d’humidité, le conseil d’aération et le besoin de ventilation.',
        'La colonne « État HA » donne l’état anglais du capteur, à utiliser dans les automatisations et les modèles.',
      ].filter(Boolean),
    }
  },
  formulas: [
    { f: 'Td : pws de Goff-Gratch (somme en log₁₀), puis Td = 241,88 g / (17,558 − g), g = ln(e / 0,61078 kPa)', ref: ['wahiduddin', 'goffGratch'] },
    { f: 'HA = 6,112 e^(17,67 T / (T + 243,5)) · HR · 2,1674 / (T + 273,15)', ref: ['carnot', 'bolton'] },
    { f: 'Point de gelée = Td + 2 671,02 / (2 954,61 / T + 2,193665 ln T − 13,3448) − T  (T, Td en K)', ref: 'pon' },
    { f: 'Gelée : T ≤ 1 et gelée ≤ 0 → haute probabilité (peu probable si HA ≤ 2,8) ; T ≤ 4, gelée ≤ 0,5 et HA > 2,8 → plausible', ref: ['pon', 'tcCode'] },
    { f: 'w = 0,621945 pw / (p − pw), pw = HR · pws (Hyland-Wexler) ; h = 1,006 T + w (2 501 + 1,86 T)', ref: ['ashrae', 'psychrolib'] },
    { f: 'VPD = pws (1 − HR / 100)', ref: 'ashrae' },
    { f: 'Indice de chaleur : 0,5 (F + 61 + 1,2 (F − 68) + 0,094 HR), régression de Rothfusz si > 79 °F', ref: ['noaa', 'rothfusz'] },
    { f: 'Humidex = T + 0,5555 (6,11 e^(5 417,753 (1/273,16 − 1/Td)) − 10)', ref: ['humidexWiki', 'masterton'] },
    { f: 'Tw = T atan(0,151977 √(HR + 8,313659)) + atan(T + HR) − atan(HR − 1,676331) + 0,00391838 HR^1,5 atan(0,023101 HR) − 4,686035', ref: 'stull' },
    { f: 'THI = T − 0,55 (1 − 0,01 HR)(T − 14,5) ; Epstein-Moran = 0,5 Tw + 0,5 T', ref: ['thom', 'thermofeelDi', 'epstein'] },
    { f: 'RSI = (T − 21) / (58 − e), e = HR · 6,112 · 10^(7,5 T / (237,7 + T)) / 100', ref: 'rsi' },
    { f: 'Scharlau été = −17,089 ln HR + 94,979 − T ; hiver = T − (−0,0003 HR² + 0,1497 HR − 7,7133)', ref: 'scharlau' },
    { f: 'Simmer (°F) = 1,98 (F − (0,55 − 0,0055 HR)(F − 58)) − 56,83', ref: ['simmer', 'simmerScale'] },
    { f: 'Refroidissement éolien = 13,12 + 0,6215 T − 11,37 V^0,16 + 0,3965 T V^0,16', ref: ['windChillNws', 'osczevski'] },
    { f: 'Température apparente = T + 0,33 e − 0,70 v − 4,00 (v en m/s)', ref: ['bom', 'steadman'] },
    { f: 'Excès = HA intérieure − HA extérieure ; HR après aération = HRext · es(Text) / es(T)', ref: ['fohm', 'tcDoc'] },
  ],
  notes: [
    { text: 'Formules, constantes et seuils repris à l’identique du code de l’intégration Thermal Comfort ; les tests du site les comparent aux valeurs calculées par ce code.', ref: 'tcCode' },
    { text: 'Indice de chaleur : l’intégration compare la formule simple directement à 79 °F, alors que la NWS la moyenne d’abord avec la température. Entre 26 et 28 °C, la valeur peut donc différer de l’outil « Ressenti ».', ref: ['tcCode', 'noaa'] },
    { text: 'L’enthalpie prend la saturation sur la glace sous 0 °C, le rapport de mélange et le déficit de vapeur sur l’eau.', ref: 'tcDoc' },
    'Libellés : ceux de la traduction française de l’intégration ; le conseil d’aération et le besoin de ventilation, pas encore traduits, sont traduits par le site.',
  ],
  references: REFS,
}

import { BTU, CAL, CURIE, FT, HOUR, IN, LB, PI } from './constants'
import { si, u } from './helpers'

const T = 'Thermique'
const E = 'Électricité et magnétisme'
const L = 'Lumière et rayonnements'

export default [
  // --- Thermique ---
  {
    id: 'ecart-temperature',
    family: T,
    label: 'Écart de température',
    defaults: ['k', 'df'],
    units: [u('k', 'kelvin (= degré Celsius d’écart)', 'K', 1), u('dc', 'degré Celsius (écart)', 'Δ°C', 1), u('df', 'degré Fahrenheit (écart)', 'Δ°F', 5 / 9), u('dr', 'degré Rankine (écart)', 'Δ°R', 5 / 9)],
  },
  {
    id: 'conductivite-thermique',
    family: T,
    label: 'Conductivité thermique',
    defaults: ['wmk', 'btuhftf'],
    units: [
      u('wmk', 'watt par mètre-kelvin', 'W/(m·K)', 1),
      u('mwmk', 'milliwatt par mètre-kelvin', 'mW/(m·K)', 1e-3),
      u('wcmk', 'watt par centimètre-kelvin', 'W/(cm·K)', 100),
      u('kcalhmc', 'kilocalorie par heure-mètre-°C', 'kcal/(h·m·°C)', (CAL * 1000) / HOUR),
      u('btuhftf', 'BTU par heure-pied-°F', 'BTU/(h·ft·°F)', BTU / HOUR / FT / (5 / 9)),
      u('btuinhft2f', 'BTU·pouce par heure-pied²-°F', 'BTU·in/(h·ft²·°F)', (BTU * IN) / HOUR / FT ** 2 / (5 / 9)),
    ],
  },
  {
    id: 'transmission-thermique',
    family: T,
    label: 'Coefficient de transmission thermique (U)',
    defaults: ['wm2k', 'btuhft2f'],
    units: [u('wm2k', 'watt par mètre carré-kelvin', 'W/(m²·K)', 1), u('kcalhm2c', 'kilocalorie par heure-m²-°C', 'kcal/(h·m²·°C)', (CAL * 1000) / HOUR), u('btuhft2f', 'BTU par heure-pied²-°F', 'BTU/(h·ft²·°F)', BTU / HOUR / FT ** 2 / (5 / 9))],
  },
  {
    id: 'resistance-thermique',
    family: T,
    label: 'Résistance thermique surfacique (R)',
    defaults: ['m2kw', 'rus'],
    units: [u('m2kw', 'mètre carré-kelvin par watt', 'm²·K/W', 1), u('rus', 'valeur R (US) : ft²·°F·h/BTU', 'ft²·°F·h/BTU', (FT ** 2 * (5 / 9) * HOUR) / BTU), u('clo', 'clo (vêtements)', 'clo', 0.155), u('tog', 'tog', 'tog', 0.1)],
  },
  {
    id: 'flux-thermique',
    family: T,
    label: 'Densité de flux thermique (éclairement énergétique)',
    defaults: ['wm2', 'btuhft2'],
    units: [u('wm2', 'watt par mètre carré', 'W/m²', 1), u('kwm2', 'kilowatt par mètre carré', 'kW/m²', 1e3), u('wcm2', 'watt par centimètre carré', 'W/cm²', 1e4), u('mwcm2', 'milliwatt par cm²', 'mW/cm²', 10), u('btuhft2', 'BTU par heure-pied carré', 'BTU/(h·ft²)', BTU / HOUR / FT ** 2), u('solar', 'constante solaire', 'S☉', 1361)],
  },
  {
    id: 'capacite-thermique',
    family: T,
    label: 'Capacité thermique massique',
    defaults: ['jkgk', 'calgc'],
    units: [u('jkgk', 'joule par kilogramme-kelvin', 'J/(kg·K)', 1), u('kjkgk', 'kilojoule par kilogramme-kelvin', 'kJ/(kg·K)', 1000), u('jgk', 'joule par gramme-kelvin', 'J/(g·K)', 1000), u('calgc', 'calorie par gramme-°C', 'cal/(g·°C)', CAL * 1000), u('btulbf', 'BTU par livre-°F', 'BTU/(lb·°F)', BTU / LB / (5 / 9))],
  },
  {
    id: 'entropie',
    family: T,
    label: 'Capacité thermique et entropie',
    defaults: ['jk', 'calk'],
    units: [u('jk', 'joule par kelvin', 'J/K', 1), u('kjk', 'kilojoule par kelvin', 'kJ/K', 1000), u('calk', 'calorie par kelvin', 'cal/K', CAL), u('btuf', 'BTU par °F', 'BTU/°F', BTU / (5 / 9))],
  },

  // --- Électricité et magnétisme ---
  { id: 'tension', family: E, label: 'Tension électrique', defaults: ['v', 'kv'], units: [...si('V', 'volt', 'M k _ m µ n'), u('statv', 'statvolt', 'statV', 299.792458), u('abv', 'abvolt', 'abV', 1e-8)] },
  { id: 'courant', family: E, label: 'Courant électrique', defaults: ['ma', 'a'], units: [...si('A', 'ampère', 'k _ m µ n p'), u('abamp', 'abampère (biot)', 'abA', 10), u('statamp', 'statampère', 'statA', 3.33564e-10)] },
  { id: 'resistance', family: E, label: 'Résistance électrique', defaults: ['kohm', 'ohm'], units: [...si('Ω', 'ohm', 'G M k _ m µ').map((x) => ({ ...x, id: `${x.id.replace('Ω', '').replace('µ', 'u')}ohm` })), u('abohm', 'abohm', 'abΩ', 1e-9), u('statohm', 'statohm', 'statΩ', 8.987551787e11)] },
  { id: 'conductance', family: E, label: 'Conductance électrique', defaults: ['ms', 's'], units: [...si('S', 'siemens', 'k _ m µ n'), u('mho', 'mho', '℧', 1)] },
  { id: 'charge', family: E, label: 'Charge électrique', defaults: ['mah', 'c'], units: [...si('C', 'coulomb', 'k _ m µ n p'), u('mah', 'milliampère-heure', 'mAh', 3.6), u('ah', 'ampère-heure', 'Ah', HOUR), u('e', 'charge élémentaire', 'e', 1.602176634e-19), u('faraday', 'faraday', 'F (charge)', 96_485.33212), u('statc', 'statcoulomb', 'statC', 3.33564e-10)] },
  { id: 'capacite', family: E, label: 'Capacité électrique', defaults: ['uf', 'nf'], units: [...si('F', 'farad', '_ m µ n p'), u('abf', 'abfarad', 'abF', 1e9), u('statf', 'statfarad', 'statF', 1.11265e-12)] },
  { id: 'inductance', family: E, label: 'Inductance', defaults: ['mh', 'uh'], units: [...si('H', 'henry', '_ m µ n'), u('abh', 'abhenry', 'abH', 1e-9)] },
  { id: 'flux-magnetique', family: E, label: 'Flux magnétique', defaults: ['wb', 'mx'], units: [...si('Wb', 'weber', '_ m µ'), u('mx', 'maxwell', 'Mx', 1e-8), u('vs', 'volt-seconde', 'V·s', 1)] },
  { id: 'induction-magnetique', family: E, label: 'Induction magnétique (champ B)', defaults: ['t', 'g'], units: [...si('T', 'tesla', '_ m µ n'), u('g', 'gauss', 'G', 1e-4), u('mg', 'milligauss', 'mG', 1e-7), u('gamma', 'gamma', 'γ', 1e-9)] },
  { id: 'champ-magnetique', family: E, label: 'Excitation magnétique (champ H)', defaults: ['am', 'oe'], units: [u('am', 'ampère par mètre', 'A/m', 1), u('kam', 'kiloampère par mètre', 'kA/m', 1000), u('oe', 'œrsted', 'Oe', 1000 / (4 * PI)), u('atm_turn', 'ampère-tour par mètre', 'At/m', 1)] },
  { id: 'force-magnetomotrice', family: E, label: 'Force magnétomotrice', defaults: ['at', 'gb'], units: [u('at', 'ampère-tour', 'At', 1), u('a', 'ampère', 'A', 1), u('gb', 'gilbert', 'Gb', 10 / (4 * PI))] },
  { id: 'champ-electrique', family: E, label: 'Champ électrique', defaults: ['vm', 'kvcm'], units: [u('vm', 'volt par mètre', 'V/m', 1), u('kvm', 'kilovolt par mètre', 'kV/m', 1e3), u('vcm', 'volt par centimètre', 'V/cm', 100), u('kvcm', 'kilovolt par centimètre', 'kV/cm', 1e5), u('vmm', 'volt par millimètre', 'V/mm', 1e3), u('vmil', 'volt par mil', 'V/mil', 1 / (IN / 1000))] },
  { id: 'resistivite', family: E, label: 'Résistivité électrique', defaults: ['ohmm', 'ohmmm2m'], units: [u('ohmm', 'ohm-mètre', 'Ω·m', 1), u('ohmcm', 'ohm-centimètre', 'Ω·cm', 0.01), u('ohmmm2m', 'ohm-mm² par mètre', 'Ω·mm²/m', 1e-6), u('uohmcm', 'microhm-centimètre', 'µΩ·cm', 1e-8), u('nohmm', 'nanohm-mètre', 'nΩ·m', 1e-9)] },
  { id: 'conductivite', family: E, label: 'Conductivité électrique', defaults: ['sm', 'uscm'], units: [u('sm', 'siemens par mètre', 'S/m', 1), u('mssm', 'millisiemens par mètre', 'mS/m', 1e-3), u('scm', 'siemens par centimètre', 'S/cm', 100), u('mscm', 'millisiemens par centimètre', 'mS/cm', 0.1), u('uscm', 'microsiemens par centimètre', 'µS/cm', 1e-4), u('msm2m', 'mégasiemens par mètre', 'MS/m', 1e6)] },
  { id: 'densite-courant', family: E, label: 'Densité de courant', defaults: ['amm2', 'acm2'], units: [u('am2', 'ampère par mètre carré', 'A/m²', 1), u('acm2', 'ampère par centimètre carré', 'A/cm²', 1e4), u('amm2', 'ampère par millimètre carré', 'A/mm²', 1e6), u('ain2', 'ampère par pouce carré', 'A/in²', 1 / IN ** 2)] },
  { id: 'moment-dipolaire', family: E, label: 'Moment dipolaire électrique', defaults: ['debye', 'cm'], units: [u('cm', 'coulomb-mètre', 'C·m', 1), u('debye', 'debye', 'D', 3.33564e-30), u('eangstrom', 'charge élémentaire × ångström', 'e·Å', 1.602176634e-29)] },

  // --- Lumière et rayonnements ---
  { id: 'flux-lumineux', family: L, label: 'Flux lumineux', defaults: ['lm', 'klm'], units: [u('lm', 'lumen', 'lm', 1), u('klm', 'kilolumen', 'klm', 1000), u('cdsr', 'candela-stéradian', 'cd·sr', 1), u('w555', 'watt lumineux à 555 nm', 'W (555 nm)', 683)] },
  { id: 'eclairement', family: L, label: 'Éclairement lumineux', defaults: ['lx', 'fc'], units: [u('lx', 'lux', 'lx', 1), u('klx', 'kilolux', 'klx', 1000), u('fc', 'foot-candle', 'fc', 1 / FT ** 2), u('ph', 'phot', 'ph', 1e4), u('nox', 'nox', 'nx', 1e-3)] },
  { id: 'luminance', family: L, label: 'Luminance', defaults: ['nit', 'fl'], units: [u('nit', 'candela par mètre carré (nit)', 'cd/m²', 1), u('cdcm2', 'candela par centimètre carré', 'cd/cm²', 1e4), u('sb', 'stilb', 'sb', 1e4), u('fl', 'foot-lambert', 'fL', 3.4262590996), u('la', 'lambert', 'L', 1e4 / PI), u('asb', 'apostilb', 'asb', 1 / PI)] },
  { id: 'intensite-lumineuse', family: L, label: 'Intensité lumineuse', defaults: ['cd', 'mcd'], units: [u('cd', 'candela', 'cd', 1), u('mcd', 'millicandela', 'mcd', 1e-3), u('kcd', 'kilocandela', 'kcd', 1e3), u('cp', 'candlepower', 'cp', 0.981), u('hk', 'bougie Hefner', 'HK', 0.903)] },
  { id: 'angle-solide', family: L, label: 'Angle solide', defaults: ['sr', 'deg2'], units: [u('sr', 'stéradian', 'sr', 1), u('msr', 'millistéradian', 'msr', 1e-3), u('deg2', 'degré carré', 'deg²', (PI / 180) ** 2), u('arcmin2', "minute d'arc carrée", 'arcmin²', (PI / 10_800) ** 2), u('sphere', 'sphère', 'sphère', 4 * PI), u('hemi', 'hémisphère', 'hémisphère', 2 * PI)] },
  { id: 'radioactivite', family: L, label: 'Activité radioactive', defaults: ['bq', 'ci'], units: [...si('Bq', 'becquerel', 'T G M k _'), u('ci', 'curie', 'Ci', CURIE), u('mci', 'millicurie', 'mCi', CURIE * 1e-3), u('uci', 'microcurie', 'µCi', CURIE * 1e-6), u('rd', 'rutherford', 'Rd', 1e6), u('dpm', 'désintégration par minute', 'dpm', 1 / 60)] },
  { id: 'dose-absorbee', family: L, label: 'Dose absorbée', defaults: ['gy', 'rad'], units: [u('gy', 'gray', 'Gy', 1), u('mgy', 'milligray', 'mGy', 1e-3), u('ugy', 'microgray', 'µGy', 1e-6), u('rad', 'rad', 'rad', 0.01), u('mrad', 'millirad', 'mrad', 1e-5), u('jkg', 'joule par kilogramme', 'J/kg', 1)] },
  { id: 'dose-equivalente', family: L, label: 'Dose équivalente', defaults: ['msv', 'rem'], units: [u('sv', 'sievert', 'Sv', 1), u('msv', 'millisievert', 'mSv', 1e-3), u('usv', 'microsievert', 'µSv', 1e-6), u('rem', 'rem', 'rem', 0.01), u('mrem', 'millirem', 'mrem', 1e-5), u('banana', 'dose « équivalent banane »', 'BED', 1e-7)] },
  { id: 'debit-dose', family: L, label: 'Débit de dose', defaults: ['usvh', 'mremh'], units: [u('svh', 'sievert par heure', 'Sv/h', 1 / HOUR), u('msvh', 'millisievert par heure', 'mSv/h', 1e-3 / HOUR), u('usvh', 'microsievert par heure', 'µSv/h', 1e-6 / HOUR), u('msvan', 'millisievert par an', 'mSv/an', 1e-3 / (365.25 * 86_400)), u('remh', 'rem par heure', 'rem/h', 0.01 / HOUR), u('mremh', 'millirem par heure', 'mrem/h', 1e-5 / HOUR), u('gys', 'gray par seconde', 'Gy/s', 1)] },
  { id: 'exposition', family: L, label: 'Exposition (rayons X et γ)', defaults: ['r', 'ckg'], units: [u('ckg', 'coulomb par kilogramme', 'C/kg', 1), u('mckg', 'millicoulomb par kilogramme', 'mC/kg', 1e-3), u('r', 'röntgen', 'R', 2.58e-4), u('mr', 'milliröntgen', 'mR', 2.58e-7)] },
]

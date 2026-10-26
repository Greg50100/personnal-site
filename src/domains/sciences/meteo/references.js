/**
 * Sources des formules de la rubrique Météo, partagées par les calculateurs (champ `references` des specs).
 * Chaque entrée : { id, label, detail?, url? } ; les DOI sont donnés sous forme de lien doi.org.
 */
const R = {
  alduchov: {
    label: 'Alduchov O. A., Eskridge R. E. (1996), « Improved Magnus form approximation of saturation vapor pressure », J. Appl. Meteor. 35, 601–609',
    detail: 'coefficients 6,1094 hPa, 17,625 et 243,04 °C (éq. 21)',
    url: 'https://doi.org/10.1175/1520-0450(1996)035%3C0601:IMFAOS%3E2.0.CO;2',
  },
  ashrae: {
    label: 'ASHRAE Handbook — Fundamentals (2017 et 2021), chapitre 1 « Psychrometrics »',
    detail: 'éq. 3 (atmosphère standard), 5 et 6 (Hyland-Wexler), 20 et 22 (rapport de mélange), 26 (volume), 30 (enthalpie), 33 et 35 (température humide), 36 (point de rosée)',
  },
  psychrolib: {
    label: 'Meyer D., Thevenard D. (2019), « PsychroLib: a library of psychrometric functions to calculate thermodynamic properties of air », J. Open Source Softw. 4(33), 1137',
    detail: 'implémentation libre des équations ASHRAE, numéros d’équation en commentaire du code',
    url: 'https://doi.org/10.21105/joss.01137',
  },
  amsAbsolute: {
    label: 'American Meteorological Society, Glossary of Meteorology : « Absolute humidity »',
    detail: 'ρv = e / (Rv T), Rv = 461,5 J kg⁻¹ K⁻¹',
    url: 'https://glossary.ametsoc.org/wiki/Absolute_humidity',
  },
  lawrence: {
    label: 'Lawrence M. G. (2005), « The relationship between relative humidity and the dewpoint temperature in moist air », Bull. Amer. Meteor. Soc. 86, 225–233',
    detail: 'conversions humidité relative ↔ point de rosée, base des cumulus',
    url: 'https://doi.org/10.1175/BAMS-86-2-225',
  },
  noaa: {
    label: 'NOAA / NWS Weather Prediction Center, « The Heat Index Equation »',
    detail: 'formule simple, moyenne avec T, régression complète si ≥ 80 °F, deux ajustements',
    url: 'https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml',
  },
  rothfusz: {
    label: 'Rothfusz L. P. (1990), « The heat index equation », NWS Southern Region Technical Attachment SR 90-23',
    url: 'https://www.weather.gov/media/bgm/ta_htindx.PDF',
  },
  masterton: {
    label: 'Masterton J. M., Richardson F. A. (1979), « Humidex: a method of quantifying human discomfort due to excessive heat and humidity », Environnement Canada, CLI 1-79',
    url: 'https://publications.gc.ca/site/eng/9.865813/publication.html',
  },
  humidexWiki: {
    label: 'Wikipédia (simple) : « Humidex », formule et échelle de sensation',
    detail: 'source citée par Thermal Comfort',
    url: 'https://simple.wikipedia.org/wiki/Humidex#Humidex_formula',
  },
  windChillNws: {
    label: 'NWS, « Wind Chill » (formule JAG/TI de 2001, en °C et km/h)',
    url: 'https://www.weather.gov/media/epz/wxcalc/windChill.pdf',
  },
  osczevski: {
    label: 'Osczevski R., Bluestein M. (2005), « The new wind chill equivalent temperature chart », Bull. Amer. Meteor. Soc. 86(10), 1453–1458',
    url: 'https://doi.org/10.1175/BAMS-86-10-1453',
  },
  icao: {
    label: 'OACI, Manuel de l’atmosphère type (Doc 7488/3, 1993)',
    detail: '1 013,25 hPa et 15 °C au niveau de la mer, gradient 0,0065 K/m, exposant g/(R L) ≈ 5,256',
  },
  amsTheta: {
    label: 'American Meteorological Society, Glossary of Meteorology : « Potential temperature »',
    detail: 'θ = T (p₀/p)^κ, κ = R/cp ≈ 0,286, p₀ = 1 000 hPa',
    url: 'https://glossary.ametsoc.org/wiki/Potential_temperature',
  },
  amsLcl: {
    label: 'American Meteorological Society, Glossary of Meteorology : « Lifting condensation level »',
    detail: 'règle d’Espy : environ 125 m par °C d’écart entre température et point de rosée',
    url: 'https://glossary.ametsoc.org/wiki/Lifting_condensation_level',
  },

  // Thermal Comfort
  tcCode: {
    label: 'dolezsa/thermal_comfort, intégration Home Assistant : code des calculs (sensor.py, commit 7422cb0)',
    detail: 'référence des formules, constantes et seuils reproduits ici',
    url: 'https://github.com/dolezsa/thermal_comfort/blob/7422cb09fb56cb63a3a9da2a1f8f6366407eeeee/custom_components/thermal_comfort/sensor.py',
  },
  tcDoc: {
    label: 'dolezsa/thermal_comfort : documentation des capteurs',
    url: 'https://github.com/dolezsa/thermal_comfort/blob/master/documentation/sensors.md',
  },
  wahiduddin: {
    label: 'Wahiduddin, « Calculating the density of air », algorithmes de pression de vapeur et de point de rosée',
    detail: 'source citée par Thermal Comfort pour le point de rosée',
    url: 'http://wahiduddin.net/calc/density_algorithms.htm',
  },
  goffGratch: {
    label: 'Goff J. A., Gratch S. (1946), « Low-pressure properties of water from −160 to 212 °F », Trans. ASHVE 52, 95–122',
    detail: 'pression de vapeur saturante sur l’eau (somme en log₁₀)',
  },
  dewWiki: {
    label: 'Wikipédia (anglais) : « Dew point », tableau des sensations',
    detail: 'source citée par Thermal Comfort pour la sensation',
    url: 'https://en.wikipedia.org/wiki/Dew_point',
  },
  carnot: {
    label: 'Carnot Cycle (2012), « How to convert relative humidity to absolute humidity »',
    detail: 'HA = 6,112 e^(17,67 T/(T+243,5)) × HR × 2,1674 / (273,15 + T)',
    url: 'https://carnotcycle.wordpress.com/2012/08/04/how-to-convert-relative-humidity-to-absolute-humidity/',
  },
  bolton: {
    label: 'Bolton D. (1980), « The computation of equivalent potential temperature », Mon. Wea. Rev. 108, 1046–1053',
    detail: 'éq. 10 : es = 6,112 exp(17,67 T / (T + 243,5)) hPa',
    url: 'https://doi.org/10.1175/1520-0493(1980)108%3C1046:TCOEPT%3E2.0.CO;2',
  },
  pon: {
    label: 'pon.fr, « dzVents : alerte givre et calcul de l’humidité absolue »',
    detail: 'point de gelée et seuil de 2,8 g/m³ du risque de gelée',
    url: 'https://pon.fr/dzvents-alerte-givre-et-calcul-humidite-absolue/',
  },
  rsi: {
    label: 'thermofeel (ECMWF), « Relative Strain Index »',
    detail: 'RSI = (T − 21) / (58 − e), e en hPa ; indice de Lee et Henschel (1966)',
    url: 'https://thermofeel.readthedocs.io/en/2.3.0/guide/relativestrainindex/',
  },
  scharlau: {
    label: 'Rusănescu C. O., Rusănescu M., Jinescu C., Paraschiv G. (2019), « Influence of thermal comfort on health », Revista de Chimie 70(4), 1187–1191',
    detail: 'indices de Scharlau d’été et d’hiver, source citée par Thermal Comfort ; DOI 10.37358/RC.19.4.7089',
    url: 'https://revistadechimie.ro/pdf/16%20RUSANESCU%204%2019.pdf',
  },
  simmer: {
    label: 'vCalc, « Summer Simmer Index » (formule de J. W. Pepi, en °F)',
    url: 'https://www.vcalc.com/wiki/rklarsen/Summer+Simmer+Index',
  },
  simmerScale: {
    label: 'summersimmer.com, échelle de sensation de l’indice Summer Simmer',
    url: 'http://summersimmer.com/default.asp',
  },
  stull: {
    label: 'Stull R. (2011), « Wet-bulb temperature from relative humidity and air temperature », J. Appl. Meteor. Climatol. 50, 2267–2269',
    detail: 'valable de 5 à 99 % et de −20 à 50 °C, au niveau de la mer',
    url: 'https://doi.org/10.1175/JAMC-D-11-0143.1',
  },
  thom: {
    label: 'Thom E. C. (1959), « The discomfort index », Weatherwise 12(2), 57–61',
    url: 'https://doi.org/10.1080/00431672.1959.9926960',
  },
  thermofeelDi: {
    label: 'thermofeel (ECMWF), « Discomfort Index » : forme à l’humidité relative et catégories de Giles et al. (1990)',
    url: 'https://thermofeel.readthedocs.io/en/2.3.0/guide/discomfortindex/',
  },
  epstein: {
    label: 'Epstein Y., Moran D. S. (2006), « Thermal comfort and the heat stress indices », Industrial Health 44, 388–398',
    detail: 'DI = 0,5 Tw + 0,5 T',
    url: 'https://doi.org/10.2486/indhealth.44.388',
  },
  fohm: {
    label: 'Folkhälsomyndigheten (agence suédoise de santé publique), FoHMFS 2014:18, recommandations sur la température et l’humidité intérieures',
    detail: 'excès d’humidité de 3 g/m³ au plus en hiver dans les logements',
    url: 'https://www.folkhalsomyndigheten.se/contentassets/641784832543443ea4eebe9b300c244e/fohmfs-2014-18.pdf',
  },
  iso13788: {
    label: 'ISO 13788:2012 (EN ISO 13788), performance hygrothermique des composants et parois de bâtiments',
    detail: 'humidité superficielle critique de 80 % (moisissures)',
    url: 'https://www.iso.org/standard/51615.html',
  },
  bom: {
    label: 'Bureau of Meteorology (Australie), « Thermal Comfort observations » : température apparente',
    detail: 'AT = T + 0,33 e − 0,70 v − 4,00, v en m/s à 10 m',
    url: 'http://www.bom.gov.au/info/thermal_stress/',
  },
  steadman: {
    label: 'Steadman R. G. (1994), « Norms of apparent temperature in Australia », Aust. Met. Mag. 43, 1–16',
  },
}

/** Liste de références pour une spec, dans l'ordre donné. */
export const refs = (...ids) => ids.map((id) => ({ id, ...R[id] }))

/** Renvoi « [n, m] » pour un tableau de résultats, d'après l'ordre d'une liste de références. */
export const cite = (list, ...ids) => `[${ids.map((id) => list.findIndex((r) => r.id === id) + 1).join(', ')}]`

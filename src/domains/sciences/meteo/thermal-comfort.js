/**
 * Formules de l'intégration Home Assistant « Thermal Comfort » (dolezsa/thermal_comfort, fichier
 * custom_components/thermal_comfort/sensor.py au commit 7422cb0), reproduites à l'identique : mêmes constantes,
 * mêmes seuils, mêmes cas particuliers. Les tests comparent ces fonctions aux valeurs calculées par le code Python
 * de l'intégration (thermal-comfort.fixture.json).
 * Unités : températures en °C, humidité relative en %, pression en hPa, vent en km/h.
 */

/** Pression standard utilisée sans capteur de pression (101 325 Pa). */
export const STANDARD_PRESSURE = 1013.25

const toF = (c) => c * 1.8 + 32
const toC = (f) => (f - 32) / 1.8
/** Arrondi à 2 décimales, comme round(x, 2) en Python pour les attributs. */
const round2 = (x) => Number(x.toFixed(2))

/** Pression de vapeur saturante (hPa), formule de Magnus de Bolton (1980). */
export const magnusPressure = (t) => 6.112 * Math.exp((17.67 * t) / (243.5 + t))

/** Pression de vapeur saturante (Pa), ASHRAE Fundamentals 2021 éq. 5 (glace, sous 0 °C) et 6 (eau). */
export function ashraePressure(t, overWater = false) {
  const T = t + 273.15
  if (T < 273.15 && !overWater) {
    return Math.exp(-5.6745359e3 / T + 6.3925247 - 9.677843e-3 * T + 6.2215701e-7 * T ** 2 + 2.0747825e-9 * T ** 3 - 9.484024e-13 * T ** 4 + 4.1635019 * Math.log(T))
  }
  return Math.exp(-5.8002206e3 / T + 1.3914993 - 4.8640239e-2 * T + 4.1764768e-5 * T ** 2 - 1.4452093e-8 * T ** 3 + 6.5459673 * Math.log(T))
}

/** Rapport de mélange (kg/kg), ASHRAE éq. 22 puis 20 ; p en hPa. */
export function humidityRatio(t, rh, p = STANDARD_PRESSURE, overWater = false) {
  const pw = (rh / 100) * ashraePressure(t, overWater)
  return (0.621945 * pw) / (p * 100 - pw)
}

/** Point de rosée (°C) : pression saturante de Goff-Gratch, puis inverse d'une formule de type Magnus (wahiduddin.net). */
export function dewPoint(t, rh) {
  const a0 = 373.15 / (273.15 + t)
  let sum = -7.90298 * (a0 - 1)
  sum += 5.02808 * Math.log10(a0)
  sum += -1.3816e-7 * (10 ** (11.344 * (1 - 1 / a0)) - 1)
  sum += 8.1328e-3 * (10 ** (-3.49149 * (a0 - 1)) - 1)
  sum += Math.log10(1013.246)
  const vp = 10 ** (sum - 3) * rh
  const g = Math.log(vp / 0.61078)
  return (241.88 * g) / (17.558 - g)
}

/** Indice de chaleur (°C) : formule simple, régression de Rothfusz si le résultat dépasse 79 °F, puis ajustements. */
export function heatIndex(t, rh) {
  const f = toF(t)
  let hi = 0.5 * (f + 61 + (f - 68) * 1.2 + rh * 0.094)
  if (hi > 79) {
    hi =
      -42.379 + 2.04901523 * f + 10.14333127 * rh - 0.22475541 * f * rh - 0.00683783 * f ** 2 - 0.05481717 * rh ** 2 +
      0.00122874 * f ** 2 * rh + 0.00085282 * f * rh ** 2 - 0.00000199 * f ** 2 * rh ** 2
  }
  if (rh < 13 && f >= 80 && f <= 112) hi -= (13 - rh) * 0.25 * Math.sqrt((17 - Math.abs(f - 95)) * 0.05882)
  else if (rh > 85 && f >= 80 && f <= 87) hi += (rh - 85) * 0.1 * ((87 - f) * 0.2)
  return toC(hi)
}

/** Humidex, calculé à partir du point de rosée ci-dessus. */
export function humidex(t, rh) {
  const e = 6.11 * Math.exp(5417.753 * (1 / 273.16 - 1 / (dewPoint(t, rh) + 273.15)))
  return t + 0.5555 * (e - 10)
}

export function humidexPerception(h) {
  if (h > 54) return 'heat_stroke'
  if (h >= 45) return 'dangerous_discomfort'
  if (h >= 40) return 'great_discomfort'
  if (h >= 35) return 'evident_discomfort'
  if (h >= 30) return 'noticable_discomfort'
  return 'comfortable'
}

export function dewPointPerception(td) {
  if (td < 10) return 'dry'
  if (td < 13) return 'very_comfortable'
  if (td < 16) return 'comfortable'
  if (td < 18) return 'ok_but_humid'
  if (td < 21) return 'somewhat_uncomfortable'
  if (td < 24) return 'quite_uncomfortable'
  if (td < 26) return 'extremely_uncomfortable'
  return 'severely_high'
}

/** Humidité absolue (g/m³), d'après carnotcycle.wordpress.com. */
export const absoluteHumidity = (t, rh) => (magnusPressure(t) * rh * 2.1674) / (t + 273.15)

/** Point de gelée (°C), d'après pon.fr. */
export function frostPoint(t, rh) {
  const T = t + 273.15
  const Td = dewPoint(t, rh) + 273.15
  return Td + 2671.02 / (2954.61 / T + 2.193665 * Math.log(T) - 13.3448) - T - 273.15
}

/** Risque de gelée à partir de la température, du point de gelée et de l'humidité absolue (seuil 2,8 g/m³). */
export function frostRisk(t, rh) {
  const ah = absoluteHumidity(t, rh)
  const fp = frostPoint(t, rh)
  if (t <= 1 && fp <= 0) return ah <= 2.8 ? 'unlikely' : 'high'
  if (t <= 4 && fp <= 0.5 && ah > 2.8) return 'probable'
  return 'no_risk'
}

/** Indice de contrainte relative (RSI), valable de 26 à 35 °C. */
export function relativeStrain(t, rh) {
  const vp = 6.112 * 10 ** ((7.5 * t) / (237.7 + t))
  const e = (rh * vp) / 100
  const index = round2((t - 21) / (58 - e))
  let perception
  if (t < 26 || t > 35) perception = 'outside_calculable_range'
  else if (index >= 0.45) perception = 'extreme_discomfort'
  else if (index >= 0.35) perception = 'significant_discomfort'
  else if (index >= 0.25) perception = 'discomfort'
  else if (index >= 0.15) perception = 'slight_discomfort'
  else perception = 'comfortable'
  return { index, perception }
}

function scharlauPerception(index, outside) {
  if (outside) return 'outside_calculable_range'
  if (index <= -3) return 'highly_uncomfortable'
  if (index <= -1) return 'moderately_uncomfortable'
  if (index < 0) return 'slightly_uncomfortable'
  return 'comfortable'
}

/** Indice d'été de Scharlau, valable de 17 à 39 °C avec au moins 30 % d'humidité. */
export function summerScharlau(t, rh) {
  const index = -17.089 * Math.log(rh) + 94.979 - t
  return { index: round2(index), perception: scharlauPerception(index, t < 17 || t > 39 || rh < 30) }
}

/** Indice d'hiver de Scharlau, valable de −5 à 6 °C avec au moins 40 % d'humidité. */
export function winterScharlau(t, rh) {
  const index = t - (-0.0003 * rh ** 2 + 0.1497 * rh - 7.7133)
  return { index: round2(index), perception: scharlauPerception(index, t < -5 || t > 6 || rh < 40) }
}

/** Indice d'été Simmer (°C) ; la température de l'air sous 58 °F (14,4 °C). */
export function summerSimmer(t, rh) {
  const f = toF(t)
  const si = f < 58 ? f : 1.98 * (f - (0.55 - 0.0055 * rh) * (f - 58)) - 56.83
  return toC(si)
}

export function summerSimmerPerception(si) {
  if (si < 21.1) return 'cool'
  if (si < 25) return 'slightly_cool'
  if (si < 28.3) return 'comfortable'
  if (si < 32.8) return 'slightly_warm'
  if (si < 37.8) return 'increasing_discomfort'
  if (si < 44.4) return 'extremely_warm'
  if (si < 51.7) return 'danger_of_heatstroke'
  if (si < 65.6) return 'extreme_danger_of_heatstroke'
  return 'circulatory_collapse_imminent'
}

/** Enthalpie de l'air humide (kJ/kg d'air sec), ASHRAE éq. 30 ; saturation sur la glace sous 0 °C. */
export function moistAirEnthalpy(t, rh, p = STANDARD_PRESSURE) {
  const w = humidityRatio(t, rh, p)
  return 1.006 * t + w * (2501 + 1.86 * t)
}

/** Rapport de mélange (g/kg d'air sec), humidité relative rapportée à l'eau à toute température. */
export const humidityRatioGrams = (t, rh, p = STANDARD_PRESSURE) => humidityRatio(t, rh, p, true) * 1000

/** Déficit de pression de vapeur de l'air (kPa), pressions sur l'eau. */
export function vaporPressureDeficit(t, rh) {
  const saturation = ashraePressure(t, true) / 1000
  const vaporPressure = (rh / 100) * saturation
  return { deficit: saturation - vaporPressure, vaporPressure, saturation }
}

/** Température humide (°C), approximation de Stull (2011), bornée entre le point de rosée et la température. */
export function wetBulb(t, rh) {
  const tw =
    t * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(t + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * rh ** 1.5 * Math.atan(0.023101 * rh) -
    4.686035
  return Math.min(Math.max(tw, dewPoint(t, rh)), t)
}

/** Indice d'inconfort de Thom (forme à l'humidité relative) et forme d'Epstein et Moran. */
export function thomsDiscomfort(t, rh) {
  const index = t - 0.55 * (1 - 0.01 * rh) * (t - 14.5)
  let perception
  if (index >= 32) perception = 'dangerous'
  else if (index >= 29) perception = 'everyone'
  else if (index >= 27) perception = 'most'
  else if (index >= 24) perception = 'more_than_half'
  else if (index >= 21) perception = 'less_than_half'
  else perception = 'no_discomfort'
  return { index, epsteinMoran: round2(0.5 * wetBulb(t, rh) + 0.5 * t), perception }
}

/** Excès d'humidité (g/m³) de la pièce sur l'air extérieur, et humidité relative de l'air extérieur une fois réchauffé. */
export function moistureExcess(t, rh, to, rho) {
  const outdoor = absoluteHumidity(to, rho)
  const ventilated = (rho * magnusPressure(to)) / magnusPressure(t)
  return {
    excess: absoluteHumidity(t, rh) - outdoor,
    outdoorAbsoluteHumidity: round2(outdoor),
    outdoorDewPoint: round2(dewPoint(to, rho)),
    ventilatedRh: round2(Math.min(ventilated, 100)),
  }
}

/** Conseil d'aération : bande de ±1 g/m³, risque de condensation si l'air extérieur réchauffé atteint 80 % (EN ISO 13788). */
export function ventilationAdvice({ excess, ventilatedRh }) {
  if (ventilatedRh >= 80) return 'condensation_risk'
  if (excess > 1) return 'drier_outside'
  if (excess < -1) return 'more_humid_outside'
  return 'similar'
}

/** Besoin de ventilation : plus de 3 g/m³ d'excès quand il fait moins de 10 °C dehors (FoHMFS 2014:18). */
export function ventilationNeed({ excess }, to) {
  if (to >= 10) return 'not_winter'
  return excess > 3 ? 'above_limit' : 'within_limit'
}

/** Refroidissement éolien (JAG/TI 2001), vent à 10 m en km/h ; la température de l'air au-dessus de 10 °C ou sous 4,8 km/h. */
export function windChill(t, v) {
  if (t > 10 || v <= 4.8) return t
  const k = v ** 0.16
  return 13.12 + 0.6215 * t - 11.37 * k + 0.3965 * t * k
}

/** Température apparente de Steadman (1994) sans rayonnement, comme le Bureau of Meteorology ; vent en km/h. */
export function apparentTemperature(t, rh, v) {
  const e = (rh / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t))
  return t + 0.33 * e - 0.7 * (v / 3.6) - 4
}

/**
 * Libellés français des états : ceux de la traduction française de l'intégration (translations/fr.json) ;
 * les capteurs récents n'y ont pas encore de libellé (marqués « site »), la traduction est alors celle du site.
 */
export const STATES = {
  dew_point_perception: {
    dry: 'Un peu sec pour certains',
    very_comfortable: 'Très confortable',
    comfortable: 'Confortable',
    ok_but_humid: 'OK pour la plupart, mais humide',
    somewhat_uncomfortable: 'Un peu inconfortable',
    quite_uncomfortable: 'Très humide, assez inconfortable',
    extremely_uncomfortable: 'Extrêmement inconfortable, oppressant',
    severely_high: 'Gravement élevé, voire mortel pour les maladies liées à l’asthme',
  },
  frost_risk: { no_risk: 'Aucun risque', unlikely: 'Peu probable', probable: 'Plausible', high: 'Haute probabilité' },
  humidex_perception: {
    comfortable: 'Confortable',
    noticable_discomfort: 'Inconfortable',
    evident_discomfort: 'Très désagréable. Ralentir l’effort physique',
    great_discomfort: 'Malaise généralisé. Danger. Réduire considérablement l’effort physique',
    dangerous_discomfort: 'Danger extrême. Arrêter tout effort physique',
    heat_stroke: 'Coup de chaleur, danger de mort',
  },
  relative_strain_perception: {
    outside_calculable_range: 'En dehors de la plage calculable',
    comfortable: 'Confortable',
    slight_discomfort: 'Légèrement inconfortable',
    discomfort: 'Inconfortable',
    significant_discomfort: 'Inconfort important',
    extreme_discomfort: 'Inconfort extrême',
  },
  scharlau_perception: {
    outside_calculable_range: 'En dehors de la plage calculable',
    comfortable: 'Confortable',
    slightly_uncomfortable: 'Légèrement inconfortable',
    moderately_uncomfortable: 'Modérément inconfortable',
    highly_uncomfortable: 'Très inconfortable',
  },
  summer_simmer_perception: {
    cool: 'Froid',
    slightly_cool: 'Légèrement froid',
    comfortable: 'Confortable',
    slightly_warm: 'Légèrement chaud',
    increasing_discomfort: 'Chaud',
    extremely_warm: 'Très chaud',
    danger_of_heatstroke: 'Extrêmement chaud',
    extreme_danger_of_heatstroke: 'Danger extrême de coup de chaleur',
    circulatory_collapse_imminent: 'Arrêt cardiaque imminent',
  },
  thoms_discomfort_perception: {
    no_discomfort: 'Pas de gêne',
    less_than_half: 'Moins de la moitié de la population ressent un inconfort',
    more_than_half: 'Plus de la moitié de la population ressent un inconfort',
    most: 'La plupart des individus ressentent un inconfort et une détérioration des conditions psychophysiques',
    everyone: 'Tout le monde ressent un inconfort important',
    dangerous: 'Dangereux, inconfort très important qui peut causer des coups de chaleur',
  },
  // Libellés du site (pas encore traduits dans l'intégration)
  ventilation_advice: {
    drier_outside: 'Aérer assèche la pièce',
    similar: 'Aérer change peu l’humidité',
    more_humid_outside: 'Aérer humidifie la pièce',
    condensation_risk: 'Ne pas aérer : risque de condensation',
  },
  ventilation_need: { above_limit: 'Au-dessus de la limite', within_limit: 'Dans la limite', not_winter: 'Hors hiver' },
}

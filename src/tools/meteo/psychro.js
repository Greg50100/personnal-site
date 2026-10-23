/**
 * Air humide et indices météo. Pressions en hPa, températures en °C, humidité relative en %.
 * Pression de vapeur saturante : formule de Magnus (coefficients d'Alduchov et Eskridge, 1996),
 * valable de −40 à +50 °C au-dessus de l'eau liquide.
 */
const A = 17.625
const B = 243.04
const C = 6.1094

/** Pression de vapeur saturante (hPa). */
export const saturationVaporPressure = (t) => C * Math.exp((A * t) / (t + B))

/** Point de rosée (°C) à partir de la pression de vapeur (hPa). */
export function dewPointFromVapor(e) {
  const g = Math.log(e / C)
  return (B * g) / (A - g)
}

export const dewPoint = (t, rh) => dewPointFromVapor((rh / 100) * saturationVaporPressure(t))
export const relativeHumidityFromDewPoint = (t, td) => (100 * saturationVaporPressure(td)) / saturationVaporPressure(t)

/** Rapport de mélange (kg de vapeur par kg d'air sec). */
export const humidityRatio = (e, p) => (0.621945 * e) / (p - e)

/** Enthalpie spécifique (kJ par kg d'air sec). */
export const enthalpy = (t, w) => 1.006 * t + w * (2501 + 1.86 * t)

/** Volume spécifique (m³ par kg d'air sec), p en hPa. */
export const specificVolume = (t, w, p) => (0.287042 * (t + 273.15) * (1 + 1.607858 * w)) / (p / 10)

/** Humidité absolue (g de vapeur par m³ d'air). */
export const absoluteHumidity = (t, e) => (e * 100 * 1000) / (461.5 * (t + 273.15))

/**
 * Température humide thermodynamique (°C) : bilan d'énergie de la saturation adiabatique
 * (ASHRAE Fundamentals, équation 35), résolu par dichotomie entre le point de rosée et T.
 */
export function wetBulb(t, e, p) {
  const w = humidityRatio(e, p)
  const f = (tw) => ((2501 - 2.326 * tw) * humidityRatio(saturationVaporPressure(tw), p) - 1.006 * (t - tw)) / (2501 + 1.86 * t - 4.186 * tw) - w
  let lo = dewPointFromVapor(e) - 1
  let hi = t
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) > 0) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}

/** Indice de chaleur (NOAA, régression de Rothfusz avec ses corrections), en °C. */
export function heatIndex(t, rh) {
  const T = (t * 9) / 5 + 32
  let hi = 0.5 * (T + 61 + (T - 68) * 1.2 + rh * 0.094)
  if ((hi + T) / 2 >= 80) {
    hi =
      -42.379 + 2.04901523 * T + 10.14333127 * rh - 0.22475541 * T * rh - 0.00683783 * T * T - 0.05481717 * rh * rh +
      0.00122874 * T * T * rh + 0.00085282 * T * rh * rh - 0.00000199 * T * T * rh * rh
    if (rh < 13 && T > 80 && T < 112) hi -= ((13 - rh) / 4) * Math.sqrt((17 - Math.abs(T - 95)) / 17)
    else if (rh > 85 && T > 80 && T < 87) hi += ((rh - 85) / 10) * ((87 - T) / 5)
  }
  return ((hi - 32) * 5) / 9
}

/** Humidex (Environnement Canada), à partir du point de rosée. */
export const humidex = (t, td) => t + 0.5555 * (6.11 * Math.exp(5417.753 * (1 / 273.16 - 1 / (273.15 + td))) - 10)

/** Refroidissement éolien (formule nord-américaine de 2001), vent en km/h à 10 m. Valable si T ≤ 10 °C et V ≥ 4,8 km/h. */
export const windChill = (t, v) => 13.12 + 0.6215 * t - 11.37 * v ** 0.16 + 0.3965 * t * v ** 0.16

/** Température potentielle (°C), ramenée à 1 000 hPa. */
export const potentialTemperature = (t, p) => (t + 273.15) * (1000 / p) ** 0.2857 - 273.15

/** Altitude approchée de la base des nuages cumulus (niveau de condensation), en mètres au-dessus du sol. */
export const cloudBase = (t, td) => 125 * (t - td)

/** Pression au niveau de la mer à partir de la pression mesurée à l'altitude h (m), réduction OACI. */
export const seaLevelPressure = (p, h, t) => p * (1 - (0.0065 * h) / (t + 0.0065 * h + 273.15)) ** -5.257

/** Pression de l'atmosphère standard (OACI) à l'altitude h (m). */
export const standardPressure = (h) => 1013.25 * (1 - 2.25577e-5 * h) ** 5.25588

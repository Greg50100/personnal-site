import { describe, expect, test } from 'vitest'
import * as P from './psychro'
import airHumide from './air-humide'
import ressenti from './ressenti'

describe('air humide', () => {
  test('valeurs du diagramme de l’air humide (20 °C, 50 %, 1 013,25 hPa)', () => {
    const es = P.saturationVaporPressure(20)
    expect(es).toBeCloseTo(23.37, 1)
    const e = 0.5 * es
    expect(P.dewPoint(20, 50)).toBeCloseTo(9.3, 1)
    expect(P.humidityRatio(e, 1013.25) * 1000).toBeCloseTo(7.26, 1)
    expect(P.enthalpy(20, P.humidityRatio(e, 1013.25))).toBeCloseTo(38.5, 0)
    expect(P.wetBulb(20, e, 1013.25)).toBeCloseTo(13.8, 1) // ASHRAE : 13,8 °C
    expect(P.specificVolume(20, P.humidityRatio(e, 1013.25), 1013.25)).toBeCloseTo(0.839, 2)
  })
  test('humidité relative à partir du point de rosée', () => {
    expect(P.relativeHumidityFromDewPoint(20, P.dewPoint(20, 65))).toBeCloseTo(65, 6)
  })
  test('spec : saisie par point de rosée et erreurs', () => {
    const out = airHumide.compute({ t: 20, known: 'td', td: 9.3, p: 1013.25 })
    expect(out.results[0].value).toBeCloseTo(50, 0)
    expect(airHumide.compute({ t: 20, known: 'td', td: 25, p: 1013.25 }).error).toBeTruthy()
    expect(airHumide.compute({ t: 20, known: 'rh', rh: 50, p: 1013.25 }).chart.series).toHaveLength(2)
  })
})

describe('ressenti et pression', () => {
  test('indices de confort', () => {
    expect(P.heatIndex(32.2, 70)).toBeCloseTo(41.1, 0) // table NOAA : 90 °F, 70 % → 106 °F
    expect(P.windChill(-10, 30)).toBeCloseTo(-19.5, 1)
    expect(P.humidex(30, 15)).toBeCloseTo(34, 0)
  })
  test('pression et altitude', () => {
    expect(P.standardPressure(0)).toBeCloseTo(1013.25, 6)
    expect(P.standardPressure(1000)).toBeCloseTo(898.7, 0)
    expect(P.seaLevelPressure(1000, 100, 15)).toBeCloseTo(1011.9, 0)
    expect(P.potentialTemperature(20, 1000)).toBeCloseTo(20, 6)
  })
  test('spec : n’affiche que les indices applicables', () => {
    const hot = ressenti.compute({ t: 32, rh: 60, wind: 10, p: NaN, h: 0 })
    expect(hot.results[0].label).toMatch(/chaleur/)
    const cold = ressenti.compute({ t: -5, rh: 80, wind: 20, p: 990, h: 150 })
    expect(cold.results[0].label).toMatch(/éolien/)
    expect(cold.results.some((r) => r.label.includes('niveau de la mer'))).toBe(true)
  })
})

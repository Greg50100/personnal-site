import { describe, expect, test } from 'vitest'
import * as P from './psychro'
import airHumide from './air-humide'
import confort from './confort-thermique'
import ressenti from './ressenti'
import * as TC from './thermal-comfort'
import fixture from './thermal-comfort.fixture.json'

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
    const chart = airHumide.compute({ t: 20, known: 'rh', rh: 50, p: 1013.25 }).chart
    expect(chart.component).toBeTypeOf('function')
    expect(chart.w * 1000).toBeCloseTo(7.26, 1)
    expect(airHumide.compute({ t: 60, known: 'rh', rh: 50, p: 150 }).error).toBeTruthy()
  })
  test('diagramme : lecture d’un point (inverse des formules)', () => {
    const s = P.airState(20, P.humidityRatio(0.5 * P.saturationVaporPressure(20), 1013.25), 1013.25)
    expect(s.rh).toBeCloseTo(50, 6)
    expect(s.td).toBeCloseTo(P.dewPoint(20, 50), 6)
    expect(s.tw).toBeCloseTo(13.8, 1)
    // Une droite de température humide part de la saturation et passe par le point
    expect(P.ratioFromWetBulb(20, s.tw, 1013.25)).toBeCloseTo(s.w, 6)
    expect(P.ratioFromWetBulb(s.tw, s.tw, 1013.25)).toBeCloseTo(P.saturationRatio(s.tw, 1013.25), 9)
    // Droites d'enthalpie et de volume spécifique
    expect(P.ratioFromEnthalpy(20, s.h)).toBeCloseTo(s.w, 9)
    expect(P.temperatureFromVolume(s.v, s.w, 1013.25)).toBeCloseTo(20, 9)
  })
})

describe('confort thermique (formules de Thermal Comfort)', () => {
  test.each(fixture.cases)('identique au code de l’intégration : %j', ({ input: i, expected: e }) => {
    const p = i.p ?? TC.STANDARD_PRESSURE
    const close = (a, b) => expect(a).toBeCloseTo(b, 9)
    close(TC.dewPoint(i.t, i.rh), e.dew_point)
    close(TC.heatIndex(i.t, i.rh), e.heat_index)
    close(TC.humidex(i.t, i.rh), e.humidex)
    expect(TC.humidexPerception(TC.humidex(i.t, i.rh))).toBe(e.humidex_perception)
    expect(TC.dewPointPerception(TC.dewPoint(i.t, i.rh))).toBe(e.dew_point_perception)
    close(TC.absoluteHumidity(i.t, i.rh), e.absolute_humidity)
    close(TC.frostPoint(i.t, i.rh), e.frost_point)
    expect(TC.frostRisk(i.t, i.rh)).toBe(e.frost_risk)
    expect(TC.relativeStrain(i.t, i.rh)).toEqual({ index: e.relative_strain[1].relative_strain_index, perception: e.relative_strain[0] })
    expect(TC.summerScharlau(i.t, i.rh)).toEqual({ index: e.summer_scharlau[1].summer_scharlau_index, perception: e.summer_scharlau[0] })
    expect(TC.winterScharlau(i.t, i.rh)).toEqual({ index: e.winter_scharlau[1].winter_scharlau_index, perception: e.winter_scharlau[0] })
    close(TC.summerSimmer(i.t, i.rh), e.summer_simmer_index)
    expect(TC.summerSimmerPerception(TC.summerSimmer(i.t, i.rh))).toBe(e.summer_simmer_perception)
    close(TC.moistAirEnthalpy(i.t, i.rh, p), e.moist_air_enthalpy)
    close(TC.humidityRatioGrams(i.t, i.rh, p), e.humidity_ratio)
    close(TC.vaporPressureDeficit(i.t, i.rh).deficit, e.vapor_pressure_deficit)
    close(TC.wetBulb(i.t, i.rh), e.wet_bulb_temperature)
    const thom = TC.thomsDiscomfort(i.t, i.rh)
    close(thom.index, e.thoms_discomfort_index)
    expect(thom.epsteinMoran).toBe(e.epstein_moran)
    expect(thom.perception).toBe(e.thoms_discomfort_perception)
    const m = TC.moistureExcess(i.t, i.rh, i.to, i.rho)
    close(m.excess, e.moisture_excess)
    expect(m.ventilatedRh).toBe(e.ventilated_relative_humidity)
    expect(m.outdoorDewPoint).toBe(e.outdoor_dew_point)
    expect(TC.ventilationAdvice(m)).toBe(e.ventilation_advice)
    expect(TC.ventilationNeed(m, i.to)).toBe(e.ventilation_need)
    close(TC.windChill(i.t, i.wind), e.wind_chill)
    close(TC.apparentTemperature(i.t, i.rh, i.wind), e.apparent_temperature)
  })
  test('chaque état a un libellé français', () => {
    for (const { expected: e } of fixture.cases) {
      expect(TC.STATES.frost_risk[e.frost_risk]).toBeTruthy()
      expect(TC.STATES.humidex_perception[e.humidex_perception]).toBeTruthy()
      expect(TC.STATES.ventilation_advice[e.ventilation_advice]).toBeTruthy()
      expect(TC.STATES.summer_simmer_perception[e.summer_simmer_perception]).toBeTruthy()
    }
  })
  test('spec : tableau complet, renvois vers des références existantes', () => {
    const out = confort.compute({ t: 2, rh: 85, p: 1013.25, wind: 20, to: -3, rho: 90 })
    expect(out.results[0].label).toBe('Humidex')
    expect(out.table.rows).toHaveLength(26)
    expect(out.table.rows.find((r) => r[0] === 'Risque de gelée')[2]).toBe('probable')
    const n = confort.references.length
    for (const row of out.table.rows) {
      for (const k of row[3].slice(1, -1).split(', ').map(Number)) expect(k >= 1 && k <= n).toBe(true)
    }
    const ids = new Set(confort.references.map((r) => r.id))
    for (const f of [...confort.formulas, ...confort.notes]) for (const id of [f.ref ?? []].flat()) expect(ids.has(id)).toBe(true)
    expect(confort.compute({ t: 20, rh: 0, p: 1013.25 }).error).toBeTruthy()
    expect(confort.compute({ t: 20, rh: 50, p: 1013.25, wind: NaN, to: NaN, rho: NaN }).table.rows).toHaveLength(20)
  })
})

describe('références', () => {
  test('chaque renvoi des specs météo pointe vers une référence de la spec', () => {
    for (const spec of [airHumide, ressenti, confort]) {
      const ids = new Set(spec.references.map((r) => r.id))
      expect(spec.references.every((r) => r.label)).toBe(true)
      for (const f of [...spec.formulas, ...(spec.notes ?? [])]) for (const id of [f.ref ?? []].flat()) expect(ids.has(id), id).toBe(true)
    }
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

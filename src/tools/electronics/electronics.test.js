import { describe, expect, test } from 'vitest'
import { formatSI, parseSI } from '../../lib/si'
import { decode, eSeriesOf, encode, nearestInSeries } from './resistor/colors'
import { solveOhm } from './ohm/ohm'
import { findR2, solveDivider } from './divider/divider'
import { solveLed } from './led/led'
import { astable, designAstable, monostable } from './timer555/timer555'
import { traceWidth } from './calc/largeur-piste'
import { requiredSinkResistance } from './calc/dissipateur'
import { peakVoltage, rippleC } from './calc/condensateur-filtrage'
import { dbmToWatts, powerRatioToDb, voltageRatioToDb } from './calc/decibels'
import { attenuator, lm317R2, lm317Vout } from './formulas'

describe('préfixes SI', () => {
  test('lecture', () => {
    expect(parseSI('4k7')).toBeCloseTo(4700)
    expect(parseSI('4.7k')).toBeCloseTo(4700)
    expect(parseSI('2,2 MΩ')).toBeCloseTo(2.2e6)
    expect(parseSI('20mA')).toBeCloseTo(0.02)
    expect(parseSI('10R')).toBe(10)
    expect(parseSI('470n')).toBeCloseTo(4.7e-7)
    expect(parseSI('abc')).toBeNaN()
  })
  test('écriture', () => {
    expect(formatSI(4700, 'Ω')).toBe('4,7 kΩ')
    expect(formatSI(0.02, 'A')).toBe('20 mA')
    expect(formatSI(1, 'V')).toBe('1 V')
  })
})

describe('code couleur', () => {
  test('décodage', () => {
    expect(decode(['jaune', 'violet', 'rouge', 'or'])).toEqual({ ohms: 4700, tolerance: 5, tcr: null })
    expect(decode(['marron', 'noir', 'noir', 'argent']).ohms).toBe(10)
    expect(decode(['marron', 'noir', 'noir', 'rouge', 'marron', 'rouge']).tcr).toBe(50)
  })
  test('encodage', () => {
    expect(encode(4700, 2)).toEqual({ digits: ['jaune', 'violet'], mult: 'rouge', exact: true })
    expect(encode(4.7, 2)).toEqual({ digits: ['jaune', 'violet'], mult: 'or', exact: true })
    expect(encode(1.5e6, 3).mult).toBe('jaune')
  })
  test('séries E', () => {
    expect(eSeriesOf(4700)).toBe('E3')
    expect(eSeriesOf(1500)).toBe('E6')
    expect(eSeriesOf(2700)).toBe('E12')
    expect(eSeriesOf(5100)).toBe('E24')
    expect(eSeriesOf(4750)).toBe('E96')
    expect(eSeriesOf(4800)).toBeNull()
    expect(nearestInSeries(4800)).toEqual([4700, 5100])
  })
})

describe("loi d'Ohm", () => {
  test('U et R', () => {
    const r = solveOhm({ U: 12, R: 470 })
    expect(r.I).toBeCloseTo(0.025532, 5)
    expect(r.P).toBeCloseTo(0.30638, 4)
  })
  test('R et P', () => {
    const r = solveOhm({ R: 100, P: 1 })
    expect(r.U).toBeCloseTo(10)
    expect(r.I).toBeCloseTo(0.1)
  })
  test('insuffisant', () => expect(solveOhm({ U: 5 })).toBeNull())
})

describe('pont diviseur', () => {
  test('sans charge (formule de Ganymede)', () => {
    const r = solveDivider({ vin: 12, r1: 10_000, r2: 4700 })
    expect(r.vout).toBeCloseTo(12 * (4700 / 14_700), 9)
    expect(r.current).toBeCloseTo(12 / 14_700, 12)
  })
  test('avec charge', () => {
    const r = solveDivider({ vin: 10, r1: 1000, r2: 1000, rl: 1000 })
    expect(r.unloaded).toBeCloseTo(5)
    expect(r.vout).toBeCloseTo(10 / 3)
  })
  test('choix de R2', () => {
    const d = findR2({ vin: 5, vout: 3.3, r1: 10_000 })
    expect(d.r2).toBeCloseTo(19_411.76, 1)
    expect(d.candidates.map((c) => c.r2)).toEqual([18_000, 20_000])
    expect(findR2({ vin: 5, vout: 6, r1: 1000 })).toBeNull()
  })
  test('entrées invalides', () => expect(solveDivider({ vin: 5, r1: 0, r2: 0 })).toBeNull())
})

describe('résistance de LED', () => {
  test('LED rouge sur 5 V à 20 mA', () => {
    const r = solveLed({ supply: 5, vf: 2, currentA: 0.02 })
    expect(r.r).toBeCloseTo(150)
    expect(r.standard).toBe(150)
    expect(r.rating).toBe(0.125)
  })
  test('valeur normalisée supérieure et LED en série', () => {
    const r = solveLed({ supply: 12, vf: 3.2, currentA: 0.02, count: 3 })
    expect(r.r).toBeCloseTo(120)
    const r2 = solveLed({ supply: 9, vf: 2.2, currentA: 0.015 })
    expect(r2.standard).toBe(470)
    expect(r2.actualCurrent).toBeLessThan(0.015)
  })
  test('alimentation insuffisante', () => expect(solveLed({ supply: 5, vf: 3.2, currentA: 0.02, count: 2 }).error).toBe('voltage'))
})

describe('temporisateur 555', () => {
  test('astable (valeurs par défaut de Ganymede)', () => {
    const a = astable({ r1: 10_000, r2: 47_000, c: 10e-6 })
    expect(a.period).toBeCloseTo(0.693 * (10_000 + 2 * 47_000) * 10e-6, 3)
    expect(a.frequency).toBeCloseTo(1.387, 2)
    expect(a.duty).toBeCloseTo(57 / 104, 9)
  })
  test('monostable', () => expect(monostable({ r: 10_000, c: 10e-6 }).width).toBeCloseTo(0.10986, 4))
  test('conception inverse', () => {
    const { r1, r2 } = designAstable({ frequency: 1000, duty: 0.6, c: 10e-9 })
    const back = astable({ r1, r2, c: 10e-9 })
    expect(back.frequency).toBeCloseTo(1000, 6)
    expect(back.duty).toBeCloseTo(0.6, 9)
    expect(designAstable({ frequency: 1000, duty: 0.4, c: 10e-9 })).toBeNull()
  })
})

describe('calculateurs ajoutés (références)', () => {
  test('largeur de piste IPC-2221 : 1 A, 10 °C, 1 oz en externe ≈ 0,30 mm', () => {
    expect(traceWidth(1, 10, 1, false)).toBeCloseTo(0.3, 2)
    // Une couche interne demande environ 2,6 fois plus de largeur
    expect(traceWidth(1, 10, 1, true) / traceWidth(1, 10, 1, false)).toBeCloseTo(2.6, 1)
  })
  test('dissipateur : 5 W, 40 → 110 °C, Rθjc 1,5 et Rθcs 0,5 → 12 °C/W', () => {
    expect(requiredSinkResistance({ p: 5, ta: 40, tj: 110, rjc: 1.5, rcs: 0.5 })).toBeCloseTo(12, 6)
  })
  test('LM317 : 240 Ω et 720 Ω donnent 5,04 V ; 5 V demande 713 Ω', () => {
    expect(lm317Vout(240, 720)).toBeCloseTo(5.036, 3)
    expect(lm317R2(5, 240)).toBeCloseTo(713.2, 1)
  })
  test('filtrage : 12 V eff. en pont, 0,5 A, 1 V d’ondulation → 15,57 V crête et 5 000 µF', () => {
    expect(peakVoltage(12, 0.7, 2)).toBeCloseTo(15.57, 2)
    expect(rippleC(0.5, 100, 1)).toBeCloseTo(5e-3, 9)
  })
  test('décibels', () => {
    expect(powerRatioToDb(2)).toBeCloseTo(3.0103, 4)
    expect(voltageRatioToDb(2)).toBeCloseTo(6.0206, 4)
    expect(dbmToWatts(30)).toBeCloseTo(1, 9)
  })
  test('atténuateur 50 Ω, 10 dB : T 25,97 / 35,14 Ω ; π 96,25 / 71,15 Ω', () => {
    const t = attenuator(50, 10, 't')
    expect(t.series).toBeCloseTo(25.97, 2)
    expect(t.shunt).toBeCloseTo(35.14, 2)
    const pi = attenuator(50, 10, 'pi')
    expect(pi.shunt).toBeCloseTo(96.25, 2)
    expect(pi.series).toBeCloseTo(71.15, 2)
  })
})

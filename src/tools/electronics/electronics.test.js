import { describe, expect, test } from 'vitest'
import { formatSI, parseSI } from '../../lib/si'
import { decode, eSeriesOf, encode, nearestInSeries } from './resistor/colors'
import { solveOhm } from './ohm/ohm'
import { findR2, solveDivider } from './divider/divider'
import { solveLed } from './led/led'
import { astable, designAstable, monostable } from './timer555/timer555'

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

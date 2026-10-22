import { describe, expect, test } from 'vitest'
import { formatSI, parseSI } from './si'
import { decode, eSeriesOf, encode, nearestInSeries } from './resistor/colors'
import { solveOhm } from './ohm/ohm'

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
    expect(eSeriesOf(4700)).toBe('E6')
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

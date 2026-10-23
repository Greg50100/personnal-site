import { describe, expect, test } from 'vitest'
import { combine } from './electronics/calc/serie-parallele'
import { decodeCapacitor } from './electronics/calc/code-condensateur'
import { decodeSmd } from './electronics/calc/code-cms'
import { impedance } from './electronics/calc/impedance'
import { filterGain } from './electronics/calc/filtre-passif'
import { E_SERIES, closestInSeries, nearestInSeries } from './electronics/eseries'
import { awgToMm2, mm2ToAwg } from './electronics/calc/cables'
import { projectile } from './physique/projectile'
import { bmr } from './sante/metabolisme'
import { bodyFat } from './sante/masse-grasse'
import { bmiCategory } from './sante/imc'
import { molarMass, parseFormula } from './chimie/masse-molaire'
import { addYMD, businessDays, easter, isoWeek, orthodoxEaster, parseISODate, ymdDiff } from './temps/dates'
import { frenchHolidays } from './temps/paques'
import * as M from './maths/matrices/matrix'
import { compile } from './utilities/calculator/expression'
import specs from './electronics/calc/puissance'

const d = (s) => parseISODate(s)
const iso = (date) => date.toISOString().slice(0, 10)

describe('électronique (portage Ganymede)', () => {
  test('séries E', () => {
    expect(E_SERIES.E192).toHaveLength(192)
    expect(E_SERIES.E96).toHaveLength(96)
    expect(E_SERIES.E48).toHaveLength(48)
    expect(nearestInSeries(4000, 'E12')).toEqual([3900, 4700])
    expect(closestInSeries(4000, 'E24')).toBe(3900)
  })
  test('série / parallèle', () => {
    expect(combine([100, 100], 'r')).toEqual({ series: 200, parallel: 50 })
    const c = combine([1e-6, 1e-6], 'c')
    expect(c.parallel).toBeCloseTo(2e-6)
    expect(c.series).toBeCloseTo(0.5e-6)
  })
  test('marquages', () => {
    expect(decodeCapacitor('104K').farads).toBeCloseTo(100e-9)
    expect(decodeCapacitor('104K').tolerance).toBe('±10 %')
    expect(decodeCapacitor('4n7').farads).toBeCloseTo(4.7e-9)
    expect(decodeCapacitor('47').farads).toBeCloseTo(47e-12)
    expect(decodeSmd('103').ohms).toBe(10_000)
    expect(decodeSmd('4R7').ohms).toBeCloseTo(4.7)
    expect(decodeSmd('1002').ohms).toBe(10_000)
    expect(decodeSmd('01C').ohms).toBe(10_000)
    expect(decodeSmd('68X').ohms).toBeCloseTo(49.9)
  })
  test('impédance et filtres', () => {
    const z = impedance({ r: 100, l: 0, c: 0, f: 50, parallel: false })
    expect(z).toEqual({ re: 100, im: 0 })
    // À la résonance, l'impédance série se réduit à R
    const f0 = 1 / (2 * Math.PI * Math.sqrt(10e-3 * 100e-9))
    const zr = impedance({ r: 10, l: 10e-3, c: 100e-9, f: f0, parallel: false })
    expect(zr.re).toBeCloseTo(10)
    expect(zr.im).toBeCloseTo(0, 6)
    expect(filterGain('rc', 'low', 1000, 1000)).toBeCloseTo(-3.0103, 3)
    expect(filterGain('rc', 'high', 1000, 100)).toBeCloseTo(-20.04, 1)
  })
  test('puissance triphasée', () => {
    const r = specs.compute({ type: 'tri', u: 400, i: 10, pf: 0.8 })
    expect(r.results[1].value).toBeCloseTo(Math.sqrt(3) * 4000)
    expect(r.results[0].value).toBeCloseTo(Math.sqrt(3) * 3200)
  })
  test('AWG', () => {
    expect(awgToMm2(12)).toBeCloseTo(3.31, 2)
    expect(mm2ToAwg(2.5)).toBe(13)
  })
})

describe('physique et santé', () => {
  test('projectile à 45° depuis le sol', () => {
    const p = projectile({ v0: 20, angle: 45, h0: 0, g: 9.80665 })
    expect(p.range).toBeCloseTo(400 / 9.80665, 6)
    expect(p.hMax).toBeCloseTo(100 / 9.80665, 6)
  })
  test('métabolisme (Mifflin-St Jeor, comme Ganymede)', () => {
    expect(bmr({ sex: 'm', w: 70, h: 175, age: 30, formula: 'msj' })).toBeCloseTo(1648.75)
    expect(bmr({ sex: 'f', w: 60, h: 165, age: 30, formula: 'msj' })).toBeCloseTo(1320.25)
  })
  test('masse grasse et IMC', () => {
    expect(bodyFat({ sex: 'm', h: 178, neck: 38, waist: 85 })).toBeCloseTo(16.44, 1)
    expect(bmiCategory(22)).toBe('Corpulence normale')
    expect(bmiCategory(31)).toBe('Obésité modérée')
  })
})

describe('chimie', () => {
  test('masses molaires', () => {
    expect(molarMass('H2O')).toBeCloseTo(18.015, 2)
    expect(molarMass('C6H12O6')).toBeCloseTo(180.156, 2)
    expect(molarMass('Ca(OH)2')).toBeCloseTo(74.092, 2)
    expect(molarMass('CuSO4·5H2O')).toBeCloseTo(249.68, 1)
    expect(parseFormula('K4[Fe(CN)6]')).toEqual({ K: 4, Fe: 1, C: 6, N: 6 })
    expect(() => parseFormula('Xx2')).toThrow('inconnu')
    expect(() => parseFormula('Ca(OH2')).toThrow('Parenthèse')
  })
})

describe('dates', () => {
  test('Pâques', () => {
    expect(iso(easter(2026))).toBe('2026-04-05')
    expect(iso(easter(2027))).toBe('2027-03-28')
    expect(iso(orthodoxEaster(2026))).toBe('2026-04-12')
    expect(iso(orthodoxEaster(2027))).toBe('2027-05-02')
  })
  test('jours fériés 2026', () => {
    const h = frenchHolidays(2026).map((x) => `${iso(x.date)} ${x.name}`)
    expect(h).toContain('2026-05-14 Ascension')
    expect(h).toContain('2026-05-25 Lundi de Pentecôte')
    expect(h).toHaveLength(11)
  })
  test('écarts et ajouts', () => {
    expect(ymdDiff(d('2024-01-31'), d('2024-03-01'))).toEqual({ y: 0, m: 1, d: 1 })
    expect(ymdDiff(d('2000-02-29'), d('2026-10-23'))).toEqual({ y: 26, m: 7, d: 24 })
    expect(ymdDiff(d('2026-10-23'), d('2026-10-23'))).toEqual({ y: 0, m: 0, d: 0 })
    expect(iso(addYMD(d('2024-01-31'), { m: 1 }))).toBe('2024-02-29')
    expect(businessDays(d('2026-10-19'), d('2026-10-26'))).toBe(5)
    expect(isoWeek(d('2026-01-01'))).toBe(1)
    expect(isoWeek(d('2027-01-01'))).toBe(53)
  })
})

describe('maths', () => {
  test('matrices', () => {
    const a = [
      [2, 1],
      [1, 3],
    ]
    expect(M.determinant(a)).toBeCloseTo(5)
    const inv = M.inverse(a)
    const id = M.multiply(a, inv)
    expect(id[0][0]).toBeCloseTo(1)
    expect(id[0][1]).toBeCloseTo(0)
    expect(M.power(a, 2)).toEqual([
      [5, 5],
      [5, 10],
    ])
    expect(M.rank([
      [1, 2],
      [2, 4],
    ])).toBe(1)
    expect(() => M.inverse([[1, 2], [2, 4]])).toThrow('non inversible')
  })
  test('expressions avec variable x', () => {
    const f = compile('2x^2 + sin(x)', ['x'])
    expect(f({ x: 0, angle: 'rad' })).toBe(0)
    expect(f({ x: 1, angle: 'rad' })).toBeCloseTo(2 + Math.sin(1))
  })
})

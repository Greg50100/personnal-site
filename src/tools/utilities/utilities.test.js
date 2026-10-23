import { describe, expect, test } from 'vitest'
import { evaluate } from './calculator/expression'
import { QUANTITIES, convert } from './converter/units/index'
import { currencyQuantity } from './converter/currency'

describe('expressions', () => {
  const ev = (e, o) => evaluate(e, o)
  test('priorités', () => {
    expect(ev('2+3*4')).toBe(14)
    expect(ev('-2^2')).toBe(-4)
    expect(ev('2^3^2')).toBe(512)
    expect(ev('(1+2)(3+4)')).toBe(21)
    expect(ev('2π')).toBeCloseTo(2 * Math.PI)
    expect(ev('5!')).toBe(120)
    expect(ev('50%')).toBe(0.5)
    expect(ev('3²')).toBe(9)
    expect(ev('√16+1')).toBe(5)
    expect(ev('1,5×2')).toBe(3)
    expect(ev('2e3')).toBe(2000)
    expect(ev('0.1+0.2')).toBe(0.3)
  })
  test('trigonométrie', () => {
    expect(ev('sin(30)')).toBe(0.5)
    expect(ev('sin(180)')).toBe(0)
    expect(ev('cos(pi)', { angle: 'rad' })).toBe(-1)
    expect(ev('asin(1)')).toBe(90)
    expect(ev('ln(e)')).toBe(1)
    expect(ev('log(1000)')).toBe(3)
  })
  test('Ans', () => expect(ev('ans*2', { ans: 21 })).toBe(42))
  test('erreurs', () => {
    expect(() => ev('1/0')).toThrow('Division par zéro')
    expect(() => ev('(1+2')).toThrow('Parenthèse')
    expect(() => ev('foo(2)')).toThrow('inconnu')
    expect(() => ev('2+')).toThrow()
    expect(() => ev('')).toThrow()
  })
})

describe('conversions', () => {
  test('linéaires', () => {
    expect(convert('longueur', 1, 'mi', 'km')).toBeCloseTo(1.609344, 9)
    expect(convert('masse', 1, 'lb', 'g')).toBeCloseTo(453.59237, 9)
    expect(convert('pression', 1, 'atm', 'hpa')).toBeCloseTo(1013.25, 9)
    expect(convert('donnees', 1, 'gio', 'mo')).toBeCloseTo(1073.741824, 9)
  })
  test('température', () => {
    expect(convert('temperature', 100, 'c', 'f')).toBeCloseTo(212, 9)
    expect(convert('temperature', 0, 'k', 'c')).toBeCloseTo(-273.15, 9)
    expect(convert('temperature', 491.67, 'r', 'c')).toBeCloseTo(0, 9)
  })
  test('consommation', () => {
    expect(convert('consommation', 5, 'l100', 'kml')).toBeCloseTo(20, 9)
    expect(convert('consommation', 30, 'mpg_us', 'l100')).toBeCloseTo(7.8405, 3)
  })
  test('préfixes méga / milli distincts', () => {
    expect(convert('puissance', 1, 'megw', 'kw')).toBeCloseTo(1000, 9)
    expect(convert('puissance', 1, 'mw', 'w')).toBeCloseTo(0.001, 12)
    expect(convert('frequence', 1, 'meghz', 'khz')).toBeCloseTo(1000, 9)
    expect(convert('energie', 1, 'kwh', 'megj')).toBeCloseTo(3.6, 9)
    expect(convert('tension', 1, 'uv', 'v')).toBeCloseTo(1e-6, 15)
  })
  test('autres familles', () => {
    expect(convert('pression', 1, 'psi', 'kpa')).toBeCloseTo(6.894757, 5)
    expect(convert('angle', 100, 'pct', 'deg')).toBeCloseTo(45, 9)
    expect(convert('charge', 1, 'ah', 'mah')).toBeCloseTo(1000, 9)
    expect(convert('concentration-molaire', 1, 'moll', 'mmoll')).toBeCloseTo(1000, 9)
    expect(convert('debit-donnees', 100, 'mbps', 'mos')).toBeCloseTo(12.5, 9)
    expect(convert('typographie', 72, 'pt', 'in')).toBeCloseTo(1, 9)
  })
  test('identifiants uniques et unités par défaut existantes', () => {
    expect(new Set(QUANTITIES.map((q) => q.id)).size).toBe(QUANTITIES.length)
    for (const q of QUANTITIES) {
      const ids = q.units.map((u) => u.id)
      expect(new Set(ids).size, q.id).toBe(ids.length)
      for (const d of q.defaults) expect(ids, `${q.id} → ${d}`).toContain(d)
    }
  })
  test('devises', () => {
    const q = currencyQuantity({ date: '2026-10-22', rates: { EUR: 1, USD: 1.1, JPY: 160 } })
    expect(q.units[0].id).toBe('EUR')
    const usd = q.units.find((u) => u.id === 'USD')
    expect(usd.label).toMatch(/dollar/i)
    expect(110 * usd.factor).toBeCloseTo(100, 9)
  })
  test('aller-retour sur toutes les unités', () => {
    for (const q of QUANTITIES) {
      for (const u of q.units) {
        expect(convert(q.id, convert(q.id, 3.7, u.id, q.units[0].id), q.units[0].id, u.id)).toBeCloseTo(3.7, 9)
      }
    }
  })
})

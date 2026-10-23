import { describe, expect, test } from 'vitest'
import { evaluate } from './calculator/expression'
import { QUANTITIES, convert } from './converter/units'

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
  test('aller-retour sur toutes les unités', () => {
    for (const q of QUANTITIES) {
      for (const u of q.units) {
        expect(convert(q.id, convert(q.id, 3.7, u.id, q.units[0].id), q.units[0].id, u.id)).toBeCloseTo(3.7, 9)
      }
    }
  })
})

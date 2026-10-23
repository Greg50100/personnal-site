import { describe, expect, test } from 'vitest'
import { solveQuadratic } from './quadratic/quadratic'
import { gcdSteps, lcm, parseBigInt, primeFactors } from './gcd/arith'
import { div, mul, parseComplex, pow } from './complex/complex'
import { formatInBase, groupDigits, parseInBase } from './bases/bases'

describe('second degré', () => {
  test('deux racines réelles', () => {
    const r = solveQuadratic(1, -3, 2)
    expect(r.kind).toBe('real')
    expect(r.roots.map((z) => z.re)).toEqual([1, 2])
  })
  test('racine double', () => {
    const r = solveQuadratic(1, 2, 1)
    expect(r.kind).toBe('double')
    expect(r.roots[0].re).toBe(-1)
  })
  test('racines complexes', () => {
    const r = solveQuadratic(1, 0, 1)
    expect(r.kind).toBe('complex')
    expect(r.roots[1]).toEqual({ re: -0, im: 1 })
  })
  test('cas dégénérés', () => {
    expect(solveQuadratic(0, 2, -4)).toEqual({ kind: 'linear', roots: [{ re: 2, im: 0 }] })
    expect(solveQuadratic(0, 0, 0).kind).toBe('all')
    expect(solveQuadratic(0, 0, 1).kind).toBe('none')
  })
  test('stabilité numérique', () => {
    const r = solveQuadratic(1, -1e8, 1)
    expect(r.roots[0].re).toBeCloseTo(1e-8, 20)
  })
})

describe('arithmétique', () => {
  test('PGCD avec étapes', () => {
    const { gcd, steps } = gcdSteps(1071n, 462n)
    expect(gcd).toBe(21n)
    expect(steps[0]).toEqual({ a: 1071n, b: 462n, q: 2n, r: 147n })
  })
  test('PPCM', () => expect(lcm(4n, 6n)).toBe(12n))
  test('facteurs premiers', () => {
    expect(primeFactors(360n).factors).toEqual([
      { p: 2n, e: 3 },
      { p: 3n, e: 2 },
      { p: 5n, e: 1 },
    ])
    expect(primeFactors(97n).factors).toEqual([{ p: 97n, e: 1 }])
  })
  test('saisie', () => {
    expect(parseBigInt(' 1 000 ')).toBe(1000n)
    expect(parseBigInt('12a')).toBeNull()
  })
})

describe('complexes', () => {
  test('lecture', () => {
    expect(parseComplex('3+4i')).toEqual({ re: 3, im: 4 })
    expect(parseComplex('-2i')).toEqual({ re: 0, im: -2 })
    expect(parseComplex('i')).toEqual({ re: 0, im: 1 })
    expect(parseComplex('1,5 - j2')).toEqual({ re: 1.5, im: -2 })
    expect(parseComplex('5')).toEqual({ re: 5, im: 0 })
    expect(parseComplex('2e-3+i')).toEqual({ re: 0.002, im: 1 })
    expect(parseComplex('3+')).toBeNull()
    expect(parseComplex('abc')).toBeNull()
  })
  test('opérations', () => {
    expect(mul({ re: 1, im: 2 }, { re: 3, im: -1 })).toEqual({ re: 5, im: 5 })
    expect(div({ re: 5, im: 5 }, { re: 3, im: -1 })).toEqual({ re: 1, im: 2 })
    const sq = pow({ re: 0, im: 1 }, 2)
    expect(sq.re).toBeCloseTo(-1)
    expect(sq.im).toBeCloseTo(0)
  })
})

describe('bases', () => {
  test('aller-retour', () => {
    expect(parseInBase('ff', 16)).toBe(255n)
    expect(parseInBase('0b1010', 2)).toBe(10n)
    expect(parseInBase('19', 8)).toBeNull()
    expect(formatInBase(255n, 2)).toBe('11111111')
    expect(formatInBase(-255n, 16)).toBe('-FF')
    expect(groupDigits('11111111', 4)).toBe('1111 1111')
  })
})

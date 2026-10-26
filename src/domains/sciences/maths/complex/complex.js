/** Petite bibliothèque de nombres complexes { re, im }. */

export const complex = (re, im = 0) => ({ re, im })
export const add = (a, b) => complex(a.re + b.re, a.im + b.im)
export const sub = (a, b) => complex(a.re - b.re, a.im - b.im)
export const mul = (a, b) => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re)
export function div(a, b) {
  const d = b.re * b.re + b.im * b.im
  if (d === 0) throw new Error('Division par zéro')
  return complex((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d)
}
export const abs = (z) => Math.hypot(z.re, z.im)
export const arg = (z) => Math.atan2(z.im, z.re)
export const conj = (z) => complex(z.re, -z.im)
export const fromPolar = (r, theta) => complex(r * Math.cos(theta), r * Math.sin(theta))
/** Puissance réelle (formule de Moivre, branche principale). */
export function pow(z, n) {
  if (z.re === 0 && z.im === 0) return n > 0 ? complex(0) : complex(NaN, NaN)
  return fromPolar(abs(z) ** n, arg(z) * n)
}
export const sqrt = (z) => pow(z, 0.5)
export const exp = (z) => fromPolar(Math.exp(z.re), z.im)
export function ln(z) {
  if (z.re === 0 && z.im === 0) throw new Error('ln(0) non défini')
  return complex(Math.log(abs(z)), arg(z))
}

const NUM = '(?:\\d+\\.?\\d*|\\.\\d+)(?:e[+-]?\\d+)?'
const TERM = new RegExp(`^([+-]?)(?:(${NUM})(\\*?i)?|i\\*?(${NUM})?)`, 'i')

/**
 * Lit un complexe saisi sous forme algébrique : « 3+4i », « -2i », « 5 », « i », « 1,5 - j2 ».
 * Les termes sont additionnés ; renvoie null si la saisie est invalide.
 */
export function parseComplex(text) {
  const s = String(text).replace(/\s/g, '').replace(/,/g, '.').replace(/j/gi, 'i').replace(/−/g, '-')
  if (!s) return null
  let re = 0
  let im = 0
  let i = 0
  let count = 0
  while (i < s.length) {
    const m = TERM.exec(s.slice(i))
    if (!m || !m[0] || (count > 0 && !m[1])) return null
    const sign = m[1] === '-' ? -1 : 1
    if (m[2] !== undefined) {
      if (m[3]) im += sign * parseFloat(m[2])
      else re += sign * parseFloat(m[2])
    } else {
      im += sign * (m[4] !== undefined ? parseFloat(m[4]) : 1)
    }
    i += m[0].length
    count++
  }
  return complex(re, im)
}

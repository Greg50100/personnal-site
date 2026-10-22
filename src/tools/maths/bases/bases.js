/** Conversion d'entiers (BigInt) entre bases 2 à 36. */

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export function parseInBase(text, base) {
  let s = String(text).trim().toLowerCase().replace(/[\s_]/g, '')
  if (!s) return null
  let negative = false
  if (s.startsWith('-')) {
    negative = true
    s = s.slice(1)
  }
  if (base === 16) s = s.replace(/^0x/, '')
  else if (base === 2) s = s.replace(/^0b/, '')
  else if (base === 8) s = s.replace(/^0o/, '')
  if (!s) return null
  const b = BigInt(base)
  let n = 0n
  for (const ch of s) {
    const d = DIGITS.indexOf(ch)
    if (d < 0 || d >= base) return null
    n = n * b + BigInt(d)
  }
  return negative ? -n : n
}

export function formatInBase(n, base) {
  if (n === null) return ''
  const neg = n < 0n
  let m = neg ? -n : n
  if (m === 0n) return '0'
  const b = BigInt(base)
  let out = ''
  while (m > 0n) {
    out = DIGITS[Number(m % b)] + out
    m /= b
  }
  return (neg ? '-' : '') + (base > 10 ? out.toUpperCase() : out)
}

/** Regroupe les chiffres par paquets (4 en binaire/hexa, 3 sinon) pour la lisibilité. */
export function groupDigits(s, size) {
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  const parts = []
  for (let i = body.length; i > 0; i -= size) parts.unshift(body.slice(Math.max(0, i - size), i))
  return (neg ? '-' : '') + parts.join(' ')
}

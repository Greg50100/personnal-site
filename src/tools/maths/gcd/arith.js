/** Arithmétique entière : PGCD (avec étapes d'Euclide), PPCM, facteurs premiers. Utilise BigInt. */

export function parseBigInt(text) {
  const t = String(text).trim().replace(/[\s_.]/g, '')
  if (!/^-?\d+$/.test(t)) return null
  const n = BigInt(t)
  return n < 0n ? -n : n
}

/** PGCD de deux entiers avec la liste des divisions euclidiennes a = b × q + r. */
export function gcdSteps(a, b) {
  const steps = []
  let x = a
  let y = b
  while (y !== 0n) {
    const q = x / y
    const r = x % y
    steps.push({ a: x, b: y, q, r })
    x = y
    y = r
  }
  return { gcd: x, steps }
}

export const gcd = (a, b) => gcdSteps(a, b).gcd
export const lcm = (a, b) => (a === 0n || b === 0n ? 0n : (a / gcd(a, b)) * b)

/** Décomposition en facteurs premiers par divisions successives (limitée aux nombres raisonnables). */
export function primeFactors(n, maxIterations = 1_000_000) {
  const factors = []
  let m = n
  if (m < 2n) return { factors, complete: true }
  const push = (p) => {
    const last = factors[factors.length - 1]
    if (last && last.p === p) last.e++
    else factors.push({ p, e: 1 })
  }
  for (const p of [2n, 3n]) {
    while (m % p === 0n) {
      push(p)
      m /= p
    }
  }
  let i = 0
  for (let d = 5n; d * d <= m; d += 6n) {
    if (++i > maxIterations) {
      factors.push({ p: m, e: 1, unknown: true })
      return { factors, complete: false }
    }
    for (const p of [d, d + 2n]) {
      while (m % p === 0n) {
        push(p)
        m /= p
      }
    }
  }
  if (m > 1n) push(m)
  return { factors, complete: true }
}

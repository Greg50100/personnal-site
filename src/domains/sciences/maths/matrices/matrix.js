/** Opérations sur des matrices carrées ou rectangulaires (tableaux de lignes). */

export const zeros = (r, c) => Array.from({ length: r }, () => Array(c).fill(0))
export const identity = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)))

export const add = (a, b) => a.map((row, i) => row.map((x, j) => x + b[i][j]))
export const sub = (a, b) => a.map((row, i) => row.map((x, j) => x - b[i][j]))
export const scale = (a, k) => a.map((row) => row.map((x) => x * k))
export const transpose = (a) => a[0].map((_, j) => a.map((row) => row[j]))

export function multiply(a, b) {
  if (a[0].length !== b.length) throw new Error('Dimensions incompatibles pour le produit')
  return a.map((row) => b[0].map((_, j) => row.reduce((s, x, k) => s + x * b[k][j], 0)))
}

/** Déterminant par élimination de Gauss avec pivot partiel. */
export function determinant(m) {
  const n = m.length
  if (m.some((row) => row.length !== n)) throw new Error('Le déterminant n’existe que pour une matrice carrée')
  const a = m.map((row) => [...row])
  let det = 1
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r
    if (Math.abs(a[pivot][col]) < 1e-14) return 0
    if (pivot !== col) {
      ;[a[pivot], a[col]] = [a[col], a[pivot]]
      det = -det
    }
    det *= a[col][col]
    for (let r = col + 1; r < n; r++) {
      const f = a[r][col] / a[col][col]
      for (let c = col; c < n; c++) a[r][c] -= f * a[col][c]
    }
  }
  return det
}

/** Inverse par la méthode de Gauss-Jordan. */
export function inverse(m) {
  const n = m.length
  const a = m.map((row, i) => [...row, ...identity(n)[i]])
  for (let col = 0; col < n; col++) {
    let pivot = col
    for (let r = col + 1; r < n; r++) if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r
    if (Math.abs(a[pivot][col]) < 1e-12) throw new Error('Matrice non inversible (déterminant nul)')
    ;[a[pivot], a[col]] = [a[col], a[pivot]]
    const p = a[col][col]
    for (let c = 0; c < 2 * n; c++) a[col][c] /= p
    for (let r = 0; r < n; r++) {
      if (r === col) continue
      const f = a[r][col]
      for (let c = 0; c < 2 * n; c++) a[r][c] -= f * a[col][c]
    }
  }
  return a.map((row) => row.slice(n))
}

/** Puissance entière (négative = puissance de l'inverse). */
export function power(m, k) {
  if (!Number.isInteger(k)) throw new Error('Exposant entier attendu')
  let base = k < 0 ? inverse(m) : m
  let result = identity(m.length)
  for (let e = Math.abs(k); e > 0; e >>= 1) {
    if (e & 1) result = multiply(result, base)
    base = multiply(base, base)
  }
  return result
}

export const trace = (m) => m.reduce((s, row, i) => s + row[i], 0)

/** Rang par échelonnement. */
export function rank(m) {
  const a = m.map((row) => [...row])
  let r = 0
  for (let c = 0; c < a[0].length && r < a.length; c++) {
    let p = r
    for (let i = r + 1; i < a.length; i++) if (Math.abs(a[i][c]) > Math.abs(a[p][c])) p = i
    if (Math.abs(a[p][c]) < 1e-12) continue
    ;[a[p], a[r]] = [a[r], a[p]]
    for (let i = r + 1; i < a.length; i++) {
      const f = a[i][c] / a[r][c]
      for (let j = c; j < a[0].length; j++) a[i][j] -= f * a[r][j]
    }
    r++
  }
  return r
}

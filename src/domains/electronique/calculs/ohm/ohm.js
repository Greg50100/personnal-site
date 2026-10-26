/** Calcule les deux grandeurs manquantes à partir de deux grandeurs connues. */
export function solveOhm(known) {
  const { U, I, R, P } = known
  const has = (x) => Number.isFinite(x)
  if (has(U) && has(I)) return { U, I, R: U / I, P: U * I }
  if (has(U) && has(R)) return { U, R, I: U / R, P: (U * U) / R }
  if (has(U) && has(P)) return { U, P, I: P / U, R: (U * U) / P }
  if (has(I) && has(R)) return { I, R, U: I * R, P: I * I * R }
  if (has(I) && has(P)) return { I, P, U: P / I, R: P / (I * I) }
  if (has(R) && has(P)) return { R, P, U: Math.sqrt(P * R), I: Math.sqrt(P / R) }
  return null
}

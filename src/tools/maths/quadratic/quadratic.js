/** Résolution de ax² + bx + c = 0 (cas dégénérés compris). */
export function solveQuadratic(a, b, c) {
  if (a === 0) {
    if (b === 0) return { kind: c === 0 ? 'all' : 'none', roots: [] }
    return { kind: 'linear', roots: [{ re: -c / b, im: 0 }] }
  }
  const delta = b * b - 4 * a * c
  const vertex = { x: -b / (2 * a), y: c - (b * b) / (4 * a) }
  // Seuil relatif : évite qu'un Δ = 1e-17 issu d'un arrondi crée deux racines distinctes.
  const eps = 1e-12 * Math.max(b * b, Math.abs(4 * a * c), 1)
  if (Math.abs(delta) <= eps) return { kind: 'double', delta: 0, vertex, roots: [{ re: -b / (2 * a), im: 0 }] }
  if (delta > 0) {
    // Formule stable numériquement (pas de soustraction de nombres proches).
    const q = -0.5 * (b + Math.sign(b || 1) * Math.sqrt(delta))
    const r1 = q / a
    const r2 = c / q
    return { kind: 'real', delta, vertex, roots: [{ re: Math.min(r1, r2), im: 0 }, { re: Math.max(r1, r2), im: 0 }] }
  }
  const re = -b / (2 * a)
  const im = Math.sqrt(-delta) / (2 * Math.abs(a))
  return { kind: 'complex', delta, vertex, roots: [{ re, im: -im }, { re, im }] }
}

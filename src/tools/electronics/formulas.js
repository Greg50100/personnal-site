/**
 * Formules partagées entre les calculateurs et leurs schémas (le schéma affiche les valeurs calculées).
 */

/** LM317 : tension de référence et courant de la broche ADJ. */
export const LM317_VREF = 1.25
export const LM317_IADJ = 50e-6

export const lm317Vout = (r1, r2) => LM317_VREF * (1 + r2 / r1) + LM317_IADJ * r2
/** R2 pour une tension de sortie donnée (Iadj compris). */
export const lm317R2 = (vout, r1) => (vout - LM317_VREF) / (LM317_VREF / r1 + LM317_IADJ)

/**
 * Atténuateur résistif adapté symétrique, K = 10^(A/20).
 * T : bras série Z₀ (K − 1)/(K + 1), branche 2 Z₀ K/(K² − 1) ; π : branches Z₀ (K + 1)/(K − 1), série Z₀ (K² − 1)/(2K).
 */
export function attenuator(z0, db, topology) {
  const k = 10 ** (db / 20)
  return topology === 'pi' ? { shunt: (z0 * (k + 1)) / (k - 1), series: (z0 * (k * k - 1)) / (2 * k) } : { series: (z0 * (k - 1)) / (k + 1), shunt: (2 * z0 * k) / (k * k - 1) }
}

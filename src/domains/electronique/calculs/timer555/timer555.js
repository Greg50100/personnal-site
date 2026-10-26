/** Temporisateur NE555 (porté de Ganymede) : modes astable et monostable. */

const LN2 = Math.LN2 // ≈ 0,693
const LN3 = Math.log(3) // ≈ 1,0986 (souvent arrondi à 1,1)

/** Astable : t_haut = ln2·(R1+R2)·C, t_bas = ln2·R2·C. */
export function astable({ r1, r2, c }) {
  if (![r1, r2, c].every((x) => Number.isFinite(x) && x > 0)) return null
  const high = LN2 * (r1 + r2) * c
  const low = LN2 * r2 * c
  const period = high + low
  return { high, low, period, frequency: 1 / period, duty: high / period }
}

/** Monostable : durée de l'impulsion T = ln3·R·C ≈ 1,1·R·C. */
export function monostable({ r, c }) {
  if (![r, c].every((x) => Number.isFinite(x) && x > 0)) return null
  return { width: LN3 * r * c }
}

/**
 * Conception astable : R1 et R2 pour une fréquence et un rapport cyclique (> 50 %) donnés avec C fixé.
 * Renvoie null si le rapport cyclique demandé est impossible sans diode.
 */
export function designAstable({ frequency, duty, c }) {
  if (![frequency, duty, c].every((x) => Number.isFinite(x) && x > 0) || duty <= 0.5 || duty >= 1) return null
  const period = 1 / frequency
  const r2 = ((1 - duty) * period) / (LN2 * c)
  const r1 = (duty * period) / (LN2 * c) - r2
  return { r1, r2 }
}

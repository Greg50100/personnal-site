/** Pont diviseur de tension (porté de Ganymede, avec prise en compte d'une charge). */
import { nearestInSeries } from '../resistor/colors'

/** R2 en parallèle avec la charge RL (RL absente ou infinie = pas de charge). */
const lower = (r2, rl) => (Number.isFinite(rl) && rl > 0 ? (r2 * rl) / (r2 + rl) : r2)

/** Vout = Vin × R2 / (R1 + R2), courant et puissances dissipées. Renvoie null si impossible. */
export function solveDivider({ vin, r1, r2, rl }) {
  if (![vin, r1, r2].every(Number.isFinite) || r1 < 0 || r2 < 0 || r1 + r2 === 0) return null
  const r2eff = lower(r2, rl)
  const vout = (vin * r2eff) / (r1 + r2eff)
  const current = vin / (r1 + r2eff)
  const unloaded = (vin * r2) / (r1 + r2)
  return {
    vout,
    unloaded,
    ratio: vout / vin,
    current,
    p1: current * current * r1,
    p2: (vout * vout) / r2,
    pLoad: Number.isFinite(rl) && rl > 0 ? (vout * vout) / rl : 0,
  }
}

/**
 * R2 nécessaire pour obtenir `vout` à partir de `vin` et `r1` (sans charge),
 * avec les valeurs normalisées de la série encadrant le résultat.
 */
export function findR2({ vin, vout, r1 }, series = 'E24') {
  if (![vin, vout, r1].every(Number.isFinite) || r1 <= 0 || vout <= 0 || vout >= vin) return null
  const r2 = (r1 * vout) / (vin - vout)
  const candidates = nearestInSeries(r2, series).map((value) => {
    const v = (vin * value) / (r1 + value)
    return { r2: value, vout: v, error: (v - vout) / vout }
  })
  return { r2, candidates }
}

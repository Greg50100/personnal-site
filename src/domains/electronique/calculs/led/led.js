/** Résistance série pour LED (porté de Ganymede, avec valeur normalisée et puissance). */
import { nearestInSeries } from '../resistor/colors'

/** Tensions directes typiques selon la couleur (V) et courant nominal habituel (mA). */
export const LED_PRESETS = [
  { id: 'rouge', label: 'Rouge', vf: 2.0, color: '#ef4444' },
  { id: 'orange', label: 'Orange', vf: 2.1, color: '#f97316' },
  { id: 'jaune', label: 'Jaune', vf: 2.1, color: '#facc15' },
  { id: 'vert', label: 'Vert (standard)', vf: 2.2, color: '#22c55e' },
  { id: 'vert-pur', label: 'Vert pur', vf: 3.0, color: '#10b981' },
  { id: 'bleu', label: 'Bleu', vf: 3.2, color: '#3b82f6' },
  { id: 'blanc', label: 'Blanc', vf: 3.2, color: '#f4f4f5' },
  { id: 'ir', label: 'Infrarouge', vf: 1.3, color: '#7f1d1d' },
  { id: 'uv', label: 'Ultraviolet', vf: 3.4, color: '#a855f7' },
]

/** Puissances normalisées courantes des résistances (W). */
const POWER_RATINGS = [0.125, 0.25, 0.5, 1, 2, 3, 5, 10]

/**
 * R = (Vs − n·Vf) / I. Retourne aussi la valeur normalisée immédiatement supérieure
 * (le courant reste sous la consigne) et la puissance conseillée (marge ×2).
 */
export function solveLed({ supply, vf, currentA, count = 1 }, series = 'E24') {
  if (![supply, vf, currentA].every(Number.isFinite) || currentA <= 0 || count < 1) return { error: 'missing' }
  const drop = supply - vf * count
  if (drop <= 0) return { error: 'voltage', totalVf: vf * count }
  const r = drop / currentA
  const standard = nearestInSeries(r, series).find((v) => v >= r * (1 - 1e-9)) ?? r
  const actualCurrent = drop / standard
  const pResistor = actualCurrent * actualCurrent * standard
  return {
    r,
    standard,
    actualCurrent,
    pResistor,
    rating: POWER_RATINGS.find((p) => p >= pResistor * 2) ?? null,
    pLed: vf * actualCurrent * count,
    efficiency: (vf * count) / supply,
  }
}

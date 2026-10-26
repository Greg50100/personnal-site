/**
 * FILS : AWG ET SECTIONS MÉTRIQUES
 * --------------------------------
 * AWG (ASTM B258) : d = 0,127 mm × 92^((36 − n) / 39), avec n = 0, −1, −2, −3 pour 1/0, 2/0, 3/0, 4/0.
 * Résistance du cuivre recuit à 20 °C : ρ = 0,017 24 Ω·mm²/m (étalon IACS), soit R = 17,24 / S Ω/km.
 */

export const RHO_CU = 0.01724 // Ω·mm²/m

export const awgDiameter = (n) => 0.127 * 92 ** ((36 - n) / 39)
export const awgArea = (n) => (Math.PI / 4) * awgDiameter(n) ** 2
export const resistancePerKm = (area) => (RHO_CU / area) * 1000

/** Jauge AWG (réelle) d'une section en mm². */
export function awgFromArea(area) {
  const d = Math.sqrt((4 * area) / Math.PI)
  return 36 - 39 * Math.log(d / 0.127) / Math.log(92)
}

/** Libellé AWG : 4/0, 3/0, 2/0, 1/0 pour n ≤ 0. */
export const awgLabel = (n) => (n <= 0 ? `${1 - n}/0` : String(n))

export const nearestAwg = (area) => Math.round(awgFromArea(area))

/** Sections normalisées des câbles (IEC 60228), en mm². */
export const METRIC_SECTIONS = [0.05, 0.08, 0.14, 0.25, 0.34, 0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95]

/** Jauges du tableau : de 4/0 (n = −3) à 40. */
export const AWG_RANGE = Array.from({ length: 44 }, (_, i) => i - 3)

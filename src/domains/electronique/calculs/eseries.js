/** Séries normalisées CEI 60063 (valeurs d'une décade). */
export const E_SERIES = {
  E3: [10, 22, 47],
  E6: [10, 15, 22, 33, 47, 68],
  E12: [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82],
  E24: [10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91],
  E192: [
    100, 101, 102, 104, 105, 106, 107, 109, 110, 111, 113, 114, 115, 117, 118, 120, 121, 123, 124, 126, 127, 129, 130, 132, 133, 135, 137,
    138, 140, 142, 143, 145, 147, 149, 150, 152, 154, 156, 158, 160, 162, 164, 165, 167, 169, 172, 174, 176, 178, 180, 182, 184, 187, 189,
    191, 193, 196, 198, 200, 203, 205, 208, 210, 213, 215, 218, 221, 223, 226, 229, 232, 234, 237, 240, 243, 246, 249, 252, 255, 258, 261,
    264, 267, 271, 274, 277, 280, 284, 287, 291, 294, 298, 301, 305, 309, 312, 316, 320, 324, 328, 332, 336, 340, 344, 348, 352, 357, 361,
    365, 370, 374, 379, 383, 388, 392, 397, 402, 407, 412, 417, 422, 427, 432, 437, 442, 448, 453, 459, 464, 470, 475, 481, 487, 493, 499,
    505, 511, 517, 523, 530, 536, 542, 549, 556, 562, 569, 576, 583, 590, 597, 604, 612, 619, 626, 634, 642, 649, 657, 665, 673, 681, 690,
    698, 706, 715, 723, 732, 741, 750, 759, 768, 777, 787, 796, 806, 816, 825, 835, 845, 856, 866, 876, 887, 898, 909, 920, 931, 942, 953,
    965, 976, 988,
  ],
}
E_SERIES.E96 = E_SERIES.E192.filter((_, i) => i % 2 === 0)
E_SERIES.E48 = E_SERIES.E96.filter((_, i) => i % 2 === 0)

/** Tolérance usuelle associée à chaque série. */
export const SERIES_TOLERANCE = { E3: 40, E6: 20, E12: 10, E24: 5, E48: 2, E96: 1, E192: 0.5 }

export const SERIES_NAMES = ['E3', 'E6', 'E12', 'E24', 'E48', 'E96', 'E192']

/** Toutes les valeurs de la série entre deux décades voisines de `value`. */
function candidates(value, series) {
  const list = E_SERIES[series]
  const digits = list[0] >= 100 ? 3 : 2
  const decade = 10 ** (Math.floor(Math.log10(value)) - (digits - 1))
  return [decade / 10, decade, decade * 10].flatMap((d) => list.map((v) => parseFloat((v * d).toPrecision(6))))
}

/** Valeurs normalisées encadrant `value` (inférieure et supérieure, confondues si exacte). */
export function nearestInSeries(value, series = 'E24') {
  if (!(value > 0)) return []
  const all = candidates(value, series)
  const below = all.filter((v) => v <= value * (1 + 1e-9)).pop()
  const above = all.find((v) => v >= value * (1 - 1e-9))
  return [...new Set([below, above].filter(Boolean))]
}

/** Valeur normalisée la plus proche (écart relatif minimal). */
export function closestInSeries(value, series = 'E24') {
  return nearestInSeries(value, series).reduce((best, v) => (Math.abs(v / value - 1) < Math.abs(best / value - 1) ? v : best), Infinity)
}

/** Plus petite série contenant exactement la valeur, ou null. */
export function seriesOf(value) {
  if (!(value > 0)) return null
  return SERIES_NAMES.find((s) => nearestInSeries(value, s).some((v) => Math.abs(v / value - 1) < 1e-9)) ?? null
}

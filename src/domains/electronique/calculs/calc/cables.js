/** Résistivités à 20 °C (Ω·m). */
export const MATERIALS = {
  cu: { label: 'Cuivre', rho: 1.68e-8 },
  al: { label: 'Aluminium', rho: 2.65e-8 },
}

/** Sections normalisées (mm²). */
export const SECTIONS = [0.5, 0.75, 1, 1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300]

/** Section (mm²) d'un fil AWG. */
export const awgToMm2 = (awg) => {
  const d = 0.127 * 92 ** ((36 - awg) / 39)
  return (Math.PI / 4) * d * d
}

/** Plus petit calibre AWG (le plus gros numéro) dont la section dépasse `mm2`. */
export function mm2ToAwg(mm2) {
  for (let awg = 40; awg >= -3; awg--) if (awgToMm2(awg) >= mm2) return awg
  return null
}

export const awgLabel = (awg) => (awg <= 0 ? `${'0'.repeat(1 - awg)} AWG (${1 - awg}/0)` : `${awg} AWG`)

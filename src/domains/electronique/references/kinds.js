import { GROUPS } from '../materiel/colors'

/**
 * Couleur de chaque nature de broche (connecteurs et composants), reprise de la palette des brochages de cartes.
 * Les contacts sont teintés (fond léger, contour plein) pour que leur numéro reste lisible à l'encre ;
 * la couleur double toujours un libellé ou le tableau, jamais seule.
 */
export const KIND_STYLE = {
  pwr: { fill: GROUPS.pwr.fill, stroke: GROUPS.pwr.stroke, bg: GROUPS.pwr.bg },
  gnd: { fill: 'fill-night-700 dark:fill-night-300', stroke: 'stroke-night-800 dark:stroke-night-200', bg: 'bg-night-800 dark:bg-night-200' },
  data: { fill: GROUPS.i2c.fill, stroke: GROUPS.i2c.stroke, bg: GROUPS.i2c.bg },
  ctl: { fill: GROUPS.uart.fill, stroke: GROUPS.uart.stroke, bg: GROUPS.uart.bg },
  audio: { fill: GROUPS.adc.fill, stroke: GROUPS.adc.stroke, bg: GROUPS.adc.bg },
  video: { fill: GROUPS.spi.fill, stroke: GROUPS.spi.stroke, bg: GROUPS.spi.bg },
  shield: { fill: 'fill-night-400', stroke: 'stroke-night-400 dark:stroke-night-500', bg: 'bg-night-400' },
  nc: { fill: 'fill-transparent', stroke: 'stroke-night-400 dark:stroke-night-500', bg: 'border border-night-400', dashed: true },
  // Composants : entrées en bleu, sorties en violet, bornes de puissance en gris
  in: { fill: GROUPS.i2c.fill, stroke: GROUPS.i2c.stroke, bg: GROUPS.i2c.bg },
  out: { fill: GROUPS.spi.fill, stroke: GROUPS.spi.stroke, bg: GROUPS.spi.bg },
  term: { fill: 'fill-night-500 dark:fill-night-400', stroke: 'stroke-night-500 dark:stroke-night-400', bg: 'bg-night-500 dark:bg-night-400' },
}

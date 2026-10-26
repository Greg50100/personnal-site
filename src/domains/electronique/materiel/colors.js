/**
 * Couleurs des familles de signaux, communes aux brochages et aux schémas de câblage.
 * Palette validée pour le daltonisme ; la couleur double toujours un libellé, jamais seule.
 */
export const GROUPS = {
  i2c: { label: 'I2C', fill: 'fill-[#2a78d6] dark:fill-[#3987e5]', stroke: 'stroke-[#2a78d6] dark:stroke-[#3987e5]', bg: 'bg-[#2a78d6] dark:bg-[#3987e5]' },
  uart: { label: 'UART', fill: 'fill-[#eb6834] dark:fill-[#d95926]', stroke: 'stroke-[#eb6834] dark:stroke-[#d95926]', bg: 'bg-[#eb6834] dark:bg-[#d95926]' },
  adc: { label: 'Analogique', fill: 'fill-[#1baf7a] dark:fill-[#199e70]', stroke: 'stroke-[#1baf7a] dark:stroke-[#199e70]', bg: 'bg-[#1baf7a] dark:bg-[#199e70]' },
  spi: { label: 'SPI', fill: 'fill-[#6250d6] dark:fill-[#9085e9]', stroke: 'stroke-[#6250d6] dark:stroke-[#9085e9]', bg: 'bg-[#6250d6] dark:bg-[#9085e9]' },
  pwr: { label: 'Alimentation', fill: 'fill-[#e34948] dark:fill-[#e66767]', stroke: 'stroke-[#e34948] dark:stroke-[#e66767]', bg: 'bg-[#e34948] dark:bg-[#e66767]' },
  pwm: { label: 'PWM', fill: 'fill-[#008300]', stroke: 'stroke-[#008300]', bg: 'bg-[#008300]' },
  avoid: { label: 'À éviter ou démarrage', fill: 'fill-[#fab219]', stroke: 'stroke-[#fab219]', bg: 'bg-[#fab219]' },
}

export const NEUTRAL = { fill: 'fill-night-400', stroke: 'stroke-night-400 dark:stroke-night-500' }

/** Trait d'un fil selon son signal (masse et signaux sans famille en gris). */
export const WIRE_STROKE = {
  pwr: GROUPS.pwr.stroke,
  i2c: GROUPS.i2c.stroke,
  spi: GROUPS.spi.stroke,
  uart: GROUPS.uart.stroke,
  adc: GROUPS.adc.stroke,
  pwm: GROUPS.pwm.stroke,
  gnd: 'stroke-night-900 dark:stroke-night-400',
  gpio: 'stroke-night-500 dark:stroke-night-300',
  i2s: 'stroke-night-500 dark:stroke-night-300',
}

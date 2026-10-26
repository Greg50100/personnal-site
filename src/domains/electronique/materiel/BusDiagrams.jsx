import { useId } from 'react'
import { Box, Buffer, CurrentArrow, Dot, Ground, Label, Mosfet, Resistor, Schematic, Terminal, Wire } from '../../../kit/schematic'
import { bufferPins, mosfetPins } from '../../../kit/schematicPins'
import { WIRE_STROKE as S } from './colors'

/**
 * SCHÉMAS DES BUS ET DES ADAPTATEURS DE NIVEAU
 * --------------------------------------------
 * Bus dessinés en « peigne » : les lignes partent de la carte, chaque module s'y pique par un point de connexion.
 * Un croisement sans point n'est pas une connexion. Les couleurs sont celles des brochages (colors.js).
 */

/** Module branché sous des lignes de bus : boîtier, piquages (avec point) et nom en dessous. */
function Tapped({ x, y, w, pins, lines, name, detail }) {
  const box = Box({ x, y, w, h: 40, top: pins.map((p) => p[0]) })
  return (
    <g>
      {pins.map(([pin, line]) => {
        const [px] = box.pins[pin]
        return (
          <g key={pin}>
            <Wire points={[[px, lines[line].y], [px, y]]} className={lines[line].stroke} />
            <Dot at={[px, lines[line].y]} />
          </g>
        )
      })}
      {box.node}
      <Label x={x + w / 2} y={y + 56} weight="bold" size={11.5}>
        {name}
      </Label>
      {detail && (
        <Label x={x + w / 2} y={y + 70} muted mono size={10}>
          {detail}
        </Label>
      )}
    </g>
  )
}

/** Abscisse de chaque broche du haut d'un boîtier de largeur w (même règle que Box). */
const topX = (x, w, n) => Array.from({ length: n }, (_, i) => x + (w / (n + 1)) * (i + 1))

export function I2cBus() {
  const board = Box({ x: 10, y: 50, w: 76, h: 80, title: 'Carte', right: ['SDA', 'SCL'], pitch: 26 })
  const sda = board.pins.SDA[1]
  const scl = board.pins.SCL[1]
  const lines = { sda: { y: sda, stroke: S.i2c }, scl: { y: scl, stroke: S.i2c } }
  const m2 = topX(320, 80, 2)
  return (
    <Schematic width={420} height={230} label="Bus I2C : deux lignes SDA et SCL tirées à 3,3 V par deux résistances, deux modules branchés en parallèle">
      <Wire points={[[118, 20], [190, 20]]} className={S.pwr} />
      <Label x={112} y={24} anchor="end" weight="bold" size={11}>
        3,3 V
      </Label>
      <Resistor a={[140, 20]} b={[140, sda]} label="Rp" side="left" />
      <Resistor a={[175, 20]} b={[175, scl]} label="Rp" />
      <Dot at={[140, 20]} />
      <Wire points={[board.pins.SDA, [m2[0], sda]]} className={S.i2c} />
      <Wire points={[board.pins.SCL, [m2[1], scl]]} className={S.i2c} />
      <Dot at={[140, sda]} />
      <Dot at={[175, scl]} />
      {board.node}
      <Tapped x={220} y={150} w={80} pins={[['SDA', 'sda'], ['SCL', 'scl']]} lines={lines} name="BME280" detail="adresse 0x76" />
      <Tapped x={320} y={150} w={80} pins={[['SDA', 'sda'], ['SCL', 'scl']]} lines={lines} name="BH1750" detail="adresse 0x23" />
    </Schematic>
  )
}

export function SpiBus() {
  const board = Box({ x: 10, y: 30, w: 76, h: 130, title: 'Carte', right: ['SCK', 'MOSI', 'MISO', 'CS1', 'CS2'], pitch: 22 })
  const y = Object.fromEntries(Object.entries(board.pins).map(([k, p]) => [k, p[1]]))
  const lines = {
    sck: { y: y.SCK, stroke: S.spi },
    mosi: { y: y.MOSI, stroke: S.spi },
    miso: { y: y.MISO, stroke: S.spi },
    cs1: { y: y.CS1, stroke: S.spi },
    cs2: { y: y.CS2, stroke: S.spi },
  }
  const m1 = topX(170, 120, 4)
  const m2 = topX(300, 120, 4)
  return (
    <Schematic width={430} height={260} label="Bus SPI : horloge et données partagées, une ligne de sélection CS par module">
      <Wire points={[board.pins.SCK, [m2[0], y.SCK]]} className={S.spi} />
      <Wire points={[board.pins.MOSI, [m2[1], y.MOSI]]} className={S.spi} />
      <Wire points={[board.pins.MISO, [m2[2], y.MISO]]} className={S.spi} />
      <Wire points={[board.pins.CS1, [m1[3], y.CS1]]} className={S.spi} />
      <Wire points={[board.pins.CS2, [m2[3], y.CS2]]} className={S.spi} />
      {board.node}
      <Tapped x={170} y={190} w={120} pins={[['SCK', 'sck'], ['SDI', 'mosi'], ['SDO', 'miso'], ['CS', 'cs1']]} lines={lines} name="Écran" />
      <Tapped x={300} y={190} w={120} pins={[['SCK', 'sck'], ['SDI', 'mosi'], ['SDO', 'miso'], ['CS', 'cs2']]} lines={lines} name="Carte microSD" />
    </Schematic>
  )
}

export function UartLink() {
  const board = Box({ x: 10, y: 30, w: 76, h: 90, title: 'Carte', right: ['TX', 'RX', 'GND'], pitch: 26 })
  const mod = Box({ x: 270, y: 30, w: 76, h: 90, title: 'Module', left: ['TX', 'RX', 'GND'], pitch: 26 })
  const [, tx] = board.pins.TX
  const [, rx] = board.pins.RX
  return (
    <Schematic width={356} height={130} label="Liaison UART : le TX de chaque appareil va sur le RX de l’autre, masse commune">
      <Wire points={[board.pins.TX, [150, tx], [206, rx], mod.pins.RX]} className={S.uart} />
      <Wire points={[board.pins.RX, [150, rx], [206, tx], mod.pins.TX]} className={S.uart} />
      <Wire points={[board.pins.GND, mod.pins.GND]} className={S.gnd} />
      <CurrentArrow at={[118, tx]} />
      <CurrentArrow at={[240, tx]} dir="left" />
      {board.node}
      {mod.node}
    </Schematic>
  )
}

export function OneWireBus() {
  const board = Box({ x: 10, y: 40, w: 76, h: 110, title: 'Carte', right: ['3V3', 'GPIO', 'GND'], pitch: 40 })
  const [, vdd] = board.pins['3V3']
  const [, dq] = board.pins.GPIO
  const [, gnd] = board.pins.GND
  const lines = { vdd: { y: vdd, stroke: S.pwr }, dq: { y: dq, stroke: S.gpio }, gnd: { y: gnd, stroke: S.gnd } }
  const s2 = topX(300, 84, 3)
  return (
    <Schematic width={400} height={250} label="Bus 1-Wire : une ligne de données tirée à 3,3 V par 4,7 kΩ, plusieurs sondes en parallèle">
      <Wire points={[board.pins['3V3'], [s2[2], vdd]]} className={S.pwr} />
      <Wire points={[board.pins.GPIO, [s2[1], dq]]} className={S.gpio} />
      <Wire points={[board.pins.GND, [s2[0], gnd]]} className={S.gnd} />
      <Resistor a={[125, vdd]} b={[125, dq]} label="4,7 kΩ" />
      <Dot at={[125, vdd]} />
      <Dot at={[125, dq]} />
      {board.node}
      <Tapped x={200} y={175} w={84} pins={[['GND', 'gnd'], ['DQ', 'dq'], ['VDD', 'vdd']]} lines={lines} name="DS18B20 n° 1" />
      <Tapped x={300} y={175} w={84} pins={[['GND', 'gnd'], ['DQ', 'dq'], ['VDD', 'vdd']]} lines={lines} name="DS18B20 n° 2" />
    </Schematic>
  )
}

export function I2sBus() {
  const board = Box({ x: 10, y: 30, w: 86, h: 130, title: 'Carte', right: ['BCLK', 'WS', 'DIN', 'DOUT'], pitch: 26 })
  const y = Object.fromEntries(Object.entries(board.pins).map(([k, p]) => [k, p[1]]))
  const lines = { bclk: { y: y.BCLK, stroke: S.i2s }, ws: { y: y.WS, stroke: S.i2s }, din: { y: y.DIN, stroke: S.i2s }, dout: { y: y.DOUT, stroke: S.i2s } }
  const mic = topX(170, 96, 3)
  const amp = topX(300, 120, 3)
  return (
    <Schematic width={430} height={250} label="Bus I2S : horloges BCLK et WS partagées, données du micro vers la carte et de la carte vers l’ampli">
      <Wire points={[board.pins.BCLK, [amp[0], y.BCLK]]} className={S.i2s} />
      <Wire points={[board.pins.WS, [amp[1], y.WS]]} className={S.i2s} />
      <Wire points={[board.pins.DIN, [mic[2], y.DIN]]} className={S.i2s} />
      <Wire points={[board.pins.DOUT, [amp[2], y.DOUT]]} className={S.i2s} />
      <CurrentArrow at={[124, y.DIN]} dir="left" />
      <CurrentArrow at={[124, y.DOUT]} />
      {board.node}
      <Tapped x={170} y={180} w={96} pins={[['SCK', 'bclk'], ['WS', 'ws'], ['SD', 'din']]} lines={lines} name="INMP441" detail="micro" />
      <Tapped x={300} y={180} w={120} pins={[['BCLK', 'bclk'], ['LRC', 'ws'], ['DIN', 'dout']]} lines={lines} name="MAX98357A" detail="ampli" />
    </Schematic>
  )
}

export function DividerShifter() {
  return (
    <Schematic width={290} height={170} label="Pont diviseur : 1 kΩ en série et 2 kΩ vers la masse ramènent 5 V à 3,33 V">
      <Terminal at={[20, 50]} label="Sortie 5 V" side="top" />
      <Resistor a={[20, 50]} b={[130, 50]} label="R1" value="1 kΩ" side="bottom" />
      <Wire points={[[130, 50], [250, 50]]} />
      <Dot at={[130, 50]} />
      <Terminal at={[250, 50]} label="GPIO 3,3 V" side="top" accent />
      <Resistor a={[130, 50]} b={[130, 135]} label="R2" value="2 kΩ" />
      <Ground at={[130, 135]} />
      <Label x={190} y={110} anchor="start" mono size={11}>
        5 × 2 / (1 + 2)
      </Label>
      <Label x={190} y={127} anchor="start" mono size={11} weight="bold">
        = 3,33 V
      </Label>
    </Schematic>
  )
}

export function Bss138Shifter() {
  const t = mosfetPins(165, 110)
  return (
    <Schematic width={330} height={160} label="Adaptateur BSS138 : MOSFET entre le côté 3,3 V et le côté 5 V, grille à 3,3 V, une résistance de tirage de chaque côté">
      <Wire points={[[40, 30], [t.gate[0], 30], t.gate]} className={S.pwr} />
      <Label x={34} y={34} anchor="end" weight="bold" size={11}>
        3,3 V
      </Label>
      <Wire points={[[230, 30], [290, 30]]} className={S.pwr} />
      <Label x={296} y={34} anchor="start" weight="bold" size={11}>
        5 V
      </Label>
      <Resistor a={[90, 30]} b={[90, 110]} label="10 kΩ" side="left" />
      <Resistor a={[250, 30]} b={[250, 110]} label="10 kΩ" />
      <Dot at={[90, 30]} />
      <Mosfet x={165} y={110} label="BSS138" />
      <Wire points={[t.source, [20, 110]]} />
      <Wire points={[t.drain, [310, 110]]} />
      <Dot at={[90, 110]} />
      <Dot at={[250, 110]} />
      <Terminal at={[20, 110]} label="SDA 3,3 V" side="bottom" />
      <Terminal at={[310, 110]} label="SDA 5 V" side="bottom" accent />
    </Schematic>
  )
}

export function AhctShifter() {
  const b = bufferPins(120, 70)
  return (
    <Schematic width={320} height={150} label="Tampon 74AHCT125 alimenté en 5 V : entrée 3,3 V, sortie 5 V vers les LED, OE à la masse">
      <Terminal at={[20, 70]} label="GPIO 3,3 V" side="top" />
      <Wire points={[[20, 70], b.in]} />
      <Buffer x={120} y={70} label="74AHCT125" />
      <Resistor a={b.out} b={[250, 70]} label="330 Ω" />
      <Wire points={[[250, 70], [300, 70]]} />
      <Terminal at={[300, 70]} label="DIN 5 V" side="top" accent />
      <Wire points={[b.oe, [b.oe[0], 112]]} />
      <Ground at={[b.oe[0], 112]} />
      <Label x={b.oe[0] + 8} y={b.oe[1] - 4} anchor="start" mono size={10}>
        OE
      </Label>
      <Label x={190} y={120} anchor="start" muted size={10.5}>
        alimenté en 5 V
      </Label>
    </Schematic>
  )
}

/** Seuils d'entrée (V) : bas en dessous de vil, haut au-dessus de vih, jusqu'à l'alimentation vcc. */
const THRESHOLDS = [
  { name: 'ATmega328P (Uno) en 5 V', vil: 1.5, vih: 3, vcc: 5 },
  { name: '74AHCT125 en 5 V', vil: 0.8, vih: 2, vcc: 5 },
  { name: 'WS2812B en 5 V', vil: 1.5, vih: 3.5, vcc: 5 },
  { name: 'ESP32 en 3,3 V', vil: 0.825, vih: 2.475, vcc: 3.3 },
  { name: 'RP2040 (Pico) en 3,3 V', vil: 0.8, vih: 2, vcc: 3.3 },
]

const ZONE = {
  low: 'fill-night-200 dark:fill-night-700',
  high: 'fill-night-600 dark:fill-night-300',
}

/** Où une sortie 3,3 V tombe dans les seuils de chaque famille. */
export function LevelChart() {
  const hatch = `hachures-${useId().replace(/[^\w-]/g, '')}`
  // Libellés au-dessus des barres : le graphique garde une largeur lisible sur mobile
  const x0 = 12
  const scale = 66
  const px = (v) => x0 + v * scale
  const rowY = (i) => 48 + i * 46
  const bottom = rowY(THRESHOLDS.length) - 14
  return (
    <figure className="space-y-2">
      <svg viewBox={`0 0 ${px(5.5) + 10} ${bottom + 34}`} className="mx-auto block h-auto w-full max-w-lg" role="img" aria-label="Seuils d’entrée des familles logiques comparés à une sortie de 3,3 V">
        <defs>
          <pattern id={hatch} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" strokeWidth="2.5" className="stroke-night-300 dark:stroke-night-600" />
          </pattern>
        </defs>
        {[0, 1, 2, 3, 4, 5].map((v) => (
          <g key={v}>
            <line x1={px(v)} y1={22} x2={px(v)} y2={bottom} strokeWidth="1" className="stroke-night-200 dark:stroke-night-800" />
            <text x={px(v)} y={bottom + 16} textAnchor="middle" className="fill-night-500 font-mono text-[11px]">
              {v} V
            </text>
          </g>
        ))}
        {THRESHOLDS.map((t, i) => {
          const y = rowY(i)
          return (
            <g key={t.name}>
              <text x={x0} y={y - 6} paintOrder="stroke" strokeWidth="4" className="fill-night-800 stroke-white text-[12px] dark:fill-night-100 dark:stroke-night-900">
                {t.name}
              </text>
              <rect x={px(0)} y={y} width={px(t.vil) - px(0)} height="18" className={ZONE.low} />
              <rect x={px(t.vil)} y={y} width={px(t.vih) - px(t.vil)} height="18" fill={`url(#${hatch})`} />
              <rect x={px(t.vih)} y={y} width={px(t.vcc) - px(t.vih)} height="18" className={ZONE.high} />
            </g>
          )
        })}
        {/* Sortie 3,3 V et minimum garanti de l'ESP32 (0,8 × VDD) */}
        <line x1={px(3.3)} y1={18} x2={px(3.3)} y2={bottom} strokeWidth="2.5" className="stroke-accent-500 dark:stroke-accent-400" />
        <text x={px(3.3) + 6} y={16} className="fill-accent-700 text-[11px] font-semibold dark:fill-accent-300">
          sortie 3,3 V
        </text>
        <line x1={px(2.64)} y1={18} x2={px(2.64)} y2={bottom} strokeWidth="2" strokeDasharray="4 3" className="stroke-accent-500 dark:stroke-accent-400" />
        <text x={px(2.64) - 6} y={16} textAnchor="end" className="fill-accent-700 text-[11px] dark:fill-accent-300">
          minimum garanti 2,64 V
        </text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-night-600 dark:text-night-400">
        <span className="inline-flex items-center gap-1.5">
          <svg width="14" height="10" aria-hidden="true">
            <rect width="14" height="10" className={ZONE.low} />
          </svg>
          lu comme 0
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="14" height="10" aria-hidden="true">
            <rect width="14" height="10" fill={`url(#${hatch})`} />
          </svg>
          indéterminé
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="14" height="10" aria-hidden="true">
            <rect width="14" height="10" className={ZONE.high} />
          </svg>
          lu comme 1
        </span>
      </div>
      <figcaption className="text-center text-xs text-night-500">
        Une sortie 3,3 V (trait plein) est lue comme un 1 partout sauf par la WS2812B, et l’ATmega n’a que 0,3 V de marge ; au pire de sa fiche, l’ESP32
        ne garantit que 2,64 V (pointillés).
      </figcaption>
    </figure>
  )
}

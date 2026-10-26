import { useState } from 'react'
import { GROUPS, NEUTRAL } from './colors'
import { parsePin } from './data/pinouts'
import { Links } from './ui'

/**
 * SCHÉMA DE BROCHAGE
 * ------------------
 * Dessine les connecteurs d'une carte (disposition en colonnes ou en rangées) à partir de data/pinouts.js.
 * Chaque broche porte des pastilles de fonction (I2C, SPI, UART, analogique, PWM…) ; un filtre met une famille en évidence
 * et le survol (ou le focus clavier) affiche le détail de la broche.
 */

const TAG_TEXT = {
  boot: 'Broche de démarrage : son niveau à la mise sous tension choisit le mode de la puce ; éviter d’y brancher un module qui la force.',
  flash: 'Reliée à la mémoire flash : ne jamais l’utiliser.',
  psram: 'Utilisée par la PSRAM octale sur les modules « R8 » : indisponible.',
  adc2: 'ADC2 : entrée analogique inutilisable quand le Wi-Fi est actif.',
  in: 'Entrée seulement.',
  usbser: 'Reliée au convertisseur USB-série (téléversement, journaux).',
  usb: 'USB natif : libre seulement si l’USB n’est pas utilisé.',
  led: 'LED de la carte.',
  wake: 'Réveil de la veille profonde (relier à RST).',
  int: 'Interruption externe.',
  id: 'Réservée à l’EEPROM d’identification des cartes d’extension (HAT).',
  onewire: 'Bus 1-Wire par défaut.',
  pwr: 'Alimentation.',
  gnd: 'Masse.',
  nc: 'Non connectée.',
}

/** Pastilles de fonction d'une broche : [{ text, group }]. */
function pinChips(pin) {
  const v = pin.values
  const chips = []
  if (pin.tags.has('i2c')) chips.push({ text: v.i2c, group: 'i2c' })
  if (pin.tags.has('spi')) chips.push({ text: v.spi, group: 'spi' })
  if (pin.tags.has('uart')) chips.push({ text: v.uart, group: 'uart' })
  if (pin.tags.has('adc')) chips.push({ text: v.adc, group: 'adc' })
  if (pin.tags.has('dac')) chips.push({ text: v.dac, group: 'adc' })
  if (pin.tags.has('adc2')) chips.push({ text: 'ADC2', group: 'adc' })
  if (pin.tags.has('pwm')) chips.push({ text: 'PWM', group: 'pwm' })
  if (pin.tags.has('i2s')) chips.push({ text: `I2S ${v.i2s}`, group: null })
  if (pin.tags.has('onewire')) chips.push({ text: '1-Wire', group: null })
  if (pin.tags.has('usb')) chips.push({ text: `USB ${v.usb}`, group: 'avoid' })
  if (pin.tags.has('boot')) chips.push({ text: 'BOOT', group: 'avoid' })
  if (pin.tags.has('flash')) chips.push({ text: 'FLASH', group: 'avoid' })
  if (pin.tags.has('psram')) chips.push({ text: 'PSRAM', group: 'avoid' })
  if (pin.tags.has('id')) chips.push({ text: 'HAT', group: 'avoid' })
  return chips.filter((c) => c.text !== pin.name)
}

/** Familles auxquelles appartient une broche (pour le filtre). */
function pinGroups(pin) {
  const groups = new Set(pinChips(pin).map((c) => c.group).filter(Boolean))
  if (pin.tags.has('pwr') || pin.tags.has('gnd')) groups.add('pwr')
  if (pin.tags.has('usbser')) groups.add('avoid')
  return groups
}

const charW = (size) => size * 0.62
const textW = (text, size = 11) => text.length * charW(size)

function PinDot({ pin, x, y, square }) {
  const avoid = pinGroups(pin).has('avoid')
  let cls = 'fill-white stroke-night-500 dark:fill-night-200 dark:stroke-night-300'
  if (pin.tags.has('pwr')) cls = `${GROUPS.pwr.fill} stroke-white dark:stroke-night-900`
  else if (pin.tags.has('gnd')) cls = 'fill-night-900 stroke-night-400 dark:fill-night-950 dark:stroke-night-400'
  else if (pin.tags.has('ctl')) cls = 'fill-night-400 stroke-night-500'
  else if (pin.tags.has('nc')) cls = 'fill-transparent stroke-night-400'
  return (
    <g>
      {avoid && <circle cx={x} cy={y} r="8" fill="none" strokeWidth="2.5" className={GROUPS.avoid.stroke} />}
      {square ? <rect x={x - 5} y={y - 5} width="10" height="10" strokeWidth="1.5" className={cls} /> : <circle cx={x} cy={y} r="5" strokeWidth="1.5" className={cls} />}
    </g>
  )
}

/** Pastille de texte (fond teinté, bordure colorée, texte à l'encre). */
function Chip({ x, y, text, group, anchor }) {
  const w = textW(text, 9.5) + 8
  const x0 = anchor === 'end' ? x - w : x
  const g = GROUPS[group] ?? NEUTRAL
  return (
    <g>
      <rect x={x0} y={y - 7.5} width={w} height="15" rx="4" className={`${g.fill} ${g.stroke}`} fillOpacity="0.14" strokeWidth="1" />
      <text x={x0 + w / 2} y={y + 3.5} textAnchor="middle" className="fill-night-700 font-mono text-[9.5px] dark:fill-night-200">
        {text}
      </text>
    </g>
  )
}

const COL = { pitch: 24, board: 128, name: 74, chips: 190, top: 46, bottom: 40 }

function Columns({ pinout, focus, setFocus, highlight, prefix = '' }) {
  const left = pinout.left.map(parsePin)
  const right = pinout.right.map(parsePin)
  const n = Math.max(left.length, right.length)
  const bx = COL.chips + COL.name + 10
  const W = bx * 2 + COL.board
  const H = COL.top + n * COL.pitch + COL.bottom
  const y = (i) => COL.top + COL.pitch / 2 + i * COL.pitch
  const lx = bx + 18
  const rx = bx + COL.board - 18
  const num = (side, i) => {
    const spec = pinout.numbers?.[side]
    return spec ? spec[0] + i * spec[1] : null
  }

  const renderSide = (pins, side) =>
    pins.map((pin, i) => {
      const x = side === 'left' ? lx : rx
      const dim = highlight && !pinGroups(pin).has(highlight)
      const chips = pinChips(pin)
      const nameX = side === 'left' ? bx - 8 : bx + COL.board + 8
      let cx = side === 'left' ? nameX - textW(pin.name) - 8 : nameX + textW(pin.name) + 8
      const key = `${prefix}${side}${i}`
      const isFocus = focus === key
      const n0 = num(side, i)
      return (
        <g
          key={key}
          tabIndex={0}
          role="button"
          aria-label={`${pin.name}${chips.length ? ` : ${chips.map((c) => c.text).join(', ')}` : ''}`}
          onMouseEnter={() => setFocus(key, pin)}
          onFocus={() => setFocus(key, pin)}
          onClick={() => setFocus(key, pin)}
          className="cursor-pointer outline-none"
          opacity={dim ? 0.22 : 1}
        >
          <rect x={side === 'left' ? 0 : bx + COL.board - 30} y={y(i) - COL.pitch / 2} width={bx + 30} height={COL.pitch} fill="transparent" />
          {isFocus && <rect x={side === 'left' ? 4 : bx + COL.board - 30} y={y(i) - COL.pitch / 2 + 1} width={bx + 26} height={COL.pitch - 2} rx="6" className="fill-accent-400/15" />}
          <PinDot pin={pin} x={x} y={y(i)} square={n0 === 1} />
          {n0 != null && (
            <text x={side === 'left' ? x + 11 : x - 11} y={y(i) + 3.5} textAnchor={side === 'left' ? 'start' : 'end'} className="fill-night-500 font-mono text-[9px]">
              {n0}
            </text>
          )}
          <text x={nameX} y={y(i) + 4} textAnchor={side === 'left' ? 'end' : 'start'} className="fill-night-900 font-mono text-[11px] font-semibold dark:fill-night-50">
            {pin.name}
          </text>
          {chips.map((c) => {
            const w = textW(c.text, 9.5) + 8
            const chip = <Chip key={c.text} x={cx} y={y(i)} text={c.text} group={c.group} anchor={side === 'left' ? 'end' : 'start'} />
            cx += side === 'left' ? -(w + 4) : w + 4
            return chip
          })}
        </g>
      )
    })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full min-w-[620px] max-w-[780px]" role="img" aria-label="Schéma de brochage">
      <rect x={bx} y={COL.top - 12} width={COL.board} height={n * COL.pitch + 24} rx="10" className="fill-night-100 stroke-night-300 dark:fill-night-800 dark:stroke-night-600" />
      {pinout.top && (
        <>
          {!pinout.header && <rect x={bx + 24} y={COL.top - 32} width={COL.board - 48} height="18" rx="4" className="fill-night-200 stroke-night-300 dark:fill-night-700 dark:stroke-night-600" />}
          <text x={bx + COL.board / 2} y={COL.top - 37} textAnchor="middle" className="fill-night-500 text-[10px]">
            {pinout.top}
          </text>
        </>
      )}
      {pinout.bottom && (
        <text x={bx + COL.board / 2} y={COL.top + n * COL.pitch + 30} textAnchor="middle" className="fill-night-500 text-[10px]">
          {pinout.bottom}
        </text>
      )}
      {renderSide(left, 'left')}
      {renderSide(right, 'right')}
    </svg>
  )
}

const ROW = { pitch: 21, label: 118, board: 150, marginX: 64 }

function Rows({ pinout, focus, setFocus, highlight }) {
  const top = pinout.top.map(parsePin)
  const bottom = pinout.bottom.map(parsePin)
  const n = Math.max(top.length, bottom.length)
  const W = ROW.marginX + n * ROW.pitch + 24
  const H = ROW.label * 2 + ROW.board
  const by = ROW.label
  const x = (i) => ROW.marginX + ROW.pitch / 2 + i * ROW.pitch
  const label = (pin) => [pin.name, ...pinChips(pin).map((c) => c.text)].join(' · ')

  const renderRow = (pins, side) =>
    pins.map((pin, i) => {
      if (pin.gap) return null
      const py = side === 'top' ? by + 16 : by + ROW.board - 16
      const ty = side === 'top' ? by - 8 : by + ROW.board + 8
      const dim = highlight && !pinGroups(pin).has(highlight)
      const groups = [...pinGroups(pin)].filter((g) => g !== 'pwr')
      const key = `${side}${i}`
      return (
        <g
          key={key}
          tabIndex={0}
          role="button"
          aria-label={label(pin)}
          onMouseEnter={() => setFocus(key, pin)}
          onFocus={() => setFocus(key, pin)}
          onClick={() => setFocus(key, pin)}
          className="cursor-pointer outline-none"
          opacity={dim ? 0.22 : 1}
        >
          <rect x={x(i) - ROW.pitch / 2} y={side === 'top' ? 0 : by + ROW.board / 2} width={ROW.pitch} height={ROW.label + ROW.board / 2} fill="transparent" />
          {focus === key && <rect x={x(i) - ROW.pitch / 2 + 1} y={side === 'top' ? 2 : by + ROW.board - 30} width={ROW.pitch - 2} height={ROW.label + 28} rx="6" className="fill-accent-400/15" />}
          <PinDot pin={pin} x={x(i)} y={py} />
          {groups.map((g, k) => (
            <rect key={g} x={x(i) - 3.5} y={side === 'top' ? py + 10 + k * 9 : py - 17 - k * 9} width="7" height="7" rx="1.5" className={GROUPS[g].fill} />
          ))}
          <text
            x={x(i) + 4}
            y={ty}
            transform={`rotate(${side === 'top' ? -90 : 90} ${x(i) + 4} ${ty})`}
            textAnchor="start"
            className="fill-night-900 font-mono text-[10.5px] dark:fill-night-50"
          >
            {label(pin)}
          </text>
        </g>
      )
    })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full min-w-[640px] max-w-[1100px]" role="img" aria-label="Schéma de brochage">
      <rect x="40" y={by} width={W - 52} height={ROW.board} rx="12" className="fill-night-100 stroke-night-300 dark:fill-night-800 dark:stroke-night-600" />
      <rect x="28" y={by + 22} width="40" height="34" rx="3" className="fill-night-300 stroke-night-400 dark:fill-night-600" />
      <text x="48" y={by + 43} textAnchor="middle" className="fill-night-700 text-[10px] dark:fill-night-100">
        USB
      </text>
      <rect x="28" y={by + ROW.board - 50} width="34" height="30" rx="3" className="fill-night-300 stroke-night-400 dark:fill-night-600" />
      <text x="45" y={by + ROW.board - 31} textAnchor="middle" className="fill-night-700 text-[10px] dark:fill-night-100">
        Jack
      </text>
      {renderRow(top, 'top')}
      {renderRow(bottom, 'bottom')}
    </svg>
  )
}

function PinDetail({ pin }) {
  if (!pin) return <p className="text-sm text-night-500">Survolez ou touchez une broche pour en voir le détail.</p>
  const chips = pinChips(pin)
  const notes = [...pin.tags].map((t) => TAG_TEXT[t]).filter(Boolean)
  return (
    <div className="text-sm">
      <p className="font-mono font-semibold text-night-900 dark:text-night-50">
        {pin.name}
        {pin.values.gpio != null && pin.name !== `GPIO${pin.values.gpio}` && <span className="ml-2 font-sans font-normal text-night-500">GPIO{pin.values.gpio}</span>}
        {chips.length > 0 && <span className="ml-2 font-sans font-normal text-night-600 dark:text-night-300">{chips.map((c) => c.text).join(' · ')}</span>}
      </p>
      {[pin.note, ...notes].filter(Boolean).map((n) => (
        <p key={n} className="text-night-600 dark:text-night-400">
          {n}
        </p>
      ))}
    </div>
  )
}

export default function PinoutDiagram({ pinout }) {
  const [focus, setFocusState] = useState(null) // { key, pin }
  const [highlight, setHighlight] = useState(null)
  if (!pinout) return null
  const lists = pinout.layout === 'rows' ? [pinout.top, pinout.bottom, pinout.extra?.left ?? [], pinout.extra?.right ?? []] : [pinout.left, pinout.right]
  const present = new Set(lists.flat().flatMap((s) => [...pinGroups(parsePin(s))]))
  // Les notes propres à la carte sont rattachées à la broche par son nom
  const setFocus = (key, pin) => setFocusState({ key, pin: { ...pin, note: pinout.notes?.[pin.name] } })
  const common = { focus: focus?.key, setFocus, highlight }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Mettre une famille de broches en évidence">
        <span className="mr-1 text-xs font-medium text-night-500">Mettre en évidence</span>
        {Object.entries(GROUPS)
          .filter(([id]) => present.has(id))
          .map(([id, g]) => (
            <button
              key={id}
              type="button"
              aria-pressed={highlight === id}
              onClick={() => setHighlight(highlight === id ? null : id)}
              className={`chip cursor-pointer gap-1.5 px-2.5 py-1 text-xs ${highlight === id ? 'border-accent-400 bg-accent-400/15' : ''}`}
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-sm ${g.bg}`} />
              {g.label}
            </button>
          ))}
      </div>
      <div className="overflow-x-auto rounded-xl bg-night-50 p-2 dark:bg-night-950">
        {pinout.layout === 'rows' ? <Rows pinout={pinout} {...common} /> : <Columns pinout={pinout} {...common} />}
        {pinout.extra && (
          <div className="mt-2">
            <p className="label px-2">{pinout.extra.title}</p>
            <Columns pinout={pinout.extra} prefix="extra-" {...common} />
          </div>
        )}
      </div>
      <div className="min-h-[3rem] rounded-xl border border-night-200 px-3 py-2 dark:border-night-800" aria-live="polite">
        <PinDetail pin={focus?.pin} />
      </div>
      {pinout.legend && <p className="text-xs text-night-500">{pinout.legend}</p>}
      {pinout.source && <Links links={[pinout.source]} />}
    </div>
  )
}

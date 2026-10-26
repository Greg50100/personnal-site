import { useState } from 'react'
import { BOARDS, FAMILIES } from './data/boards'
import { PINOUTS, parsePin } from './data/pinouts'
import PinoutDiagram from './PinoutDiagram'
import { SearchField } from './ui'
import { useLocalStorage } from '../../hooks/useLocalStorage'

/** Toutes les broches d'un brochage, avec leur côté, pour le tableau de recherche. */
function allPins(pinout) {
  const sides =
    pinout.layout === 'rows'
      ? [['Rangée du haut', pinout.top], ['Rangée du bas', pinout.bottom], ['Double, gauche', pinout.extra?.left ?? []], ['Double, droite', pinout.extra?.right ?? []]]
      : [['Gauche', pinout.left], ['Droite', pinout.right]]
  return sides.flatMap(([side, list]) =>
    list
      .map((spec, i) => ({ side, i, pin: parsePin(spec) }))
      .filter(({ pin }) => !pin.gap)
      .map(({ side, i, pin }) => {
        const n = pinout.numbers?.[side === 'Gauche' ? 'left' : 'right']
        return { side, number: n ? n[0] + i * n[1] : i + 1, pin }
      }),
  )
}

const describe = (pin) =>
  [
    pin.values.gpio != null && `GPIO${pin.values.gpio}`,
    pin.values.i2c && `I2C ${pin.values.i2c}`,
    pin.values.spi && `SPI ${pin.values.spi}`,
    pin.values.uart && `UART ${pin.values.uart}`,
    pin.values.adc && `analogique ${pin.values.adc}`,
    pin.tags.has('adc2') && 'ADC2',
    pin.values.dac && pin.values.dac,
    pin.tags.has('pwm') && 'PWM',
    pin.values.i2s && `I2S ${pin.values.i2s}`,
    pin.tags.has('boot') && 'démarrage',
    pin.tags.has('flash') && 'flash',
    pin.tags.has('psram') && 'PSRAM',
    pin.tags.has('in') && 'entrée seulement',
    pin.tags.has('pwr') && 'alimentation',
    pin.tags.has('gnd') && 'masse',
  ]
    .filter(Boolean)
    .join(' · ')

export default function Pinouts() {
  const [boardId, setBoardId] = useLocalStorage('materiel-brochage', 'esp32')
  const [query, setQuery] = useState('')
  const board = BOARDS.find((b) => b.id === boardId) ?? BOARDS[0]
  const pinout = PINOUTS[board.id]
  const q = query.trim().toLowerCase()
  const rows = allPins(pinout).filter(({ pin }) => !q || `${pin.name} ${describe(pin)}`.toLowerCase().includes(q))

  return (
    <div className="space-y-6">
      <div className="card card-pad flex flex-wrap items-end gap-4">
        <div className="min-w-[16rem]">
          <label htmlFor="pinout-board" className="label">
            Carte
          </label>
          <select id="pinout-board" className="input" value={board.id} onChange={(e) => setBoardId(e.target.value)}>
            {FAMILIES.map((f) => (
              <optgroup key={f.id} label={f.label}>
                {BOARDS.filter((b) => b.family === f.id).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <p className="max-w-xl text-sm text-night-600 dark:text-night-400">{board.summary}</p>
      </div>

      <section className="card card-pad">
        <PinoutDiagram key={board.id} pinout={pinout} />
      </section>

      <section className="card card-pad space-y-3" aria-labelledby="pin-table-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="pin-table-title" className="label !mb-0">
            Toutes les broches
          </h2>
          <SearchField value={query} onChange={setQuery} placeholder="Chercher (SDA, ADC, GPIO21…)" />
        </div>
        <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
          <table className="table-data">
            <thead>
              <tr>
                <th>Côté</th>
                <th>N°</th>
                <th>Broche</th>
                <th>Fonctions</th>
                <th>À savoir</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ side, number, pin }) => (
                <tr key={`${side}-${number}-${pin.name}`}>
                  <td>{side}</td>
                  <td className="font-mono">{number}</td>
                  <td className="font-mono font-semibold">{pin.name}</td>
                  <td className="!whitespace-normal">{describe(pin)}</td>
                  <td className="min-w-[14rem] !whitespace-normal text-night-600 dark:text-night-400">{pinout.notes?.[pin.name] ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

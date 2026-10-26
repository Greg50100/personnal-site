import { useState } from 'react'
import { parsePin } from './data/pinouts'
import { SearchField } from './ui'

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

/** Tableau cherchable de toutes les broches d'une carte, avec leurs fonctions et les remarques propres à la carte. */
export default function PinTable({ pinout }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const rows = allPins(pinout).filter(({ pin }) => !q || `${pin.name} ${describe(pin)}`.toLowerCase().includes(q))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="label !mb-0">Toutes les broches</p>
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
      {q && !rows.length && <p className="text-sm text-night-500">Aucune broche ne correspond.</p>}
    </div>
  )
}

import { useState } from 'react'
import { Moon, Plus, Radio, Sun, X } from 'lucide-react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { useNow } from '../../hooks/useNow'
import { ALL_ZONES, CITIES, CITY_NAMES, DEFAULT_ZONES, LOCAL, fromWallTime, wallTime, zoneName, zoneOffset } from './timezones'

const pad = (n) => String(n).padStart(2, '0')
const toInput = (w) => `${w.year}-${pad(w.month)}-${pad(w.day)}T${pad(w.hour)}:${pad(w.minute)}`
const offsetLabel = (min) => `UTC${min >= 0 ? '+' : '−'}${Math.floor(Math.abs(min) / 60)}${Math.abs(min) % 60 ? `:${pad(Math.abs(min) % 60)}` : ''}`
const diffLabel = (min) => (min === 0 ? 'même heure' : `${min > 0 ? '+' : '−'}${Math.floor(Math.abs(min) / 60)} h${Math.abs(min) % 60 ? ` ${pad(Math.abs(min) % 60)}` : ''}`)

function isDst(date, zone) {
  const y = wallTime(date, zone).year
  const jan = zoneOffset(new Date(Date.UTC(y, 0, 15)), zone)
  const jul = zoneOffset(new Date(Date.UTC(y, 6, 15)), zone)
  return jan !== jul && zoneOffset(date, zone) === Math.max(jan, jul)
}

const dayFmt = (zone) => new Intl.DateTimeFormat('fr-FR', { timeZone: zone, weekday: 'short', day: 'numeric', month: 'short' })

function hourClass(h) {
  if (h >= 9 && h < 18) return 'bg-accent-400/30 text-night-900 dark:text-accent-100'
  if (h >= 7 && h < 21) return 'bg-sky-400/15 text-night-700 dark:text-sky-100'
  return 'bg-night-800/80 text-night-300 dark:bg-night-950'
}

export default function TimeZones() {
  const [zones, setZones] = useLocalStorage('timezones', DEFAULT_ZONES)
  const [source, setSource] = useLocalStorage('timezones-source', LOCAL)
  const [fixed, setFixed] = useState(null)
  const [adding, setAdding] = useState('')
  const now = useNow(1000, fixed == null)
  const date = fixed ?? now

  const sourceWall = wallTime(date, source)
  // Colonnes : de 0 h à 23 h dans le fuseau de référence
  const startHour = fromWallTime(`${sourceWall.year}-${pad(sourceWall.month)}-${pad(sourceWall.day)}T00:00`, source).getTime()
  const hours = Array.from({ length: 24 }, (_, i) => new Date(startHour + i * 3_600_000))
  const currentCol = Math.floor((date.getTime() - startHour) / 3_600_000)

  const addable = ALL_ZONES.filter((z) => !zones.includes(z))
  const options = [...CITIES.map(([z]) => z).filter((z) => addable.includes(z) || z === 'UTC'), ...addable.filter((z) => !CITY_NAMES[z])].filter(
    (z, i, arr) => !zones.includes(z) && arr.indexOf(z) === i,
  )

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-1">
          <span className="label">Date et heure</span>
          <input
            type="datetime-local"
            className="input font-mono"
            value={toInput(sourceWall)}
            onChange={(e) => e.target.value && setFixed(fromWallTime(e.target.value, source))}
          />
        </label>
        <label className="grid gap-1">
          <span className="label">dans le fuseau de</span>
          <select className="input" value={source} onChange={(e) => setSource(e.target.value)}>
            {[...new Set([LOCAL, ...zones, ...CITIES.map(([z]) => z)])].map((z) => (
              <option key={z} value={z}>
                {zoneName(z)}
                {z === LOCAL ? ' (cet appareil)' : ''}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => setFixed(null)} className={`btn ${fixed == null ? 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400' : ''}`}>
          <Radio size={15} className={fixed == null ? 'animate-pulse' : ''} /> {fixed == null ? 'Temps réel' : 'Maintenant'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {zones.map((zone) => {
          const w = wallTime(date, zone)
          const off = zoneOffset(date, zone)
          const day = w.hour >= 7 && w.hour < 20
          return (
            <article key={zone} className="card relative p-4">
              <button
                type="button"
                className="absolute right-2 top-2 rounded p-1 text-night-400 hover:text-red-500"
                onClick={() => setZones(zones.filter((z) => z !== zone))}
                aria-label={`Retirer ${zoneName(zone)}`}
              >
                <X size={14} />
              </button>
              <p className="flex items-center gap-1.5 pr-6 font-semibold">
                {day ? <Sun size={14} className="text-accent-500" /> : <Moon size={14} className="text-sky-400" />}
                {zoneName(zone)}
              </p>
              <p className="font-mono text-3xl font-semibold tabular-nums">
                {pad(w.hour)}:{pad(w.minute)}
                <span className="text-base text-night-400">:{pad(w.second)}</span>
              </p>
              <p className="text-sm text-night-600 dark:text-night-400">{dayFmt(zone).format(date)}</p>
              <p className="mt-1 text-xs text-night-500">
                {offsetLabel(off)}
                {isDst(date, zone) ? ' · heure d’été' : ''} · {diffLabel(off - zoneOffset(date, source))}
              </p>
            </article>
          )
        })}
        <div className="card flex flex-col justify-center gap-2 p-4">
          <label className="label" htmlFor="add-zone">
            Ajouter une ville ou un fuseau
          </label>
          <div className="flex gap-2">
            <select id="add-zone" className="input min-w-0 flex-1" value={adding} onChange={(e) => setAdding(e.target.value)}>
              <option value="">Choisir…</option>
              {options.map((z) => (
                <option key={z} value={z}>
                  {zoneName(z)}
                  {CITY_NAMES[z] ? '' : ` (${z})`}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-icon"
              disabled={!adding}
              onClick={() => {
                setZones([...zones, adding])
                setAdding('')
              }}
              aria-label="Ajouter"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-night-200 px-4 py-3 dark:border-night-800">
          <h2 className="font-display font-semibold">Planificateur sur 24 heures</h2>
          <p className="text-xs text-night-500">Cliquez sur une colonne pour choisir l'heure. Ambre : heures de bureau (9 h – 18 h) ; bleu : journée ; sombre : nuit.</p>
        </div>
        <div className="overflow-x-auto p-3">
          <table className="w-full border-separate border-spacing-0.5 text-center font-mono text-xs">
            <tbody>
              {zones.map((zone) => (
                <tr key={zone}>
                  <th scope="row" className="sticky left-0 z-10 bg-white pr-2 text-left font-sans text-xs font-medium whitespace-nowrap dark:bg-night-900">
                    {zoneName(zone)}
                  </th>
                  {hours.map((h, i) => {
                    const w = wallTime(h, zone)
                    return (
                      <td
                        key={i}
                        onClick={() => setFixed(new Date(h.getTime() + (date.getTime() - startHour) % 3_600_000))}
                        className={`min-w-8 cursor-pointer rounded px-1 py-1.5 ${hourClass(w.hour)} ${i === currentCol ? 'ring-2 ring-accent-500' : ''}`}
                        title={dayFmt(zone).format(h)}
                      >
                        {w.hour === 0 ? <span className="font-semibold">{w.day}/{w.month}</span> : `${w.hour}${w.minute ? `:${pad(w.minute)}` : ''}`}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

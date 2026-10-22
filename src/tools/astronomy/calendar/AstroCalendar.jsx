import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { LocationButton } from '../../../components/LocationPicker'
import Segmented from '../../../components/Segmented'
import { fmt, fmtDate, fmtShortDate, fmtTime } from '../../../lib/format'
import { addHours, makeObserver, moonInfo, riseTransitSet, sameDay, startOfDay, sunDay } from '../lib/astro'
import MoonPhase from '../components/MoonPhase'
import { EVENT_TYPES, dayKey, monthEvents } from './events'

const WEEK_DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

function EventItem({ event, showDate = false }) {
  const type = EVENT_TYPES[event.type]
  return (
    <li className="flex gap-3 border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800/60">
      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: type.color }} title={type.label} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${event.important ? 'font-semibold' : 'font-medium'}`}>{event.title}</p>
        {event.detail && <p className="text-xs text-zinc-500">{event.detail}</p>}
      </div>
      <span className="shrink-0 text-right font-mono text-xs text-zinc-500">
        {showDate && (
          <span className="block capitalize text-zinc-700 dark:text-zinc-300">{fmtShortDate(event.time)}</span>
        )}
        {event.approximate ? 'nuit' : fmtTime(event.time)}
      </span>
    </li>
  )
}

function DayPanel({ date, events, observer, south }) {
  const info = useMemo(() => {
    const moon = moonInfo(addHours(startOfDay(date), 22))
    return { moon, sun: sunDay(observer, date), moonRts: riseTransitSet('Moon', observer, date) }
  }, [date, observer])

  return (
    <div className="card card-pad">
      <p className="text-lg font-semibold capitalize">{fmtDate(date)}</p>
      <div className="mt-3 flex items-center gap-3">
        <MoonPhase phase={info.moon.phase} size={52} south={south} title={info.moon.name} />
        <div className="text-sm">
          <p className="font-medium">{info.moon.name}</p>
          <p className="text-zinc-500">Éclairée à {fmt(info.moon.illumination * 100, 0)} % (22 h)</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {[
          ['Lever du Soleil', info.sun.sunrise],
          ['Coucher du Soleil', info.sun.sunset],
          ['Lever de la Lune', info.moonRts.rise],
          ['Coucher de la Lune', info.moonRts.set],
          ['Nuit noire dès', info.sun.astronomicalDusk],
          ['Aube astronomique', info.sun.astronomicalDawn],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
            <dt className="text-[11px] text-zinc-500">{label}</dt>
            <dd className="font-mono">{fmtTime(value)}</dd>
          </div>
        ))}
      </dl>
      <p className="label mt-5">Événements</p>
      {events.length ? (
        <ul>
          {events.map((e, i) => (
            <EventItem key={i} event={e} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Aucun phénomène particulier ce jour-là.</p>
      )}
    </div>
  )
}

export default function AstroCalendar() {
  const { location } = useObserverLocation()
  const observer = useMemo(() => makeObserver(location), [location])
  const today = startOfDay(new Date())
  const [view, setView] = useState({ year: today.getFullYear(), month: today.getMonth() })
  const [selected, setSelected] = useState(today)
  const [mode, setMode] = useLocalStorage('calendar-mode', 'grid')
  const [hidden, setHidden] = useLocalStorage('calendar-hidden-types', [])

  const byDay = useMemo(() => monthEvents(view.year, view.month, observer), [view, observer])
  const visible = (list) => (list ?? []).filter((e) => !hidden.includes(e.type))

  const first = new Date(view.year, view.month, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, i) => new Date(view.year, view.month, i - offset + 1))

  const changeMonth = (delta) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
    setSelected(d)
  }
  const goToday = () => {
    setView({ year: today.getFullYear(), month: today.getMonth() })
    setSelected(today)
  }

  const monthList = [...byDay.values()]
    .flat()
    .filter((e) => e.time.getMonth() === view.month && !hidden.includes(e.type))
    .sort((a, b) => a.time - b.time)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" className="btn-icon" onClick={() => changeMonth(-1)} aria-label="Mois précédent">
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-center text-lg font-black uppercase tracking-wide sm:min-w-[11rem] sm:text-2xl">
            {MONTHS[view.month]} <span className="font-mono text-orange-500">{view.year}</span>
          </h2>
          <button type="button" className="btn-icon" onClick={() => changeMonth(1)} aria-label="Mois suivant">
            <ChevronRight size={16} />
          </button>
          <button type="button" className="btn ml-1 px-2.5 sm:px-3" onClick={goToday}>
            Aujourd'hui
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <LocationButton />
          <Segmented
            size="sm"
            ariaLabel="Affichage"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'grid', label: 'Grille' },
              { value: 'list', label: 'Liste' },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(EVENT_TYPES).map(([id, t]) => {
          const on = !hidden.includes(id)
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => setHidden(on ? [...hidden, id] : hidden.filter((h) => h !== id))}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-opacity ${
                on ? 'border-zinc-200 dark:border-zinc-700' : 'border-dashed border-zinc-300 opacity-50 dark:border-zinc-700'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {mode === 'grid' ? (
          <div className="card overflow-hidden">
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              {WEEK_DAYS.map((d) => (
                <div key={d} className="py-2 text-center font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d) => {
                const inMonth = d.getMonth() === view.month
                const evts = visible(byDay.get(dayKey(d)))
                const phase = evts.find((e) => e.type === 'phase')
                const others = evts.filter((e) => e.type !== 'phase')
                const isSel = sameDay(d, selected)
                const isToday = sameDay(d, today)
                return (
                  <button
                    key={d.getTime()}
                    type="button"
                    onClick={() => setSelected(d)}
                    className={`relative flex min-h-[64px] flex-col items-stretch border-b border-r border-zinc-100 p-1 text-left transition-colors last:border-r-0 dark:border-zinc-800/70 sm:min-h-[104px] sm:p-1.5 ${
                      inMonth ? '' : 'bg-zinc-50/60 text-zinc-400 dark:bg-zinc-950/60 dark:text-zinc-600'
                    } ${isSel ? 'bg-orange-500/10 ring-1 ring-inset ring-orange-500/60' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                    aria-label={`${fmtDate(d)}${evts.length ? `, ${evts.length} événement(s)` : ''}`}
                    aria-pressed={isSel}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:text-sm ${
                          isToday ? 'bg-orange-600 text-white' : ''
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      {phase && <MoonPhase phase={phase.quarter * 90} size={18} south={location.lat < 0} title={phase.title} />}
                    </div>
                    <ul className="mt-1 hidden space-y-0.5 sm:block">
                      {others.slice(0, 3).map((e, i) => (
                        <li
                          key={i}
                          className="truncate border-l-2 pl-1 text-[10.5px] leading-tight text-zinc-600 dark:text-zinc-300"
                          style={{ borderColor: EVENT_TYPES[e.type].color }}
                          title={`${e.title}${e.detail ? ` — ${e.detail}` : ''}`}
                        >
                          {e.title}
                        </li>
                      ))}
                      {others.length > 3 && <li className="pl-1 text-[10px] text-zinc-500">+{others.length - 3}</li>}
                    </ul>
                    <div className="mt-auto flex flex-wrap gap-0.5 sm:hidden">
                      {others.slice(0, 4).map((e, i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: EVENT_TYPES[e.type].color }} />
                      ))}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="card card-pad">
            <p className="label">{monthList.length} événements en {MONTHS[view.month].toLowerCase()}</p>
            <ul>
              {monthList.map((e, i) => (
                <EventItem key={i} event={e} showDate />
              ))}
            </ul>
          </div>
        )}

        <DayPanel date={selected} events={visible(byDay.get(dayKey(selected)))} observer={observer} south={location.lat < 0} />
      </div>
      <p className="text-xs text-zinc-500">
        Heures locales. Les maxima d'étoiles filantes sont des dates moyennes (±1 jour). Les rapprochements indiquent la séparation minimale vue
        du centre de la Terre.
      </p>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { LocationButton } from '../../../components/LocationPicker'
import { compass, fmt, fmtDate, fmtDuration, fmtShortDate, fmtTime, toDateInput } from '../../../lib/format'
import {
  BODY,
  PLANETS,
  addDays,
  addHours,
  altitudeSeries,
  bodyConstellation,
  bodyPosition,
  makeObserver,
  moonInfo,
  nextMoonQuarters,
  nightVisibility,
  riseTransitSet,
  sameDay,
  startOfDay,
  sunDay,
} from '../lib/astro'
import AltitudeChart from '../components/AltitudeChart'
import MoonPhase from '../components/MoonPhase'

function Row({ label, value, sub }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-zinc-100 py-1.5 last:border-0 dark:border-zinc-800/60">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">{label}</span>
      <span className="text-right font-mono text-sm">
        {value}
        {sub && <span className="ml-2 text-xs text-zinc-500">{sub}</span>}
      </span>
    </div>
  )
}

const rts = (r) =>
  r.state === 'up' ? 'Toujours levé' : r.state === 'down' ? 'Ne se lève pas' : null

function visibilityText(v) {
  if (!v.visible) return v.elongation < 15 ? 'Trop proche du Soleil' : 'Sous l’horizon la nuit'
  return `${fmtTime(v.start)} → ${fmtTime(v.end)}`
}

export default function Tonight() {
  const { location } = useObserverLocation()
  const [day, setDay] = useState(() => startOfDay(new Date()))
  const isToday = sameDay(day, new Date())

  const data = useMemo(() => {
    const observer = makeObserver(location)
    const sun = sunDay(observer, day)
    const nextSun = sunDay(observer, addDays(day, 1))
    // Pour aujourd'hui, l'état de la Lune est donné à l'instant présent ; sinon à 22 h.
    const ref = isToday ? new Date() : addHours(day, 22)
    const moon = moonInfo(ref)
    const moonRts = riseTransitSet('Moon', observer, day)
    const moonPos = bodyPosition('Moon', ref, observer)
    const moonConstellation = bodyConstellation('Moon', ref, observer)
    const quarters = nextMoonQuarters(day, 4)

    const planets = PLANETS.map((p) => {
      const r = riseTransitSet(p.id, observer, day)
      const vis = nightVisibility(p.id, observer, day)
      return { ...p, rts: r, vis, constellation: bodyConstellation(p.id, addHours(day, 22), observer) }
    })

    const start = addHours(day, 12)
    const end = addHours(day, 36)
    const series = ['Sun', 'Moon', ...PLANETS.filter((p) => p.nakedEye).map((p) => p.id)].map((id) => ({
      id,
      name: BODY[id].name,
      color: BODY[id].color,
      points: altitudeSeries(id, observer, start, end, 10),
    }))

    return { sun, nextSun, moon, moonRts, moonPos, moonConstellation, quarters, planets, series, start, end }
  }, [location, day, isToday])

  const { sun, nextSun, moon, moonRts, moonPos, moonConstellation, quarters, planets, series, start, end } = data
  const darkHours = sun.astronomicalDusk && nextSun.astronomicalDawn ? (nextSun.astronomicalDawn - sun.astronomicalDusk) / 3_600_000 : null

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <LocationButton showCoords />
        <div className="flex items-center gap-1">
          <button type="button" className="btn-icon" onClick={() => setDay((d) => addDays(d, -1))} aria-label="Jour précédent">
            <ChevronLeft size={16} />
          </button>
          <input
            type="date"
            className="input w-auto font-mono"
            value={toDateInput(day)}
            onChange={(e) => {
              const [y, m, d] = e.target.value.split('-').map(Number)
              if (y && m && d) setDay(new Date(y, m - 1, d))
            }}
            aria-label="Date"
          />
          <button type="button" className="btn-icon" onClick={() => setDay((d) => addDays(d, 1))} aria-label="Jour suivant">
            <ChevronRight size={16} />
          </button>
        </div>
        {!isToday && (
          <button type="button" className="btn" onClick={() => setDay(startOfDay(new Date()))}>
            Aujourd'hui
          </button>
        )}
        <span className="text-sm capitalize text-zinc-500">{fmtDate(day)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card card-pad">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Sun size={18} className="text-amber-500" /> Soleil
          </h2>
          <Row label="Aube astronomique" value={fmtTime(sun.astronomicalDawn)} />
          <Row label="Aube nautique" value={fmtTime(sun.nauticalDawn)} />
          <Row label="Aube civile" value={fmtTime(sun.civilDawn)} />
          <Row label="Lever" value={fmtTime(sun.sunrise)} />
          <Row label="Midi vrai" value={fmtTime(sun.noon)} sub={`h = ${fmt(sun.noonAlt, 1)}°`} />
          <Row label="Coucher" value={fmtTime(sun.sunset)} />
          <Row label="Crépuscule civil" value={fmtTime(sun.civilDusk)} />
          <Row label="Crépuscule nautique" value={fmtTime(sun.nauticalDusk)} />
          <Row label="Crépuscule astronomique" value={fmtTime(sun.astronomicalDusk)} />
          <Row label="Durée du jour" value={fmtDuration(sun.dayLength)} />
          <p className="mt-3 text-xs text-zinc-500">
            {darkHours
              ? `Nuit noire (Soleil sous −18°) : ${fmtTime(sun.astronomicalDusk)} → ${fmtTime(nextSun.astronomicalDawn)}, soit ${fmtDuration(darkHours)}.`
              : 'Pas de nuit astronomique à cette date : le Soleil ne descend pas sous −18°.'}
          </p>
        </section>

        <section className="card card-pad">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Moon size={18} className="text-zinc-400" /> Lune
          </h2>
          <div className="mb-3 flex items-center gap-4">
            <MoonPhase phase={moon.phase} size={84} south={location.lat < 0} title={moon.name} />
            <div>
              <p className="font-semibold">{moon.name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Éclairée à {fmt(moon.illumination * 100, 1)} %</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Âge : {fmt(moon.ageDays, 1)} jours</p>
            </div>
          </div>
          {rts(moonRts) && <Row label="Visibilité" value={rts(moonRts)} />}
          <Row label="Lever" value={fmtTime(moonRts.rise)} />
          <Row label="Culmination" value={fmtTime(moonRts.transit)} sub={moonRts.transit ? `h = ${fmt(moonRts.transitAlt, 1)}°` : undefined} />
          <Row label="Coucher" value={fmtTime(moonRts.set)} />
          <Row label="Distance" value={`${fmt(moon.distanceKm, 0)} km`} />
          <Row label="Position actuelle" value={`${fmt(moonPos.alt, 1)}° · ${compass(moonPos.az)}`} sub={moonConstellation.name} />
          <div className="mt-3 grid grid-cols-2 gap-2">
            {quarters.map((q) => (
              <div key={q.date.getTime()} className="flex items-center gap-2 rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
                <MoonPhase phase={q.quarter * 90} size={26} south={location.lat < 0} title={q.name} />
                <div className="min-w-0 text-xs">
                  <p className="truncate font-medium">{q.name}</p>
                  <p className="text-zinc-500">
                    {fmtShortDate(q.date)} {fmtTime(q.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card card-pad">
          <h2 className="mb-3 font-semibold">Planètes visibles cette nuit</h2>
          <ul className="space-y-2">
            {planets
              .filter((p) => p.nakedEye)
              .map((p) => (
                <li key={p.id} className={`rounded-lg border p-3 ${p.vis.visible ? 'border-zinc-200 dark:border-zinc-800' : 'border-dashed border-zinc-200 opacity-60 dark:border-zinc-800'}`}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-semibold">
                      <span className="sym" style={{ color: p.color }}>{p.symbol}</span> {p.name}
                    </span>
                    <span className="font-mono text-xs text-zinc-500">mag {fmt(p.vis.magnitude, 1)}</span>
                  </div>
                  <p className="mt-1 text-sm">{visibilityText(p.vis)}</p>
                  {p.vis.best && (
                    <p className="text-xs text-zinc-500">
                      Au mieux vers {fmtTime(p.vis.best.t)} à {fmt(p.vis.best.alt, 0)}° ({compass(p.vis.best.az)}) · {p.constellation.name}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </section>
      </div>

      <section className="card card-pad">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Hauteur au-dessus de l'horizon</h2>
          <p className="text-xs text-zinc-500">
            De {fmtTime(start)} le {fmtShortDate(start)} à {fmtTime(end)} le {fmtShortDate(end)} · survolez pour lire les hauteurs
          </p>
        </div>
        <AltitudeChart series={series} start={start} end={end} now={isToday ? new Date() : null} />
      </section>

      <section className="card overflow-hidden">
        <h2 className="border-b border-zinc-200 px-4 py-3 font-semibold dark:border-zinc-800">Toutes les planètes</h2>
        <div className="overflow-x-auto">
          <table className="table-data">
            <thead>
              <tr>
                <th>Planète</th>
                <th>Lever</th>
                <th>Culmination</th>
                <th>Coucher</th>
                <th>Magnitude</th>
                <th>Élongation</th>
                <th>Constellation</th>
                <th>Visible la nuit</th>
              </tr>
            </thead>
            <tbody>
              {planets.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">
                    <span className="sym" style={{ color: p.color }}>{p.symbol}</span> {p.name}
                  </td>
                  <td className="font-mono">{rts(p.rts) ?? fmtTime(p.rts.rise)}</td>
                  <td className="font-mono">
                    {fmtTime(p.rts.transit)} <span className="text-zinc-500">({fmt(p.rts.transitAlt, 0)}°)</span>
                  </td>
                  <td className="font-mono">{rts(p.rts) ?? fmtTime(p.rts.set)}</td>
                  <td className="font-mono">{fmt(p.vis.magnitude, 1)}</td>
                  <td className="font-mono">
                    {fmt(p.vis.elongation, 0)}° <span className="text-zinc-500">{p.vis.side}</span>
                  </td>
                  <td>{p.constellation.name}</td>
                  <td className="font-mono">{visibilityText(p.vis)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-4 py-3 text-xs text-zinc-500">
          Heures locales du navigateur. « Visible la nuit » : hauteur supérieure à 5° pendant que le Soleil est sous −6°. Calculs : Astronomy Engine
          (théories VSOP87 et ELP), précision de l'ordre de la minute d'arc.
        </p>
      </section>
    </div>
  )
}

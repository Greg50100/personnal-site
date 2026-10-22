import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Sunrise, Sunset } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useNow } from '../../../hooks/useNow'
import { fmt, fmtTime } from '../../../lib/format'
import { PLANETS, makeObserver, moonInfo, nightVisibility, sunDay } from '../lib/astro'
import MoonPhase from '../components/MoonPhase'

/** Résumé compact du ciel du soir, affiché sur la page d'accueil. */
export default function TonightWidget() {
  const { location } = useObserverLocation()
  const now = useNow(60_000)
  const minute = Math.floor(now.getTime() / 60_000)

  const data = useMemo(() => {
    const date = new Date(minute * 60_000)
    const observer = makeObserver(location)
    const sun = sunDay(observer, date)
    const moon = moonInfo(date)
    const planets = PLANETS.filter((p) => p.nakedEye)
      .map((p) => ({ ...p, vis: nightVisibility(p.id, observer, date, { stepMinutes: 20 }) }))
      .filter((p) => p.vis.visible)
    return { sun, moon, planets }
  }, [location, minute])

  return (
    <div className="card relative overflow-hidden p-5">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl" />
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-orange-600 dark:text-orange-500">{'// '}Ce soir à {location.name}</p>
        <span className="font-mono text-xs text-zinc-500">{fmtTime(now)}</span>
      </div>

      <div className="flex items-center gap-4">
        <MoonPhase phase={data.moon.phase} size={64} south={location.lat < 0} title={data.moon.name} />
        <div>
          <p className="font-semibold">{data.moon.name}</p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Éclairée à {fmt(data.moon.illumination * 100, 0)} % · {fmt(data.moon.ageDays, 1)} j
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Sunrise size={16} className="text-amber-500" /> {fmtTime(data.sun.sunrise)}
        </div>
        <div className="flex items-center gap-2">
          <Sunset size={16} className="text-orange-500" /> {fmtTime(data.sun.sunset)}
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <p className="label">Planètes visibles à l'œil nu</p>
        {data.planets.length ? (
          <ul className="flex flex-wrap gap-2">
            {data.planets.map((p) => (
              <li key={p.id} className="chip normal-case tracking-normal" title={`Magnitude ${fmt(p.vis.magnitude, 1)}`}>
                <span className="sym" style={{ color: p.color }}>{p.symbol}</span> {p.name} · {fmtTime(p.vis.start)}–{fmtTime(p.vis.end)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Aucune cette nuit.</p>
        )}
      </div>

      <Link to="/astronomie/ce-soir" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:underline dark:text-orange-400">
        Éphémérides complètes <ArrowRight size={14} />
      </Link>
    </div>
  )
}

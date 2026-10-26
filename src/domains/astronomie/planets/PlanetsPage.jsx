import { useMemo, useState } from 'react'
import { useObserverLocation } from '../../../context/location'
import { useAstroClock } from '../../../hooks/useAstroClock'
import { LocationButton } from '../../../components/LocationPicker'
import Segmented from '../../../components/Segmented'
import { compass, fmt, fmtTime } from '../../../lib/format'
import { Astronomy, PLANETS, bodyConstellation, bodyPosition, diameterArcsec, fmtDiameter, makeObserver, nightVisibility, riseTransitSet, startOfDay } from '../lib/astro'
import TimeControls from '../components/TimeControls'

const DEG = Math.PI / 180
const EARTH = { id: 'Earth', name: 'Terre', symbol: '⊕', color: '#60a5fa' }
const VIEWS = {
  inner: { label: 'Planètes intérieures', ids: ['Mercury', 'Venus', 'Earth', 'Mars'], scale: (r) => r / 1.7 },
  outer: { label: 'Planètes extérieures', ids: ['Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune'], scale: (r) => Math.sqrt(r / 31) },
}

/** Vue de dessus du système solaire (plan de l'écliptique, point vernal ♈ à droite). */
function Orrery({ date, view }) {
  const S = 360
  const C = S / 2
  const R = C - 22
  const { ids, scale } = VIEWS[view]
  const toEcl = Astronomy.Rotation_EQJ_ECL()
  const bodies = ids.map((id) => {
    const b = id === 'Earth' ? EARTH : PLANETS.find((p) => p.id === id)
    const v = Astronomy.RotateVector(toEcl, Astronomy.HelioVector(id, date))
    const r = Math.hypot(v.x, v.y)
    const lon = Math.atan2(v.y, v.x)
    const k = scale(r) * R
    // Rayon moyen de l'orbite (demi-grand axe) pour le cercle
    const a = scale(Astronomy.PlanetOrbitalPeriod(id) ** (2 / 3) / 365.256 ** (2 / 3)) * R
    return { ...b, x: C + k * Math.cos(lon), y: C - k * Math.sin(lon), a, lonDeg: ((lon / DEG) % 360 + 360) % 360 }
  })
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto block h-auto w-full max-w-[420px]" role="img" aria-label="Vue de dessus du système solaire">
      <rect width={S} height={S} rx="16" fill="#0a0f21" />
      {bodies.map((b) => (
        <circle key={`o${b.id}`} cx={C} cy={C} r={b.a} fill="none" stroke="#94a3b8" strokeOpacity="0.25" />
      ))}
      <line x1={C} y1={C} x2={S - 8} y2={C} stroke="#f59e0b" strokeOpacity="0.4" strokeDasharray="3 4" />
      <text x={S - 12} y={C - 6} textAnchor="end" className="fill-accent-400 text-[12px]">
        {'♈\uFE0E'}
      </text>
      <circle cx={C} cy={C} r="7" fill="#facc15" />
      {bodies.map((b) => (
        <g key={b.id}>
          <circle cx={b.x} cy={b.y} r={b.id === 'Earth' ? 5 : 4.5} fill={b.color} stroke="#0a0f21" strokeWidth="1.5" />
          <text x={b.x + 7} y={b.y - 6} className="fill-night-200 text-[11px]">
            {b.name}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function PlanetsPage() {
  const { location } = useObserverLocation()
  const clock = useAstroClock({ intervalMs: 30_000 })
  const date = clock.date
  const observer = useMemo(() => makeObserver(location), [location])
  const [view, setView] = useState('inner')
  const dayKey = startOfDay(date).getTime()

  const rows = useMemo(
    () =>
      PLANETS.map((p) => {
        const pos = bodyPosition(p.id, date, observer)
        const illum = Astronomy.Illumination(p.id, date)
        const el = Astronomy.Elongation(p.id, date)
        const helio = Astronomy.HelioDistance(p.id, date)
        return {
          ...p,
          pos,
          mag: illum.mag,
          phase: illum.phase_fraction,
          elong: el.elongation,
          side: el.visibility === 'morning' ? 'O' : 'E',
          helio,
          diameter: diameterArcsec(p.id, illum.geo_dist),
          dist: illum.geo_dist,
          constellation: bodyConstellation(p.id, date, observer),
        }
      }),
    [date, observer],
  )

  const daily = useMemo(() => {
    const d = new Date(dayKey)
    return Object.fromEntries(PLANETS.map((p) => [p.id, { rts: riseTransitSet(p.id, observer, d), vis: nightVisibility(p.id, observer, d) }]))
  }, [dayKey, observer])

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad flex flex-wrap items-center justify-between gap-3">
        <TimeControls clock={clock} />
        <LocationButton />
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-night-200 px-4 py-3 dark:border-night-800">
          <h2 className="font-display font-semibold">Résumé des planètes</h2>
          <p className="text-xs text-night-500">Élongation : angle au Soleil (E = visible le soir, O = le matin). Lever, passage et coucher pour la date choisie.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="table-data">
            <thead>
              <tr>
                <th>Planète</th>
                <th>Constellation</th>
                <th className="text-right">Mag.</th>
                <th className="text-right">Élong.</th>
                <th className="text-right">Distance</th>
                <th className="text-right">Diamètre</th>
                <th className="text-right">Phase</th>
                <th className="text-right">Hauteur</th>
                <th>Lever</th>
                <th>Passage</th>
                <th>Coucher</th>
                <th>Visible la nuit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const { rts, vis } = daily[r.id]
                return (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap font-medium">
                      <span className="mr-1.5" style={{ color: r.color }}>
                        {r.symbol}
                      </span>
                      {r.name}
                    </td>
                    <td className="whitespace-nowrap">{r.constellation.name}</td>
                    <td className="text-right font-mono">{fmt(r.mag, 1)}</td>
                    <td className="whitespace-nowrap text-right font-mono">
                      {fmt(r.elong, 0)}° {r.side}
                    </td>
                    <td className="whitespace-nowrap text-right font-mono">{fmt(r.dist, r.dist < 2 ? 3 : 2)} ua</td>
                    <td className="text-right font-mono">{fmtDiameter(r.diameter)}</td>
                    <td className="text-right font-mono">{fmt(r.phase * 100, 0)} %</td>
                    <td className={`whitespace-nowrap text-right font-mono ${r.pos.alt > 0 ? 'text-accent-700 dark:text-accent-300' : 'text-night-400'}`}>
                      {fmt(r.pos.alt, 0)}° {compass(r.pos.az)}
                    </td>
                    <td className="font-mono">{rts.state === 'up' ? '—' : fmtTime(rts.rise)}</td>
                    <td className="font-mono">{fmtTime(rts.transit)}</td>
                    <td className="font-mono">{rts.state === 'up' ? '—' : fmtTime(rts.set)}</td>
                    <td className="whitespace-nowrap text-sm">
                      {vis.visible ? (
                        <span>
                          {fmtTime(vis.start)} → {fmtTime(vis.end)}
                        </span>
                      ) : (
                        <span className="text-night-400">{vis.elongation < 15 ? 'trop près du Soleil' : 'non'}</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card card-pad">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display font-semibold">Vue de dessus</h2>
            <Segmented size="sm" value={view} onChange={setView} options={Object.entries(VIEWS).map(([value, v]) => ({ value, label: v.label }))} ariaLabel="Vue" />
          </div>
          <Orrery date={date} view={view} />
          <p className="mt-2 text-xs text-night-500">
            Positions héliocentriques dans le plan de l'écliptique. {view === 'outer' ? 'Distances en racine carrée pour que tout tienne sur la figure.' : 'Distances à l’échelle.'}
          </p>
        </section>
        <section className="card overflow-hidden">
          <div className="border-b border-night-200 px-4 py-3 dark:border-night-800">
            <h2 className="font-display font-semibold">Coordonnées héliocentriques</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table-data">
              <thead>
                <tr>
                  <th>Planète</th>
                  <th className="text-right">Distance au Soleil</th>
                  <th className="text-right">Longitude</th>
                  <th className="text-right">Période</th>
                </tr>
              </thead>
              <tbody>
                {[EARTH, ...PLANETS].map((p) => {
                  const v = Astronomy.Ecliptic(Astronomy.HelioVector(p.id, date))
                  const period = Astronomy.PlanetOrbitalPeriod(p.id)
                  return (
                    <tr key={p.id}>
                      <td className="font-medium">{p.name}</td>
                      <td className="text-right font-mono">{fmt(Astronomy.HelioDistance(p.id, date), 4)} ua</td>
                      <td className="text-right font-mono">{fmt(v.elon, 2)}°</td>
                      <td className="text-right font-mono">{period < 1000 ? `${fmt(period, 1)} j` : `${fmt(period / 365.25, 2)} ans`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

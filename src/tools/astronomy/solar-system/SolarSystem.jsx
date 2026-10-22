import { useMemo } from 'react'
import { useObserverLocation } from '../../../context/location'
import { useAstroClock } from '../../../hooks/useAstroClock'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { LocationButton } from '../../../components/LocationPicker'
import Segmented from '../../../components/Segmented'
import { compass, fmt, fmtAngle, fmtHMS, fmtTime } from '../../../lib/format'
import { Astronomy, BODIES, BODY, bodyConstellation, bodyPosition, makeObserver, riseTransitSet } from '../lib/astro'
import TimeControls from '../components/TimeControls'

// Rayons équatoriaux (km) pour le diamètre apparent
const RADIUS_KM = { Sun: 695_700, Moon: 1737.4, Mercury: 2439.7, Venus: 6051.8, Mars: 3396.2, Jupiter: 71_492, Saturn: 60_268, Uranus: 25_559, Neptune: 24_764, Pluto: 1188.3 }

const ROWS = [BODY.Sun, BODY.Moon, BODY.Mercury, BODY.Venus, { id: 'Earth', name: 'Terre', symbol: '⊕', color: '#60a5fa' }, ...BODIES.slice(4)]

const DEFAULTS = { cartesian: 'helio', angular: 'equatorial', angleMode: 'dms', nakedEye: false, aboveHorizon: false, selected: 'Sun' }

function apparentDiameter(id, distAu) {
  const km = distAu * Astronomy.KM_PER_AU
  const arcsec = ((2 * Math.atan(RADIUS_KM[id] / km) * 180) / Math.PI) * 3600
  return arcsec > 120 ? `${fmt(arcsec / 60, 1)}′` : `${fmt(arcsec, 1)}″`
}

export default function SolarSystem() {
  const { location } = useObserverLocation()
  const clock = useAstroClock({ intervalMs: 2000 })
  const [stored, setStored] = useLocalStorage('solar-system-options', DEFAULTS)
  const opts = { ...DEFAULTS, ...stored }
  const set = (patch) => setStored({ ...opts, ...patch })
  const observer = useMemo(() => makeObserver(location), [location])
  const date = clock.date

  const rows = useMemo(() => {
    const toEcl = Astronomy.Rotation_EQJ_ECL()
    return ROWS.map((b) => {
      const isEarth = b.id === 'Earth'
      const helio = Astronomy.RotateVector(toEcl, Astronomy.HelioVector(b.id, date))
      const geo = isEarth ? null : Astronomy.RotateVector(toEcl, Astronomy.GeoVector(b.id, date, true))
      if (isEarth) return { ...b, helio, isEarth }
      const pos = bodyPosition(b.id, date, observer)
      const ecl = Astronomy.Ecliptic(Astronomy.GeoVector(b.id, date, true))
      const illum = Astronomy.Illumination(b.id, date)
      return {
        ...b,
        helio,
        geo,
        pos,
        ecl,
        mag: illum.mag,
        phase: illum.phase_fraction,
        elong: b.id === 'Sun' ? 0 : Astronomy.AngleFromSun(b.id, date),
        constellation: bodyConstellation(b.id, date, observer),
      }
    })
  }, [date, observer])

  const visibleRows = rows.filter((r) => {
    if (r.isEarth) return opts.cartesian === 'helio' && !opts.aboveHorizon
    if (opts.nakedEye && r.mag > 6) return false
    if (opts.aboveHorizon && r.pos.alt < 0) return false
    return true
  })

  const selected = rows.find((r) => r.id === opts.selected && !r.isEarth) ?? rows[0]
  const rts = useMemo(() => riseTransitSet(selected.id, observer, date), [selected.id, observer, date])

  const angleHeaders = {
    equatorial: ['Asc. droite', 'Déclinaison'],
    ecliptic: ['Longitude λ', 'Latitude β'],
    horizontal: ['Azimut', 'Hauteur'],
  }[opts.angular]

  const angles = (r) => {
    if (r.isEarth) return ['', '']
    if (opts.angular === 'equatorial') return [opts.angleMode === 'decimal' ? `${fmt(r.pos.ra, 5)} h` : fmtHMS(r.pos.ra), fmtAngle(r.pos.dec, opts.angleMode)]
    if (opts.angular === 'ecliptic') return [fmtAngle(r.ecl.elon, opts.angleMode).replace('+', ''), fmtAngle(r.ecl.elat, opts.angleMode)]
    return [`${fmtAngle(r.pos.az, opts.angleMode).replace('+', '')} ${compass(r.pos.az)}`, fmtAngle(r.pos.alt, opts.angleMode)]
  }

  const vec = (r) => (opts.cartesian === 'helio' ? r.helio : r.geo)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <LocationButton showCoords />
        <TimeControls clock={clock} />
      </div>

      <div className="card card-pad grid gap-4 md:grid-cols-3">
        <div>
          <p className="label">Coordonnées cartésiennes</p>
          <Segmented
            size="sm"
            value={opts.cartesian}
            onChange={(cartesian) => set({ cartesian })}
            options={[
              { value: 'helio', label: 'Héliocentriques' },
              { value: 'geo', label: 'Géocentriques' },
              { value: 'none', label: 'Aucune' },
            ]}
          />
        </div>
        <div>
          <p className="label">Coordonnées angulaires</p>
          <Segmented
            size="sm"
            value={opts.angular}
            onChange={(angular) => set({ angular })}
            options={[
              { value: 'equatorial', label: 'Équatoriales' },
              { value: 'ecliptic', label: 'Écliptiques' },
              { value: 'horizontal', label: 'Horizontales' },
            ]}
          />
        </div>
        <div>
          <p className="label">Affichage des angles</p>
          <Segmented
            size="sm"
            value={opts.angleMode}
            onChange={(angleMode) => set({ angleMode })}
            options={[
              { value: 'dms', label: "dd° mm′ ss″" },
              { value: 'dm', label: "dd° mm,mm′" },
              { value: 'decimal', label: 'dd,dddd°' },
            ]}
          />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm md:col-span-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-orange-500" checked={opts.nakedEye} onChange={(e) => set({ nakedEye: e.target.checked })} />
            Seulement les objets visibles à l'œil nu (mag ≤ 6)
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="accent-orange-500" checked={opts.aboveHorizon} onChange={(e) => set({ aboveHorizon: e.target.checked })} />
            Seulement les objets au-dessus de l'horizon
          </label>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-data">
            <thead>
              <tr>
                <th>Objet</th>
                {opts.cartesian !== 'none' && (
                  <>
                    <th className="text-right">{opts.cartesian === 'helio' ? 'H' : 'G'}x (ua)</th>
                    <th className="text-right">{opts.cartesian === 'helio' ? 'H' : 'G'}y (ua)</th>
                    <th className="text-right">{opts.cartesian === 'helio' ? 'H' : 'G'}z (ua)</th>
                    <th className="text-right">Distance (ua)</th>
                  </>
                )}
                <th className="text-right">Mag.</th>
                <th className="text-right">Élong.</th>
                <th>Const.</th>
                <th className="text-right">{angleHeaders[0]}</th>
                <th className="text-right">{angleHeaders[1]}</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((r) => {
                const v = opts.cartesian === 'none' ? null : vec(r)
                const [a1, a2] = angles(r)
                const dim = !r.isEarth && r.mag > 6
                return (
                  <tr
                    key={r.id}
                    onClick={() => !r.isEarth && set({ selected: r.id })}
                    className={`${r.isEarth ? '' : 'cursor-pointer'} ${opts.selected === r.id ? 'bg-orange-500/5' : ''}`}
                  >
                    <td className={`font-medium ${dim ? 'text-zinc-500' : ''}`}>
                      <span className="sym" style={{ color: r.color }}>{r.symbol}</span> {r.name}
                    </td>
                    {v && (
                      <>
                        <td className="text-right font-mono">{fmt(v.x, 7)}</td>
                        <td className="text-right font-mono">{fmt(v.y, 7)}</td>
                        <td className="text-right font-mono">{fmt(v.z, 7)}</td>
                        <td className="text-right font-mono">{fmt(v.Length(), 7)}</td>
                      </>
                    )}
                    {opts.cartesian !== 'none' && !v && <td colSpan={4} />}
                    <td className="text-right font-mono">{r.isEarth ? '' : fmt(r.mag, 2)}</td>
                    <td className="text-right font-mono">{r.isEarth ? '' : `${fmt(r.elong, 1)}°`}</td>
                    <td title={r.constellation?.name}>{r.constellation?.symbol ?? ''}</td>
                    <td className="text-right font-mono">{a1}</td>
                    <td className={`text-right font-mono ${opts.angular === 'horizontal' && r.pos?.alt < 0 ? 'text-zinc-500' : ''}`}>{a2}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800">
          Cartésiennes : plan de l'écliptique J2000. Angles géocentriques apparents de la date (équatoriales et écliptiques), topocentriques avec
          réfraction pour les horizontales. Cliquez une ligne pour afficher le détail de l'astre.
        </p>
      </div>

      {!selected.isEarth && (
        <div className="card card-pad">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              <span className="sym" style={{ color: selected.color }}>{selected.symbol}</span> {selected.name}{' '}
              <span className="text-sm font-normal text-zinc-500">· {selected.constellation.name}</span>
            </h2>
            <select className="input w-auto" value={selected.id} onChange={(e) => set({ selected: e.target.value })} aria-label="Astre">
              {rows
                .filter((r) => !r.isEarth)
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
            </select>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 lg:grid-cols-8">
            {[
              ['Lever', rts.state === 'up' ? 'circumpolaire' : rts.state === 'down' ? 'invisible' : fmtTime(rts.rise)],
              ['Culmination', `${fmtTime(rts.transit)} (${fmt(rts.transitAlt, 0)}°)`],
              ['Coucher', rts.state === 'normal' ? fmtTime(rts.set) : '—'],
              ['Hauteur', `${fmt(selected.pos.alt, 1)}°`],
              ['Azimut', `${fmt(selected.pos.az, 1)}° ${compass(selected.pos.az)}`],
              ['Diamètre apparent', apparentDiameter(selected.id, selected.pos.dist)],
              ['Phase éclairée', selected.id === 'Sun' ? '—' : `${fmt(selected.phase * 100, 1)} %`],
              ['Temps-lumière', `${fmt((selected.pos.dist * Astronomy.KM_PER_AU) / 299_792.458 / 60, 2)} min`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
                <dt className="text-[11px] text-zinc-500">{k}</dt>
                <dd className="font-mono">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

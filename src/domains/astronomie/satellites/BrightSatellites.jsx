import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useNow } from '../../../hooks/useNow'
import { LocationButton } from '../../../components/LocationPicker'
import Loader from '../../../components/Loader'
import Segmented from '../../../components/Segmented'
import { compass, fmt, fmtDate, fmtTime } from '../../../lib/format'
import { addDays, addHours, startOfDay } from '../lib/astro'
import PassTrack from '../components/PassTrack'
import { makeGrid, parseTleList, visiblePasses } from './bright'
import { useCelestrak } from './useCelestrak'

const NIGHTS = [
  { value: 0, label: 'Cette nuit' },
  { value: 1, label: 'Demain' },
  { value: 2, label: 'Après-demain' },
]
const MIN_EL = [
  { value: 10, label: '≥ 10°' },
  { value: 20, label: '≥ 20°' },
  { value: 40, label: '≥ 40°' },
]

const point = (s) => (
  <span className="whitespace-nowrap">
    <span className="font-mono">{fmtTime(s.t, true)}</span>
    <span className="ml-1.5 font-mono text-xs text-night-500">
      {fmt(s.el, 0)}° {compass(s.az)}
    </span>
  </span>
)

/** Calcul par lots (pour garder la page réactive) des passages de tous les satellites. */
function usePasses(sats, loc, start, hours, minEl) {
  const key = sats ? `${sats.length}|${loc.lat}|${loc.lon}|${start.getTime()}|${minEl}` : null
  const [state, setState] = useState({ key: null, passes: [], done: 0 })
  useEffect(() => {
    if (!sats) return undefined
    let cancelled = false
    const grid = makeGrid(loc, start, hours)
    const passes = []
    let i = 0
    const batch = () => {
      if (cancelled) return
      for (const end = Math.min(sats.length, i + 12); i < end; i++) passes.push(...visiblePasses(sats[i], grid, loc, minEl))
      setState({ key, passes: [...passes].sort((a, b) => a.start.t - b.start.t), done: i })
      if (i < sats.length) setTimeout(batch, 0)
    }
    const id = setTimeout(batch, 0)
    return () => {
      cancelled = true
      clearTimeout(id)
    }
    // `key` résume toutes les entrées du calcul
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return state.key === key ? state : { key, passes: [], done: 0 }
}

export default function BrightSatellites() {
  const { location } = useObserverLocation()
  const now = useNow(60_000)
  const [night, setNight] = useState(0)
  const [minEl, setMinEl] = useState(10)
  const [selected, setSelected] = useState(null)
  const celestrak = useCelestrak('visual', 'GROUP=visual', { maxAgeHours: 12, validate: (text) => parseTleList(text).length > 10 })
  const sats = useMemo(() => (celestrak.text ? parseTleList(celestrak.text) : null), [celestrak.text])

  // Fenêtre : de midi à midi le lendemain (heure locale)
  // Avant midi, « cette nuit » est celle qui se termine.
  const [today] = useState(() => startOfDay(addHours(new Date(), -12)))
  const start = useMemo(() => addHours(addDays(today, night), 12), [today, night])
  const { passes, done } = usePasses(sats, location, start, 24, minEl)
  const loading = sats && done < sats.length
  const current = passes.find((p) => `${p.sat.id}${p.start.t.getTime()}` === selected) ?? passes[0]
  const tleAge = celestrak.at ? (now - celestrak.at) / 3_600_000 : null

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented value={night} onChange={setNight} options={NIGHTS} ariaLabel="Nuit" />
          <Segmented value={minEl} onChange={setMinEl} options={MIN_EL} ariaLabel="Hauteur minimale" />
        </div>
        <LocationButton />
      </div>

      {celestrak.error && (
        <div className="card card-pad flex items-start gap-3 border-red-500/40 text-sm">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="font-medium">Impossible de télécharger les orbites ({celestrak.error}).</p>
            <p className="text-night-500">{sats ? 'Les dernières orbites enregistrées sont utilisées.' : 'Vérifiez votre connexion puis réessayez.'}</p>
          </div>
        </div>
      )}
      {!sats && !celestrak.error && <Loader label="Téléchargement des orbites de CelesTrak…" />}

      {sats && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
          <section className="card min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-night-200 px-4 py-3 dark:border-night-800">
              <div>
                <h2 className="font-display font-semibold">Nuit du {fmtDate(start)}</h2>
                <p className="text-xs text-night-500">
                  {passes.length} passages visibles · {sats.length} satellites suivis
                  {loading ? ` · calcul ${Math.round((done / sats.length) * 100)} %` : ''}
                </p>
              </div>
              <button type="button" className="btn text-xs" onClick={celestrak.reload} title="Recharger les orbites">
                <RefreshCw size={13} /> Orbites {tleAge != null ? `(il y a ${tleAge < 1 ? 'moins d’1 h' : `${Math.round(tleAge)} h`})` : ''}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="table-data">
                <thead>
                  <tr>
                    <th>Satellite</th>
                    <th className="text-right">Mag.</th>
                    <th>Début</th>
                    <th>Maximum</th>
                    <th>Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {passes.map((p) => {
                    const id = `${p.sat.id}${p.start.t.getTime()}`
                    return (
                      <tr key={id} onClick={() => setSelected(id)} className={`cursor-pointer ${current === p ? 'bg-accent-400/10' : ''}`}>
                        <td className="max-w-48 truncate font-medium" title={p.sat.name}>
                          {p.sat.name}
                        </td>
                        <td className="text-right font-mono">{p.magnitude != null ? fmt(p.magnitude, 1) : '—'}</td>
                        <td>{point(p.start)}</td>
                        <td>{point(p.peak)}</td>
                        <td>{point(p.end)}</td>
                      </tr>
                    )
                  })}
                  {!loading && passes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-night-500">
                        Aucun passage visible : nuits trop courtes ou satellites dans l'ombre de la Terre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="card card-pad h-fit lg:sticky lg:top-20">
            {current ? (
              <>
                <h2 className="font-display font-semibold">{current.sat.name}</h2>
                <p className="mb-3 text-xs text-night-500">
                  NORAD {current.sat.id} · visible pendant {Math.round((current.end.t - current.start.t) / 60_000)} min
                </p>
                <PassTrack pass={current} />
                <p className="mt-3 text-xs text-night-500">
                  Vert : apparition, rouge : disparition (entrée dans l'ombre de la Terre ou passage sous {minEl}°). Nord en haut, est à gauche, comme en
                  regardant le ciel au-dessus de soi.
                </p>
              </>
            ) : (
              <p className="text-sm text-night-500">{loading ? 'Calcul des passages…' : 'Sélectionnez un passage.'}</p>
            )}
          </aside>
        </div>
      )}

      <p className="text-xs text-night-500">
        Liste « visual » de CelesTrak (satellites et étages de fusée les plus brillants). La magnitude n'est estimée que pour les satellites dont l'éclat
        standard est connu ; les autres sont généralement entre les magnitudes 2 et 5. Les flashs des panneaux et antennes ne sont pas prévus.
      </p>
    </div>
  )
}

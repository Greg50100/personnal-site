import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { LocationButton } from '../../../components/LocationPicker'
import Segmented from '../../../components/Segmented'
import { fmt, fmtDate, fmtDuration, fmtLat, fmtLon, fmtTime } from '../../../lib/format'
import { Astronomy, makeObserver } from '../lib/astro'
import { capPath, subPoint, xy } from '../lib/geo'
import WorldMap from '../components/WorldMap'
import { LUNAR_KIND, SOLAR_KIND, lunarEclipses, solarEclipses, transits } from './eclipses'

const SPANS = [
  { value: 5, label: '5 ans' },
  { value: 10, label: '10 ans' },
  { value: 20, label: '20 ans' },
]
const percent = (x) => (x == null ? '—' : x < 0.005 ? '< 1 %' : `${fmt(x * 100, 0)} %`)
const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

function VisibleBadge({ visible }) {
  return visible ? (
    <span className="chip text-emerald-700 dark:text-emerald-400">
      <Eye size={12} /> visible
    </span>
  ) : (
    <span className="chip text-night-400">
      <EyeOff size={12} /> non visible
    </span>
  )
}

function SolarDetail({ e, location }) {
  const events = e.local
    ? [
        ['Début', e.local.begin],
        [e.local.kind === 'annular' ? 'Début de l’anneau' : 'Début de la totalité', e.local.totalBegin],
        ['Maximum', e.local.peak],
        [e.local.kind === 'annular' ? 'Fin de l’anneau' : 'Fin de la totalité', e.local.totalEnd],
        ['Fin', e.local.end],
      ].filter(([, c]) => c)
    : []
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div>
        <WorldMap date={e.peak} observer={location} label="Carte de l'éclipse au maximum">
          {e.center && (
            <g>
              <circle cx={xy(e.center.lat, e.center.lon)[0]} cy={xy(e.center.lat, e.center.lon)[1]} r="2.4" fill="#f43f5e" stroke="#fff" strokeWidth="0.5" />
            </g>
          )}
        </WorldMap>
        <p className="mt-2 text-xs text-night-500">
          Jour, crépuscules et nuit au maximum de l'éclipse ;
          {e.center ? ` point rouge : centre de la bande ${e.kind === 'annular' ? 'd’annularité' : 'de totalité'} (${fmtLat(e.center.lat, 1)}, ${fmtLon(e.center.lon, 1)}).` : ' éclipse partielle partout.'}
        </p>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Depuis votre lieu</h3>
        {e.local ? (
          <>
            <p className="mb-2 text-sm">
              Éclipse {SOLAR_KIND[e.local.kind]}, {fmt(e.local.obscuration * 100, 1)} % du disque solaire masqué au maximum.
            </p>
            <table className="table-data">
              <tbody>
                {events.map(([label, c]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    <td className="font-mono">{fmtTime(c.time.date, true)}</td>
                    <td className={`text-right font-mono ${c.altitude > 0 ? '' : 'text-night-400'}`}>{fmt(c.altitude, 1)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-xs text-night-500">Hauteur du Soleil à chaque instant. Ne regardez jamais le Soleil sans protection homologuée.</p>
          </>
        ) : (
          <p className="text-sm text-night-500">L'éclipse n'est pas visible depuis votre lieu (hors de la zone de pénombre ou Soleil couché).</p>
        )}
      </div>
    </div>
  )
}

function LunarDetail({ e, location }) {
  const moon = subPoint(Astronomy.Body.Moon, e.peak)
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div>
        <WorldMap date={e.peak} observer={location} showNight={false} label="Zone où la Lune est levée au maximum">
          <path d={capPath(moon, 90)} fill="#a78bfa" fillOpacity="0.28" />
          <circle cx={xy(moon.lat, moon.lon)[0]} cy={xy(moon.lat, moon.lon)[1]} r="2.2" fill="#e4e4e7" stroke="#0a0f21" strokeWidth="0.5" />
        </WorldMap>
        <p className="mt-2 text-xs text-night-500">Zone violette : la Lune est au-dessus de l'horizon au maximum de l'éclipse.</p>
      </div>
      <div>
        <h3 className="mb-2 font-semibold">Déroulement (heures locales)</h3>
        <table className="table-data">
          <tbody>
            {e.contacts.map((c) => (
              <tr key={c.label}>
                <td>{c.label}</td>
                <td className="font-mono">{fmtTime(c.time)}</td>
                <td className={`text-right font-mono ${c.altitude > 0 ? '' : 'text-night-400'}`}>{fmt(c.altitude, 0)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-night-500">
          Hauteur de la Lune pour votre lieu. Durée de la phase {e.kind === 'total' ? 'totale' : e.kind === 'partial' ? 'partielle' : 'pénombrale'} :{' '}
          {fmtDuration((e.kind === 'total' ? e.durations.total : e.kind === 'partial' ? e.durations.partial : e.durations.penumbral) / 60)}.
        </p>
      </div>
    </div>
  )
}

export default function Eclipses() {
  const { location } = useObserverLocation()
  const observer = useMemo(() => makeObserver(location), [location])
  const [startYear, setStartYear] = useState(() => new Date().getFullYear())
  const [span, setSpan] = useState(10)
  const [selected, setSelected] = useState(null)

  const data = useMemo(() => {
    const start = startYear === new Date().getFullYear() ? new Date() : new Date(startYear, 0, 1)
    const end = new Date(startYear + span, 0, 1)
    return {
      solar: solarEclipses(start, end, observer),
      lunar: lunarEclipses(start, end, observer),
      transits: transits(start, 3),
    }
  }, [startYear, span, observer])

  const all = [...data.solar, ...data.lunar].sort((a, b) => a.peak - b.peak)
  const current = all.find((e) => e.peak.getTime() === selected) ?? all.find((e) => (e.type === 'solar' ? e.local : e.visible)) ?? all[0]

  const row = (e) => (
    <tr
      key={e.peak.getTime()}
      onClick={() => setSelected(e.peak.getTime())}
      className={`cursor-pointer ${current === e ? 'bg-accent-400/10' : ''}`}
    >
      <td className="whitespace-nowrap">{dateFmt.format(e.peak)}</td>
      <td>{e.type === 'solar' ? SOLAR_KIND[e.kind] : LUNAR_KIND[e.kind]}</td>
      <td className="text-right font-mono">{percent(e.type === 'solar' ? e.local?.obscuration : e.kind === 'penumbral' ? null : e.obscuration)}</td>
      <td>
        <VisibleBadge visible={e.type === 'solar' ? Boolean(e.local) : e.visible} />
      </td>
    </tr>
  )

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="btn-icon" onClick={() => setStartYear(startYear - span)} aria-label="Période précédente">
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-28 text-center font-mono font-semibold">
            {startYear} – {startYear + span - 1}
          </span>
          <button type="button" className="btn-icon" onClick={() => setStartYear(startYear + span)} aria-label="Période suivante">
            <ChevronRight size={16} />
          </button>
          <Segmented size="sm" value={span} onChange={setSpan} options={SPANS} ariaLabel="Durée" />
        </div>
        <LocationButton />
      </div>

      {current && (
        <section className="card card-pad">
          <h2 className="mb-1 font-display text-xl font-semibold">
            Éclipse {current.type === 'solar' ? `${SOLAR_KIND[current.kind]} de Soleil` : `de Lune ${LUNAR_KIND[current.kind]}`}
          </h2>
          <p className="mb-4 text-sm text-night-600 dark:text-night-400">
            {fmtDate(current.peak)}, maximum à {fmtTime(current.peak)} (heure locale)
          </p>
          {current.type === 'solar' ? <SolarDetail e={current} location={location} /> : <LunarDetail e={current} location={location} />}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card overflow-hidden">
          <h2 className="border-b border-night-200 px-4 py-3 font-display font-semibold dark:border-night-800">Éclipses de Soleil ({data.solar.length})</h2>
          <div className="overflow-x-auto">
            <table className="table-data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Chez vous</th>
                  <th />
                </tr>
              </thead>
              <tbody>{data.solar.map(row)}</tbody>
            </table>
          </div>
        </section>
        <section className="card overflow-hidden">
          <h2 className="border-b border-night-200 px-4 py-3 font-display font-semibold dark:border-night-800">Éclipses de Lune ({data.lunar.length})</h2>
          <div className="overflow-x-auto">
            <table className="table-data">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Ombre</th>
                  <th />
                </tr>
              </thead>
              <tbody>{data.lunar.map(row)}</tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="border-b border-night-200 px-4 py-3 font-display font-semibold dark:border-night-800">Prochains passages de Mercure et de Vénus devant le Soleil</h2>
        <div className="overflow-x-auto">
          <table className="table-data">
            <thead>
              <tr>
                <th>Planète</th>
                <th>Date</th>
                <th>Début</th>
                <th>Maximum</th>
                <th>Fin</th>
                <th className="text-right">Distance minimale au centre</th>
              </tr>
            </thead>
            <tbody>
              {data.transits.map((t) => (
                <tr key={`${t.body}${t.peak.getTime()}`}>
                  <td>{t.body === 'Venus' ? 'Vénus' : 'Mercure'}</td>
                  <td className="whitespace-nowrap">{dateFmt.format(t.peak)}</td>
                  <td className="font-mono">{fmtTime(t.start)}</td>
                  <td className="font-mono">{fmtTime(t.peak)}</td>
                  <td className="font-mono">{fmtTime(t.finish)}</td>
                  <td className="text-right font-mono">{fmt(t.separation, 1)}′</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

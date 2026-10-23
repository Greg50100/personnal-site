import { useMemo } from 'react'
import { useObserverLocation } from '../../../context/location'
import { useAstroClock } from '../../../hooks/useAstroClock'
import { LocationButton } from '../../../components/LocationPicker'
import { fmt, fmtLat, fmtLon } from '../../../lib/format'
import { Astronomy, moonInfo } from '../lib/astro'
import { angularDistance, subPoint, xy } from '../lib/geo'
import WorldMap from '../components/WorldMap'
import TimeControls from '../components/TimeControls'
import { InfoCard, Row } from '../components/InfoCard'

const CITIES = [
  { name: 'Paris', lat: 48.857, lon: 2.352, zone: 'Europe/Paris' },
  { name: 'Londres', lat: 51.507, lon: -0.128, zone: 'Europe/London' },
  { name: 'Reykjavik', lat: 64.147, lon: -21.943, zone: 'Atlantic/Reykjavik' },
  { name: 'Moscou', lat: 55.756, lon: 37.617, zone: 'Europe/Moscow' },
  { name: 'Dubaï', lat: 25.205, lon: 55.271, zone: 'Asia/Dubai' },
  { name: 'Saint-Denis (La Réunion)', lat: -20.882, lon: 55.45, zone: 'Indian/Reunion' },
  { name: 'Le Cap', lat: -33.925, lon: 18.424, zone: 'Africa/Johannesburg' },
  { name: 'New Delhi', lat: 28.614, lon: 77.209, zone: 'Asia/Kolkata' },
  { name: 'Pékin', lat: 39.904, lon: 116.407, zone: 'Asia/Shanghai' },
  { name: 'Tokyo', lat: 35.69, lon: 139.692, zone: 'Asia/Tokyo' },
  { name: 'Sydney', lat: -33.869, lon: 151.209, zone: 'Australia/Sydney' },
  { name: 'Nouméa', lat: -22.276, lon: 166.458, zone: 'Pacific/Noumea' },
  { name: 'Anchorage', lat: 61.218, lon: -149.9, zone: 'America/Anchorage' },
  { name: 'Los Angeles', lat: 34.052, lon: -118.244, zone: 'America/Los_Angeles' },
  { name: 'New York', lat: 40.713, lon: -74.006, zone: 'America/New_York' },
  { name: 'Fort-de-France', lat: 14.616, lon: -61.059, zone: 'America/Martinique' },
  { name: 'Rio de Janeiro', lat: -22.907, lon: -43.173, zone: 'America/Sao_Paulo' },
]

/** Hauteur approchée du Soleil (degrés, sans réfraction) en un lieu, à partir du point subsolaire. */
const sunAltitude = (sun, place) => 90 - angularDistance(sun, place)

function lighting(alt) {
  if (alt > 0) return { label: 'Jour', className: 'text-accent-700 dark:text-accent-300' }
  if (alt > -6) return { label: 'Crépuscule civil', className: 'text-sky-600 dark:text-sky-300' }
  if (alt > -12) return { label: 'Crépuscule nautique', className: 'text-indigo-600 dark:text-indigo-300' }
  if (alt > -18) return { label: 'Crépuscule astronomique', className: 'text-violet-600 dark:text-violet-300' }
  return { label: 'Nuit', className: 'text-night-500' }
}

export default function DayNight() {
  const { location } = useObserverLocation()
  const clock = useAstroClock({ intervalMs: 30_000 })
  const date = clock.date

  const data = useMemo(() => {
    const sun = subPoint(Astronomy.Body.Sun, date)
    const moon = subPoint(Astronomy.Body.Moon, date)
    return { sun, moon, moonPhase: moonInfo(date) }
  }, [date])

  const here = sunAltitude(data.sun, location)
  const [mx, my] = xy(data.moon.lat, data.moon.lon)
  const places = [{ name: location.name ?? 'Votre lieu', lat: location.lat, lon: location.lon, here: true }, ...CITIES]

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad flex flex-wrap items-center justify-between gap-3">
        <TimeControls clock={clock} />
        <LocationButton />
      </div>

      <section className="card overflow-hidden p-2 sm:p-3">
        <WorldMap date={date} observer={location} label="Jour et nuit sur la Terre">
          <circle cx={mx} cy={my} r="2" fill="#e4e4e7" stroke="#0a0f21" strokeWidth="0.5" />
          <text x={mx + 3} y={my + 1.5} className="fill-white text-[4.5px]">
            Lune
          </text>
          {CITIES.map((c) => {
            const [x, y] = xy(c.lat, c.lon)
            return <circle key={c.name} cx={x} cy={y} r="0.7" fill="#f8fafc" fillOpacity="0.8" />
          })}
        </WorldMap>
        <p className="px-2 pt-2 text-xs text-night-500">
          Zones de plus en plus sombres : crépuscules civil, nautique, astronomique puis nuit. Soleil jaune : point où il est au zénith ; point rouge : votre lieu.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <InfoCard title="Le Soleil et la Lune au zénith">
          <Row label="Point subsolaire" value={`${fmtLat(data.sun.lat, 2)}, ${fmtLon(data.sun.lon, 2)}`} />
          <Row label="Point sublunaire" value={`${fmtLat(data.moon.lat, 2)}, ${fmtLon(data.moon.lon, 2)}`} />
          <Row label="Lune éclairée" value={`${fmt(data.moonPhase.illumination * 100, 0)} %`} sub={data.moonPhase.name} />
          <Row label="Chez vous" value={lighting(here).label} sub={`Soleil à ${fmt(here, 1)}°`} />
        </InfoCard>
        <section className="card min-w-0 overflow-hidden">
          <h2 className="border-b border-night-200 px-4 py-3 font-display font-semibold dark:border-night-800">Dans le monde</h2>
          <div className="overflow-x-auto">
            <table className="table-data">
              <thead>
                <tr>
                  <th>Lieu</th>
                  <th>Heure locale</th>
                  <th className="text-right">Soleil</th>
                  <th>Éclairage</th>
                </tr>
              </thead>
              <tbody>
                {places.map((p) => {
                  const alt = sunAltitude(data.sun, p)
                  const l = lighting(alt)
                  return (
                    <tr key={p.name} className={p.here ? 'bg-accent-400/10' : ''}>
                      <td className="font-medium">{p.name}</td>
                      <td className="font-mono">
                        {p.zone ? date.toLocaleTimeString('fr-FR', { timeZone: p.zone, hour: '2-digit', minute: '2-digit' }) : date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="text-right font-mono">{fmt(alt, 0)}°</td>
                      <td className={l.className}>{l.label}</td>
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

import { useMemo, useState } from 'react'
import { CalendarClock, Compass, Moon, Orbit } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useAstroClock } from '../../../hooks/useAstroClock'
import { LocationButton } from '../../../components/LocationPicker'
import { compass, fmt, fmtAngle, fmtHMS, fmtShortDate, fmtTime } from '../../../lib/format'
import {
  Astronomy,
  addDays,
  addHours,
  altitudeSeries,
  bodyConstellation,
  bodyPosition,
  diameterArcsec,
  fmtDiameter,
  makeObserver,
  moonInfo,
  nextMoonQuarters,
  riseTransitSet,
  startOfDay,
} from '../lib/astro'
import AltitudeChart from '../components/AltitudeChart'
import MoonPhase from '../components/MoonPhase'
import TimeControls from '../components/TimeControls'
import { InfoCard, Row } from '../components/InfoCard'

const MONTHS = Array.from({ length: 12 }, (_, i) => i)
const signedDeg = (v, pos, neg) => `${fmt(Math.abs(v), 2)}° ${v >= 0 ? pos : neg}`
const when = (d) => `${fmtShortDate(d)} ${fmtTime(d)}`

/** Prochains passages au périgée / apogée et aux nœuds. */
function orbitEvents(date, count = 4) {
  const events = []
  let apsis = Astronomy.SearchLunarApsis(date)
  for (let i = 0; i < count; i++) {
    events.push({ name: apsis.kind === 0 ? 'Périgée' : 'Apogée', date: apsis.time.date, detail: `${Math.round(apsis.dist_km).toLocaleString('fr-FR')} km` })
    apsis = Astronomy.NextLunarApsis(apsis)
  }
  let node = Astronomy.SearchMoonNode(date)
  for (let i = 0; i < 2; i++) {
    events.push({ name: node.kind > 0 ? 'Nœud ascendant' : 'Nœud descendant', date: node.time.date })
    node = Astronomy.NextMoonNode(node)
  }
  return events.sort((a, b) => a.date - b.date)
}

export default function MoonPage() {
  const { location } = useObserverLocation()
  const clock = useAstroClock({ intervalMs: 10_000 })
  const date = clock.date
  const observer = useMemo(() => makeObserver(location), [location])
  const dayKey = startOfDay(date).getTime()
  const [month, setMonth] = useState(null)

  const now = useMemo(() => {
    const info = moonInfo(date)
    const pos = bodyPosition('Moon', date, observer)
    const lib = Astronomy.Libration(date)
    const ecl = Astronomy.EclipticGeoMoon(date)
    return {
      info,
      pos,
      lib,
      ecl,
      elong: Astronomy.AngleFromSun(Astronomy.Body.Moon, date),
      constellation: bodyConstellation('Moon', date, observer),
      topoDiameter: diameterArcsec('Moon', pos.dist),
    }
  }, [date, observer])

  const day = useMemo(() => {
    const d = new Date(dayKey)
    const rts = riseTransitSet('Moon', observer, d)
    const at = (t) => (t ? bodyPosition('Moon', t, observer) : null)
    const start = addHours(d, 12)
    const end = addHours(d, 36)
    return {
      rts,
      riseAz: at(rts.rise)?.az,
      setAz: at(rts.set)?.az,
      series: [
        { id: 'Sun', name: 'Soleil', color: '#facc15', points: altitudeSeries('Sun', observer, start, end, 15) },
        { id: 'Moon', name: 'Lune', color: '#e4e4e7', points: altitudeSeries('Moon', observer, start, end, 15) },
      ],
      start,
      end,
      quarters: nextMoonQuarters(d, 8),
      orbit: orbitEvents(d),
    }
  }, [dayKey, observer])

  const year = new Date(dayKey).getFullYear()
  const shownMonth = month ?? new Date(dayKey).getMonth()
  const table = useMemo(() => {
    const rows = []
    for (let d = new Date(year, shownMonth, 1); d.getMonth() === shownMonth; d = addDays(d, 1)) {
      const day0 = startOfDay(d)
      const evening = addHours(day0, 21)
      const info = moonInfo(evening)
      rows.push({ date: day0, info, ...riseTransitSet('Moon', observer, day0), dist: info.distanceKm })
    }
    return rows
  }, [year, shownMonth, observer])

  const { info, pos, lib } = now
  const south = location.lat < 0

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad flex flex-wrap items-center justify-between gap-3">
        <TimeControls clock={clock} />
        <LocationButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="card card-pad flex flex-col items-center gap-3 text-center">
          <MoonPhase phase={info.phase} size={150} south={south} title={info.name} />
          <div>
            <p className="font-display text-2xl font-semibold">{info.name}</p>
            <p className="text-sm text-night-600 dark:text-night-400">
              Éclairée à {fmt(info.illumination * 100, 1)} % · âge {fmt(info.ageDays, 1)} jours
            </p>
          </div>
          <div className="w-full text-left">
            <Row label="Angle de phase (écliptique)" value={`${fmt(info.phase, 1)}°`} />
            <Row label="Élongation" value={`${fmt(now.elong, 1)}°`} />
            <Row label="Magnitude" value={fmt(info.magnitude, 1)} />
          </div>
        </section>

        <InfoCard title="Position" icon={Compass} aside={<span className="chip">{pos.alt > 0 ? 'Levée' : 'Couchée'}</span>}>
          <Row label="Hauteur" value={`${fmt(pos.alt, 2)}°`} />
          <Row label="Azimut" value={`${fmt(pos.az, 2)}°`} sub={compass(pos.az)} />
          <Row label="Ascension droite" value={fmtHMS(pos.ra)} />
          <Row label="Déclinaison" value={fmtAngle(pos.dec)} />
          <Row label="Longitude écliptique" value={`${fmt(now.ecl.lon, 2)}°`} />
          <Row label="Latitude écliptique" value={`${fmt(now.ecl.lat, 2)}°`} />
          <Row label="Constellation" value={now.constellation.name} />
        </InfoCard>

        <InfoCard title="Distance et libration" icon={Orbit}>
          <Row label="Distance (centre de la Terre)" value={`${Math.round(info.distanceKm).toLocaleString('fr-FR')} km`} />
          <Row label="Distance (depuis votre lieu)" value={`${Math.round(pos.dist * Astronomy.KM_PER_AU).toLocaleString('fr-FR')} km`} />
          <Row label="Diamètre apparent" value={fmtDiameter(now.topoDiameter)} />
          <Row label="Libration en longitude" value={signedDeg(lib.elon, 'E', 'O')} hint="Positive : on voit davantage le bord est (côté Mare Crisium)" />
          <Row label="Libration en latitude" value={signedDeg(lib.elat, 'N', 'S')} hint="Positive : on voit davantage le pôle Nord lunaire" />
        </InfoCard>

        <InfoCard title={`Le ${fmtShortDate(new Date(dayKey))}`} icon={Moon}>
          {day.rts.state !== 'normal' && <p className="mb-2 text-sm">{day.rts.state === 'up' ? 'La Lune reste levée toute la journée.' : 'La Lune ne se lève pas.'}</p>}
          <Row label="Lever" value={fmtTime(day.rts.rise)} sub={Number.isFinite(day.riseAz) ? `${fmt(day.riseAz, 0)}° ${compass(day.riseAz)}` : null} />
          <Row label="Passage au méridien" value={fmtTime(day.rts.transit)} sub={day.rts.transit ? `h = ${fmt(day.rts.transitAlt, 1)}°` : null} />
          <Row label="Coucher" value={fmtTime(day.rts.set)} sub={Number.isFinite(day.setAz) ? `${fmt(day.setAz, 0)}° ${compass(day.setAz)}` : null} />
        </InfoCard>

        <InfoCard title="Prochaines phases" icon={CalendarClock}>
          {day.quarters.map((q) => (
            <Row key={q.date.getTime()} label={q.name} value={when(q.date)} />
          ))}
        </InfoCard>

        <InfoCard title="Orbite" icon={Orbit}>
          {day.orbit.map((e) => (
            <Row key={`${e.name}${e.date.getTime()}`} label={e.name} value={when(e.date)} sub={e.detail} />
          ))}
        </InfoCard>
      </div>

      <section className="card card-pad">
        <h2 className="mb-3 font-display font-semibold">Hauteur de la Lune, de midi à midi</h2>
        <AltitudeChart series={day.series} start={day.start} end={day.end} now={clock.live ? date : null} />
      </section>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-night-200 px-4 py-3 dark:border-night-800">
          <h2 className="font-display font-semibold">Calendrier lunaire du mois</h2>
          <select className="input w-auto" value={shownMonth} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Mois">
            {MONTHS.map((i) => (
              <option key={i} value={i}>
                {new Date(year, i, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="table-data">
            <thead>
              <tr>
                <th>Date</th>
                <th>Phase (21 h)</th>
                <th>Éclairée</th>
                <th>Lever</th>
                <th>Passage</th>
                <th>Coucher</th>
                <th>Distance</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.date.getTime()} className={r.date.getTime() === dayKey ? 'bg-accent-400/10' : ''}>
                  <td className="whitespace-nowrap">{fmtShortDate(r.date)}</td>
                  <td className="whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <MoonPhase phase={r.info.phase} size={18} south={south} />
                      {r.info.name}
                    </span>
                  </td>
                  <td className="font-mono">{fmt(r.info.illumination * 100, 0)} %</td>
                  <td className="font-mono">{fmtTime(r.rise)}</td>
                  <td className="font-mono">{fmtTime(r.transit)}</td>
                  <td className="font-mono">{fmtTime(r.set)}</td>
                  <td className="font-mono">{Math.round(r.dist).toLocaleString('fr-FR')} km</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

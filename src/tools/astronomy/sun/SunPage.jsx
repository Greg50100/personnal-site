import { useMemo, useState } from 'react'
import { CalendarRange, Compass, Sunrise, Sun } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useAstroClock } from '../../../hooks/useAstroClock'
import { LocationButton } from '../../../components/LocationPicker'
import { compass, fmt, fmtAngle, fmtDate, fmtDuration, fmtHMS, fmtShortDate, fmtTime } from '../../../lib/format'
import LineChart from '../../kit/LineChart'
import { Astronomy, addDays, addHours, altitudeSeries, bodyConstellation, bodyPosition, diameterArcsec, fmtDiameter, makeObserver, startOfDay, sunDay } from '../lib/astro'
import { solarTime } from '../lib/time'
import AltitudeChart from '../components/AltitudeChart'
import TimeControls from '../components/TimeControls'
import { InfoCard, Row } from '../components/InfoCard'

const MONTH_STARTS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
const MONTH_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const hoursOf = (d) => (d ? d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600 : NaN)
const hhmm = (h) => (Number.isFinite(h) ? `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, '0')}` : '—')

function withAz(date, observer) {
  if (!date) return { time: null, az: NaN }
  return { time: date, az: bodyPosition('Sun', date, observer).az }
}

/** Instants remarquables de l'année : équinoxes, solstices, périhélie et aphélie. */
function yearEvents(year) {
  const s = Astronomy.Seasons(year)
  const events = [
    { name: 'Équinoxe de mars', date: s.mar_equinox.date },
    { name: 'Solstice de juin', date: s.jun_solstice.date },
    { name: 'Équinoxe de septembre', date: s.sep_equinox.date },
    { name: 'Solstice de décembre', date: s.dec_solstice.date },
  ]
  let apsis = Astronomy.SearchPlanetApsis(Astronomy.Body.Earth, new Date(year, 0, 1))
  for (let i = 0; i < 2; i++) {
    events.push({ name: apsis.kind === 0 ? 'Périhélie' : 'Aphélie', date: apsis.time.date, detail: `${fmt(apsis.dist_au, 5)} ua` })
    apsis = Astronomy.NextPlanetApsis(Astronomy.Body.Earth, apsis)
  }
  return events.filter((e) => e.date.getFullYear() === year).sort((a, b) => a.date - b.date)
}

export default function SunPage() {
  const { location } = useObserverLocation()
  const clock = useAstroClock({ intervalMs: 5000 })
  const date = clock.date
  const observer = useMemo(() => makeObserver(location), [location])
  const dayKey = startOfDay(date).getTime()
  const [month, setMonth] = useState(null)

  const now = useMemo(() => {
    const pos = bodyPosition('Sun', date, observer)
    const ecl = Astronomy.SunPosition(date)
    return {
      pos,
      ecl,
      hourAngle: Astronomy.HourAngle(Astronomy.Body.Sun, date, observer),
      constellation: bodyConstellation('Sun', date, observer),
      solar: solarTime(date, location.lon),
    }
  }, [date, observer, location.lon])

  const day = useMemo(() => {
    const d = new Date(dayKey)
    const today = sunDay(observer, d)
    const yesterday = sunDay(observer, addDays(d, -1))
    const start = d
    const end = addDays(d, 1)
    return {
      today,
      diff: today.dayLength != null && yesterday.dayLength != null ? (today.dayLength - yesterday.dayLength) * 60 : null,
      rise: withAz(today.sunrise, observer),
      set: withAz(today.sunset, observer),
      series: [{ id: 'Sun', name: 'Soleil', color: '#facc15', points: altitudeSeries('Sun', observer, start, end, 10) }],
      start,
      end,
    }
  }, [dayKey, observer])

  const year = new Date(dayKey).getFullYear()
  const annual = useMemo(() => {
    const rise = []
    const set = []
    const length = []
    for (let doy = 0; doy < 366; doy += 3) {
      const d = new Date(year, 0, 1 + doy)
      if (d.getFullYear() !== year) break
      const r = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, d, 1)?.date
      const s = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, d, 1)?.date
      rise.push([doy + 1, hoursOf(r)])
      set.push([doy + 1, hoursOf(s)])
      // Sans lever ni coucher : jour polaire (24 h) ou nuit polaire (0 h)
      const polar = !r && !s ? (bodyPosition('Sun', addHours(d, 12), observer).alt > 0 ? 24 : 0) : NaN
      length.push([doy + 1, r && s && s > r ? (s - r) / 3_600_000 : polar])
    }
    return { rise, set, length, events: yearEvents(year) }
  }, [year, observer])

  const shownMonth = month ?? new Date(dayKey).getMonth()
  const table = useMemo(() => {
    const rows = []
    for (let d = new Date(year, shownMonth, 1); d.getMonth() === shownMonth; d = addHours(d, 24)) {
      const day0 = startOfDay(d)
      rows.push({ date: day0, ...sunDay(observer, day0) })
    }
    return rows
  }, [year, shownMonth, observer])

  const doy = Math.floor((dayKey - new Date(year, 0, 1).getTime()) / 86_400_000) + 1
  const { today } = day
  const above = now.pos.alt > 0

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad flex flex-wrap items-center justify-between gap-3">
        <TimeControls clock={clock} />
        <LocationButton />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard title="Position" icon={Compass} aside={<span className={`chip ${above ? 'text-accent-700 dark:text-accent-300' : ''}`}>{above ? 'Au-dessus de l’horizon' : 'Sous l’horizon'}</span>}>
          <Row label="Hauteur" value={`${fmt(now.pos.alt, 2)}°`} />
          <Row label="Azimut" value={`${fmt(now.pos.az, 2)}°`} sub={compass(now.pos.az)} />
          <Row label="Ascension droite" value={fmtHMS(now.pos.ra)} />
          <Row label="Déclinaison" value={fmtAngle(now.pos.dec)} />
          <Row label="Longitude écliptique" value={`${fmt(now.ecl.elon, 3)}°`} />
          <Row label="Angle horaire" value={fmtHMS(now.hourAngle)} />
          <Row label="Constellation" value={now.constellation.name} />
        </InfoCard>

        <InfoCard title="Distance et temps solaire" icon={Sun}>
          <Row label="Distance" value={`${fmt(now.pos.dist, 6)} ua`} sub={`${fmt(now.pos.dist * Astronomy.KM_PER_AU / 1e6, 3)} M km`} />
          <Row label="Diamètre apparent" value={fmtDiameter(diameterArcsec('Sun', now.pos.dist))} />
          <Row label="Temps de lumière" value={`${fmt((now.pos.dist * Astronomy.KM_PER_AU) / 299_792.458 / 60, 2)} min`} />
          <Row label="Temps solaire vrai" value={fmtHMS(now.solar.apparent)} />
          <Row label="Équation du temps" value={`${now.solar.equationOfTime >= 0 ? '+' : '−'}${fmt(Math.abs(now.solar.equationOfTime), 2)} min`} />
        </InfoCard>

        <InfoCard title={`Journée du ${fmtShortDate(new Date(dayKey))}`} icon={Sunrise}>
          <Row label="Aube astronomique" value={fmtTime(today.astronomicalDawn)} />
          <Row label="Aube nautique" value={fmtTime(today.nauticalDawn)} />
          <Row label="Aube civile" value={fmtTime(today.civilDawn)} />
          <Row label="Lever" value={fmtTime(day.rise.time)} sub={Number.isFinite(day.rise.az) ? `${fmt(day.rise.az, 0)}° ${compass(day.rise.az)}` : null} />
          <Row label="Midi vrai" value={fmtTime(today.noon, true)} sub={`h = ${fmt(today.noonAlt, 1)}°`} />
          <Row label="Coucher" value={fmtTime(day.set.time)} sub={Number.isFinite(day.set.az) ? `${fmt(day.set.az, 0)}° ${compass(day.set.az)}` : null} />
          <Row label="Crépuscule civil" value={fmtTime(today.civilDusk)} />
          <Row label="Crépuscule nautique" value={fmtTime(today.nauticalDusk)} />
          <Row label="Crépuscule astronomique" value={fmtTime(today.astronomicalDusk)} />
          <Row
            label="Durée du jour"
            value={fmtDuration(today.dayLength)}
            sub={day.diff == null ? null : `${day.diff >= 0 ? '+' : '−'}${fmt(Math.abs(day.diff), 1)} min`}
          />
        </InfoCard>
      </div>

      <section className="card card-pad">
        <h2 className="mb-3 font-display font-semibold">Hauteur du Soleil sur la journée</h2>
        <AltitudeChart series={day.series} start={day.start} end={day.end} now={clock.live ? date : null} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="card card-pad min-w-0">
          <h2 className="mb-3 font-display font-semibold">Lever, coucher et durée du jour en {year}</h2>
          <LineChart
            chart={{
              x: { label: 'Date', ticks: MONTH_STARTS.map((m) => m + 1), format: (v) => new Date(year, 0, Math.round(v)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) },
              y: { label: 'Heures', min: 0, max: 24, ticks: [0, 3, 6, 9, 12, 15, 18, 21, 24], format: hhmm },
              series: [
                { name: 'Lever', color: '#f59e0b', points: annual.rise },
                { name: 'Coucher', color: '#8b5cf6', points: annual.set },
                { name: 'Durée du jour', color: '#38bdf8', points: annual.length, dashed: true },
              ],
              markers: Number.isFinite(today.dayLength) ? [{ x: doy, y: today.dayLength, label: 'Aujourd’hui', color: '#38bdf8' }] : [],
            }}
          />
        </section>
        <InfoCard title={`L'année ${year}`} icon={CalendarRange}>
          {annual.events.map((e) => (
            <Row key={e.name} label={e.name} value={`${fmtShortDate(e.date)} ${fmtTime(e.date)}`} sub={e.detail} />
          ))}
        </InfoCard>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-night-200 px-4 py-3 dark:border-night-800">
          <h2 className="font-display font-semibold">Éphémérides du mois</h2>
          <select className="input w-auto" value={shownMonth} onChange={(e) => setMonth(Number(e.target.value))} aria-label="Mois">
            {MONTH_SHORT.map((m, i) => (
              <option key={m} value={i}>
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
                <th>Aube civile</th>
                <th>Lever</th>
                <th>Midi vrai</th>
                <th>Hauteur</th>
                <th>Coucher</th>
                <th>Crép. civil</th>
                <th>Durée du jour</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.date.getTime()} className={r.date.getTime() === dayKey ? 'bg-accent-400/10' : ''}>
                  <td className="whitespace-nowrap">{fmtShortDate(r.date)}</td>
                  <td className="font-mono">{fmtTime(r.civilDawn)}</td>
                  <td className="font-mono">{fmtTime(r.sunrise)}</td>
                  <td className="font-mono">{fmtTime(r.noon)}</td>
                  <td className="font-mono">{fmt(r.noonAlt, 1)}°</td>
                  <td className="font-mono">{fmtTime(r.sunset)}</td>
                  <td className="font-mono">{fmtTime(r.civilDusk)}</td>
                  <td className="font-mono">{fmtDuration(r.dayLength)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <p className="text-xs text-night-500">Heures locales de cet appareil · {fmtDate(new Date(dayKey))}. Lever et coucher : bord supérieur du disque, réfraction standard.</p>
    </div>
  )
}

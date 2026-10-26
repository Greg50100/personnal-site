import { useMemo, useState } from 'react'
import { CalendarDays, Clock, Globe2, Orbit, Sun } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useAstroClock } from '../../../hooks/useAstroClock'
import { LocationButton } from '../../../components/LocationPicker'
import { fmt, fmtDate, fmtHMS, fmtLon, fmtTime, parseNumber, utcOffsetLabel } from '../../../lib/format'
import { dayOfYear, isoWeek } from '../../pratique/dates/dates'
import { makeObserver, riseTransitSet } from '../lib/astro'
import { centuriesSinceJ2000, dateFromJulianDay, deltaT, gast, gmst, gpsTime, julianCalendarDate, julianDay, modifiedJulianDay, solarTime, taiMinusUtc } from '../lib/time'
import TimeControls from '../components/TimeControls'
import { InfoCard, Row } from '../components/InfoCard'

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const utcFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit' })
const utcDateFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone

/** Heure UTC décalée de `seconds` (pour TAI, TT, GPS). */
const shifted = (date, seconds) => utcFmt.format(new Date(date.getTime() + seconds * 1000))
const signed = (x, digits) => `${x >= 0 ? '+' : '−'}${fmt(Math.abs(x), digits)}`

function minutesSeconds(min) {
  const total = Math.round(Math.abs(min) * 60)
  return `${min < 0 ? '−' : '+'}${Math.floor(total / 60)} min ${String(total % 60).padStart(2, '0')} s`
}

function JulianDayForm({ onGo }) {
  const [text, setText] = useState('')
  const [kind, setKind] = useState('jd')
  const value = parseNumber(text)
  const jd = kind === 'jd' ? value : value + 2_400_000.5
  const valid = Number.isFinite(jd) && jd > 0 && jd < 5_373_484
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onGo(dateFromJulianDay(jd))
      }}
    >
      <label className="grid gap-1">
        <span className="label">Aller à</span>
        <select className="input w-auto" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="jd">Jour julien</option>
          <option value="mjd">Jour julien modifié</option>
        </select>
      </label>
      <input className="input w-44 font-mono" inputMode="decimal" placeholder={kind === 'jd' ? '2461337,5' : '61337'} value={text} onChange={(e) => setText(e.target.value)} aria-label="Valeur" />
      <button type="submit" className="btn-primary" disabled={!valid}>
        Afficher
      </button>
    </form>
  )
}

export default function AstroTime() {
  const { location } = useObserverLocation()
  const clock = useAstroClock({ intervalMs: 1000 })
  const date = clock.date

  const d = useMemo(() => {
    const jd = julianDay(date)
    const dt = deltaT(date)
    const tai = taiMinusUtc(date)
    const gm = gmst(date)
    const ga = gast(date)
    const solar = solarTime(date, location.lon)
    const jc = julianCalendarDate(jd)
    return { jd, dt, tai, gm, ga, solar, jc, gps: gpsTime(date), T: centuriesSinceJ2000(date) }
  }, [date, location.lon])

  // Le midi vrai ne change qu'une fois par jour : calculé à part.
  const dayKey = date.toDateString()
  const noon = useMemo(() => riseTransitSet('Sun', makeObserver(location), new Date(dayKey)).transit, [dayKey, location])

  // Jour civil local exprimé à minuit UTC, convention des fonctions de dates.js
  const civilDay = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const lst = (h) => (h + location.lon / 15 + 24) % 24

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad flex flex-wrap items-center justify-between gap-3">
        <TimeControls clock={clock} />
        <LocationButton />
      </div>

      <div className="grid gap-4 rounded-2xl bg-night-900 p-5 text-white sm:grid-cols-3 dark:bg-night-900/70">
        <div>
          <p className="label text-night-300">Heure locale</p>
          <p className="font-mono text-3xl font-semibold tabular-nums">{fmtTime(date, true)}</p>
          <p className="text-xs text-night-300">
            {zone} · {utcOffsetLabel(date)}
          </p>
        </div>
        <div>
          <p className="label text-night-300">Temps universel (UTC)</p>
          <p className="font-mono text-3xl font-semibold tabular-nums">{utcFmt.format(date)}</p>
          <p className="text-xs text-night-300">{utcDateFmt.format(date)}</p>
        </div>
        <div>
          <p className="label text-night-300">Temps sidéral local</p>
          <p className="font-mono text-3xl font-semibold tabular-nums text-accent-300">{fmtHMS(lst(d.ga))}</p>
          <p className="text-xs text-night-300">longitude {fmtLon(location.lon, 2)}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <InfoCard title="Calendrier" icon={CalendarDays}>
          <Row label="Date" value={fmtDate(date)} />
          <Row label="Jour de l'année" value={`${dayOfYear(civilDay)}e`} />
          <Row label="Semaine ISO" value={`S${String(isoWeek(civilDay)).padStart(2, '0')}`} />
          <Row label="Calendrier julien" value={`${d.jc.day} ${MONTHS[d.jc.month - 1]} ${d.jc.year}`} hint="Date dans le calendrier julien (avant la réforme grégorienne de 1582)" />
          <Row label="Horodatage Unix" value={Math.floor(date.getTime() / 1000).toLocaleString('fr-FR')} sub="s" />
        </InfoCard>

        <InfoCard title="Échelles de temps" icon={Clock}>
          <Row label="UTC" value={utcFmt.format(date)} />
          <Row label="TAI (temps atomique)" value={d.tai == null ? '—' : shifted(date, d.tai)} sub={d.tai == null ? null : `UTC + ${d.tai} s`} />
          <Row label="TT (temps terrestre)" value={shifted(date, d.dt)} sub={`ΔT = ${fmt(d.dt, d.tai == null ? 1 : 3)} s`} />
          <Row label="Temps GPS" value={d.tai == null ? '—' : shifted(date, d.tai - 19)} sub={d.tai == null ? null : `UTC + ${d.tai - 19} s`} />
          <Row label="Semaine GPS" value={d.gps.week >= 0 ? `${d.gps.week} · ${Math.floor(d.gps.seconds).toLocaleString('fr-FR')} s` : '—'} />
        </InfoCard>

        <InfoCard title="Jour julien" icon={Orbit}>
          <Row label="Jour julien (UT)" value={fmt(d.jd, 5)} />
          <Row label="Jour julien (TT)" value={fmt(d.jd + d.dt / 86_400, 5)} />
          <Row label="Jour julien modifié" value={fmt(modifiedJulianDay(date), 5)} />
          <Row label="Jours depuis J2000,0" value={fmt(d.jd - 2_451_545, 5)} />
          <Row label="Siècles juliens (TT)" value={fmt(d.T, 9)} />
          <Row label="Époque julienne" value={`J${fmt(2000 + d.T * 100, 4)}`} />
        </InfoCard>

        <InfoCard title="Temps sidéral" icon={Globe2}>
          <Row label="Moyen à Greenwich (GMST)" value={fmtHMS(d.gm, 2)} />
          <Row label="Apparent à Greenwich (GAST)" value={fmtHMS(d.ga, 2)} />
          <Row label="Équation des équinoxes" value={`${signed((d.ga - d.gm) * 3600, 3)} s`} hint="Effet de la nutation" />
          <Row label="Moyen local (LMST)" value={fmtHMS(lst(d.gm), 2)} />
          <Row label="Apparent local (LAST)" value={fmtHMS(lst(d.ga), 2)} />
          <Row label="Angle de rotation (GMST)" value={`${fmt(d.gm * 15, 4)}°`} />
        </InfoCard>

        <InfoCard title="Temps solaire" icon={Sun}>
          <Row label="Temps solaire moyen local" value={fmtHMS(d.solar.mean)} />
          <Row label="Temps solaire vrai" value={fmtHMS(d.solar.apparent)} hint="Heure du cadran solaire" />
          <Row label="Équation du temps" value={minutesSeconds(d.solar.equationOfTime)} hint="Temps solaire vrai − temps solaire moyen" />
          <Row label="Midi solaire vrai" value={fmtTime(noon, true)} sub="heure locale" />
        </InfoCard>

        <InfoCard title="Convertir" icon={Orbit}>
          <p className="mb-3 text-sm text-night-600 dark:text-night-400">
            Choisissez une date ci-dessus, ou saisissez un jour julien pour afficher la date correspondante.
          </p>
          <JulianDayForm onGo={clock.setDate} />
        </InfoCard>
      </div>

      <p className="text-xs text-night-500">
        TT − UTC est déduit des secondes intercalaires publiées par l'IERS (37 s depuis 2017) ; avant 1972, ΔT provient du modèle d'Espenak et Meeus. Le temps sidéral
        apparent inclut la nutation (modèle IAU 2000B d'astronomy-engine).
      </p>
    </div>
  )
}

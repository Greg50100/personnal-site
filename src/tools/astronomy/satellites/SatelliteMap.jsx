import { useMemo } from 'react'
import { TriangleAlert } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { useNow } from '../../../hooks/useNow'
import { LocationButton } from '../../../components/LocationPicker'
import Loader from '../../../components/Loader'
import Segmented from '../../../components/Segmented'
import { compass, fmt, fmtLat, fmtLon, fmtShortDate, fmtTime } from '../../../lib/format'
import { capPath, footprintRadius, splitTrack, xy } from '../lib/geo'
import WorldMap from '../components/WorldMap'
import { InfoCard, Row } from '../components/InfoCard'
import { SATELLITES, findPasses, lookAt, parseTle } from './passes'
import { useCelestrak } from './useCelestrak'

const RAD = 180 / Math.PI

/** Trace au sol entre `from` et `to` minutes autour de l'instant `t0`. */
function groundTrack(satrec, t0, from, to, loc) {
  const points = []
  for (let m = from; m <= to; m += 0.5) {
    const p = lookAt(satrec, new Date(t0 + m * 60_000), loc)
    if (p) points.push({ lat: p.lat, lon: ((p.lon + 540) % 360) - 180, past: m < 0 })
  }
  return points
}

const line = (seg) => seg.map((p) => xy(p.lat, p.lon).map((v) => v.toFixed(2)).join(',')).join(' ')

export default function SatelliteMap() {
  const { location } = useObserverLocation()
  const [satId, setSatId] = useLocalStorage('satellite-map-id', 25544)
  const now = useNow(1000)
  const id = SATELLITES.some((s) => s.id === satId) ? satId : SATELLITES[0].id
  const celestrak = useCelestrak(String(id), `CATNR=${id}`, { validate: (text) => Boolean(parseTle(text)) })
  const tle = useMemo(() => (celestrak.text ? parseTle(celestrak.text) : null), [celestrak.text])

  const minute = Math.floor(now.getTime() / 60_000)
  const track = useMemo(() => {
    if (!tle) return null
    const period = (2 * Math.PI) / tle.satrec.no // minutes
    const pts = groundTrack(tle.satrec, minute * 60_000, -Math.round(period / 2), Math.round(period * 1.5), location)
    return {
      period,
      past: splitTrack(pts.filter((p) => p.past)),
      future: splitTrack(pts.filter((p) => !p.past)),
    }
  }, [tle, minute, location])

  const hour = Math.floor(minute / 60)
  const passes = useMemo(
    () => (tle ? findPasses(tle.satrec, location, new Date(hour * 3_600_000), { days: 4, stdMag: SATELLITES.find((s) => s.id === id)?.stdMag }) : []),
    [tle, location, hour, id],
  )
  const nextPass = passes.find((p) => p.visible && p.los > now)

  const live = tle ? lookAt(tle.satrec, now, location) : null
  const lon = live ? ((live.lon + 540) % 360) - 180 : 0
  const [sx, sy] = live ? xy(live.lat, lon) : [0, 0]

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="card card-pad flex flex-wrap items-center justify-between gap-3">
        <Segmented value={id} onChange={setSatId} options={SATELLITES.map((s) => ({ value: s.id, label: s.name.replace(/ \(.*\)/, '') }))} ariaLabel="Satellite" />
        <LocationButton />
      </div>

      {celestrak.error && !tle && (
        <div className="card card-pad flex items-center gap-3 text-sm">
          <TriangleAlert size={18} className="text-red-500" /> Impossible de télécharger l'orbite ({celestrak.error}).
        </div>
      )}
      {!tle && !celestrak.error && <Loader label="Téléchargement de l'orbite…" />}

      {tle && live && (
        <>
          <section className="card overflow-hidden p-2 sm:p-3">
            <WorldMap date={now} observer={location} label={`Position de ${tle.name}`}>
              {track.past.map((seg, i) => (
                <polyline key={`p${i}`} points={line(seg)} fill="none" stroke="#cbd5e1" strokeOpacity="0.5" strokeWidth="0.5" strokeDasharray="1.5 1" />
              ))}
              {track.future.map((seg, i) => (
                <polyline key={`f${i}`} points={line(seg)} fill="none" stroke="#fbbf24" strokeWidth="0.7" />
              ))}
              <path d={capPath({ lat: live.lat, lon }, footprintRadius(live.height))} fill="#fbbf24" fillOpacity="0.12" stroke="#fbbf24" strokeOpacity="0.6" strokeWidth="0.3" />
              <circle cx={sx} cy={sy} r="3.2" fill={live.sunlit ? '#fde047' : '#94a3b8'} stroke="#0a0f21" strokeWidth="0.6" />
              <text x={sx + 4} y={sy - 3} className="fill-white text-[6px] font-semibold">
                {tle.name.replace(/ \(.*\)/, '')}
              </text>
            </WorldMap>
            <p className="px-2 pt-2 text-xs text-night-500">
              Trait plein : prochaine orbite et demie · pointillés : demi-orbite passée · zone ambrée : régions d'où le satellite est au-dessus de l'horizon · point
              rouge : votre lieu.
            </p>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InfoCard title="Position actuelle">
              <Row label="Latitude" value={fmtLat(live.lat, 2)} />
              <Row label="Longitude" value={fmtLon(lon, 2)} />
              <Row label="Altitude" value={`${fmt(live.height, 0)} km`} />
              <Row label="Vitesse" value={`${fmt(live.speed, 2)} km/s`} sub={`${Math.round(live.speed * 3600).toLocaleString('fr-FR')} km/h`} />
              <Row label="Éclairement" value={live.sunlit ? 'au soleil' : 'dans l’ombre de la Terre'} />
            </InfoCard>
            <InfoCard title="Vu depuis votre lieu">
              <Row label="Hauteur" value={`${fmt(live.el, 1)}°`} sub={live.el > 0 ? 'au-dessus de l’horizon' : 'sous l’horizon'} />
              <Row label="Azimut" value={`${fmt(live.az, 0)}°`} sub={compass(live.az)} />
              <Row label="Distance" value={`${Math.round(live.range).toLocaleString('fr-FR')} km`} />
              <Row
                label="Prochain passage visible"
                value={nextPass ? `${fmtShortDate(nextPass.start.t)} ${fmtTime(nextPass.start.t)}` : 'aucun sous 4 jours'}
                sub={nextPass ? `max. ${fmt(nextPass.peak.el, 0)}°` : null}
              />
            </InfoCard>
            <InfoCard title="Orbite">
              <Row label="Période" value={`${fmt(track.period, 1)} min`} sub={`${fmt(1440 / track.period, 2)} orbites/jour`} />
              <Row label="Inclinaison" value={`${fmt(tle.satrec.inclo * RAD, 2)}°`} />
              <Row label="Excentricité" value={fmt(tle.satrec.ecco, 5)} />
              <Row label="Époque du TLE" value={`${fmtShortDate(tle.epoch)} ${fmtTime(tle.epoch)}`} />
            </InfoCard>
          </div>
        </>
      )}
    </div>
  )
}

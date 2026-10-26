import { useMemo, useState } from 'react'
import { RefreshCw, Satellite, TriangleAlert } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { useNow } from '../../../hooks/useNow'
import { LocationButton } from '../../../components/LocationPicker'
import Loader from '../../../components/Loader'
import { compass, fmt, fmtLat, fmtLon, fmtShortDate, fmtTime } from '../../../lib/format'
import { SATELLITES, findPasses, lookAt, parseTle } from './passes'
import { useCelestrak } from './useCelestrak'
import PassTrack from '../components/PassTrack'

const point = (s) => (
  <>
    <span className="font-mono">{fmtTime(s.t, true)}</span>
    <span className="ml-2 font-mono text-night-500">
      {fmt(s.el, 0)}° {compass(s.az)}
    </span>
  </>
)

export default function SatellitePasses() {
  const { location } = useObserverLocation()
  const [satId, setSatId] = useLocalStorage('satellite-id', 25544)
  const [customTle, setCustomTle] = useLocalStorage('satellite-custom-tle', '')
  const [showAll, setShowAll] = useState(false)
  const [selected, setSelected] = useState(0)
  const now = useNow(1000)

  const info = SATELLITES.find((s) => s.id === satId)
  const isCustom = satId === 'custom'

  const celestrak = useCelestrak(String(satId), `CATNR=${satId}`, { enabled: !isCustom, validate: (text) => Boolean(parseTle(text)) })
  const tleText = isCustom ? customTle : celestrak.text
  const tle = useMemo(() => (tleText ? parseTle(tleText) : null), [tleText])
  const error = celestrak.error

  const startHour = Math.floor(now.getTime() / 3_600_000)
  const passes = useMemo(
    () => (tle ? findPasses(tle.satrec, location, new Date(startHour * 3_600_000), { days: 10, stdMag: info?.stdMag ?? null }) : []),
    [tle, location, startHour, info?.stdMag],
  )
  const shown = passes.filter((p) => showAll || p.visible).filter((p) => p.los > now)
  const current = shown[Math.min(selected, shown.length - 1)]
  const live = tle ? lookAt(tle.satrec, now, location) : null
  const ageDays = tle ? (now - tle.epoch) / 86_400_000 : 0
  const next = passes.find((p) => p.visible && p.aos > now)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <LocationButton showCoords />
        <select
          className="input w-auto"
          value={satId}
          onChange={(e) => {
            setSatId(e.target.value === 'custom' ? 'custom' : Number(e.target.value))
            setSelected(0)
          }}
          aria-label="Satellite"
        >
          {SATELLITES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
          <option value="custom">Autre satellite (TLE à coller)</option>
        </select>
        {!isCustom && (
          <button type="button" className="btn" onClick={celestrak.reload} title="Recharger l'orbite depuis CelesTrak">
            <RefreshCw size={15} /> Actualiser l'orbite
          </button>
        )}
      </div>

      {isCustom && (
        <div className="card card-pad">
          <label htmlFor="tle" className="label">
            Éléments orbitaux (TLE, 2 ou 3 lignes)
          </label>
          <textarea
            id="tle"
            rows={3}
            className="input font-mono text-xs"
            placeholder={'ISS (ZARYA)\n1 25544U 98067A   …\n2 25544  51.6…'}
            value={customTle}
            onChange={(e) => setCustomTle(e.target.value)}
            spellCheck={false}
          />
          <p className="mt-2 text-xs text-night-500">
            Copiez les TLE depuis{' '}
            <a className="underline hover:text-accent-500" href="https://celestrak.org/NORAD/elements/" target="_blank" rel="noreferrer">
              CelesTrak
            </a>
            . {customTle && !tle && <span className="text-red-500">Format non reconnu.</span>}
          </p>
        </div>
      )}

      {error && (
        <div className="card card-pad flex items-start gap-3 border-amber-500/40 text-sm">
          <TriangleAlert size={18} className="mt-0.5 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Impossible de récupérer l'orbite à jour ({error}).</p>
            <p className="text-night-500">
              {tle ? 'Les prévisions utilisent la dernière orbite en mémoire.' : 'Choisissez « Autre satellite » pour coller un TLE manuellement.'}
            </p>
          </div>
        </div>
      )}

      {!tle && !error && !isCustom && <Loader label="Téléchargement de l'orbite…" />}

      {tle && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="card card-pad md:col-span-2">
              <p className="label flex items-center gap-1.5">
                <Satellite size={12} /> {tle.name} — maintenant
              </p>
              {live ? (
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-night-500">Survole</dt>
                    <dd className="font-mono">
                      {fmtLat(live.lat, 2)} {fmtLon(live.lon, 2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-night-500">Altitude</dt>
                    <dd className="font-mono">{fmt(live.height, 0)} km</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-night-500">Vitesse</dt>
                    <dd className="font-mono">{fmt(live.speed * 3600, 0)} km/h</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-night-500">Vu d'ici</dt>
                    <dd className="font-mono">{live.el > 0 ? `${fmt(live.el, 1)}° ${compass(live.az)}` : 'sous l’horizon'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-night-500">Distance</dt>
                    <dd className="font-mono">{fmt(live.range, 0)} km</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-night-500">Éclairage</dt>
                    <dd>{live.sunlit ? 'au soleil' : "dans l'ombre"}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-red-500">Propagation impossible (orbite trop ancienne ou invalide).</p>
              )}
            </div>
            <div className="card card-pad">
              <p className="label">Prochain passage visible</p>
              {next ? (
                <>
                  <p className="text-lg font-semibold capitalize">
                    {fmtShortDate(next.start.t)} {fmtTime(next.start.t)}
                  </p>
                  <p className="text-sm text-night-500">
                    dans {fmt((next.start.t - now) / 3_600_000, 1)} h · jusqu'à {fmt(next.peak.el, 0)}°
                  </p>
                </>
              ) : (
                <p className="text-sm text-night-500">Aucun dans les 10 prochains jours.</p>
              )}
            </div>
            <div className="card card-pad">
              <p className="label">Orbite (TLE)</p>
              <p className="text-sm">
                Époque : <span className="font-mono">{fmtShortDate(tle.epoch)}</span>
              </p>
              <p className={`text-xs ${ageDays > 14 ? 'text-amber-500' : 'text-night-500'}`}>
                {ageDays > 14 ? `Ancienne de ${fmt(ageDays, 0)} jours : précision dégradée.` : `Âge : ${fmt(ageDays, 1)} jour(s).`}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-night-200 px-4 py-3 dark:border-night-800">
                <h2 className="font-semibold">Passages des 10 prochains jours</h2>
                <label className="flex items-center gap-2 text-xs text-night-600 dark:text-night-400">
                  <input type="checkbox" className="accent-accent-500" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                  Inclure les passages non visibles (jour, ombre)
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="table-data">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Mag.</th>
                      <th>Début</th>
                      <th>Point culminant</th>
                      <th>Fin</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((p, i) => (
                      <tr key={p.aos.getTime()} onClick={() => setSelected(i)} className={`cursor-pointer ${current === p ? 'bg-accent-500/5' : ''} ${p.visible ? '' : 'text-night-500'}`}>
                        <td className="capitalize">{fmtShortDate(p.start.t)}</td>
                        <td className="font-mono">{p.magnitude != null ? fmt(p.magnitude, 1) : '—'}</td>
                        <td>{point(p.start)}</td>
                        <td>{point(p.peak)}</td>
                        <td>{point(p.end)}</td>
                        <td>{p.visible ? <span className="chip border-emerald-500/40 text-emerald-600 dark:text-emerald-400">visible</span> : p.sunAltAtMax > -6 ? 'de jour' : "dans l'ombre"}</td>
                      </tr>
                    ))}
                    {!shown.length && (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-night-500">
                          Aucun passage visible. Cochez « Inclure les passages non visibles » pour tout afficher.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-night-200 px-4 py-2 text-xs text-night-500 dark:border-night-800">
                Visible = satellite éclairé par le Soleil, observateur dans la nuit (Soleil sous −6°) et hauteur ≥ 10°. Magnitude estimée
                (plus elle est négative, plus c'est brillant ; Vénus ≈ −4).
              </p>
            </div>

            <div className="card card-pad">
              <p className="label">Trajectoire du passage sélectionné</p>
              {current ? (
                <>
                  <PassTrack pass={current} />
                  <p className="mt-2 text-center text-xs text-night-500">
                    <span className="text-emerald-500">●</span> début · <span className="text-red-400">●</span> fin · trait jaune : partie visible
                  </p>
                </>
              ) : (
                <p className="text-sm text-night-500">Sélectionnez un passage dans la liste.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

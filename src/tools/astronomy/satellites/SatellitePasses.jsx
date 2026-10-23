import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Satellite, TriangleAlert } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { useNow } from '../../../hooks/useNow'
import { LocationButton } from '../../../components/LocationPicker'
import Loader from '../../../components/Loader'
import { compass, fmt, fmtLat, fmtLon, fmtShortDate, fmtTime } from '../../../lib/format'
import { SATELLITES, findPasses, lookAt, parseTle } from './passes'

const CACHE_HOURS = 6
const tleUrl = (id) => `https://celestrak.org/NORAD/elements/gp.php?CATNR=${id}&FORMAT=TLE`

function readCache(id) {
  try {
    return JSON.parse(localStorage.getItem(`tle-${id}`))
  } catch {
    return null
  }
}

function writeCache(id, text) {
  try {
    localStorage.setItem(`tle-${id}`, JSON.stringify({ text, at: Date.now() }))
  } catch {
    // ignoré
  }
}

/** Tracé du passage dans le ciel (zénith au centre, nord en haut, est à gauche). */
function PassTrack({ pass }) {
  const S = 240
  const R = S / 2 - 18
  const p = (el, az) => {
    const r = ((90 - Math.max(0, el)) / 90) * R
    return [S / 2 - r * Math.sin((az * Math.PI) / 180), S / 2 - r * Math.cos((az * Math.PI) / 180)]
  }
  const segs = []
  pass.samples.forEach((s, i) => {
    if (i === 0) return
    const a = pass.samples[i - 1]
    segs.push({ from: p(a.el, a.az), to: p(s.el, s.az), visible: s.visible && a.visible })
  })
  const [sx, sy] = p(pass.start.el, pass.start.az)
  const [ex, ey] = p(pass.end.el, pass.end.az)
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto h-auto w-full max-w-[280px]" role="img" aria-label="Trajectoire du passage">
      <circle cx={S / 2} cy={S / 2} r={R} fill="#0a0f24" stroke="#f97316" strokeWidth="1.5" />
      {[30, 60].map((el) => (
        <circle key={el} cx={S / 2} cy={S / 2} r={((90 - el) / 90) * R} fill="none" stroke="#94a3b833" />
      ))}
      {[
        ['N', 0],
        ['E', 90],
        ['S', 180],
        ['O', 270],
      ].map(([l, az]) => {
        const [x, y] = p(-8, az)
        const k = (R + 10) / R
        return (
          <text key={l} x={S / 2 + (x - S / 2) * k} y={S / 2 + (y - S / 2) * k + 4} textAnchor="middle" className="fill-orange-500 font-mono text-[11px] font-bold">
            {l}
          </text>
        )
      })}
      {segs.map((s, i) => (
        <line key={i} x1={s.from[0]} y1={s.from[1]} x2={s.to[0]} y2={s.to[1]} stroke={s.visible ? '#fde68a' : '#64748b'} strokeWidth={s.visible ? 3 : 1.5} strokeLinecap="round" />
      ))}
      <circle cx={sx} cy={sy} r="4" fill="#34d399" />
      <circle cx={ex} cy={ey} r="4" fill="#f87171" />
    </svg>
  )
}

const point = (s) => (
  <>
    <span className="font-mono">{fmtTime(s.t, true)}</span>
    <span className="ml-2 font-mono text-zinc-500">
      {fmt(s.el, 0)}° {compass(s.az)}
    </span>
  </>
)

export default function SatellitePasses() {
  const { location } = useObserverLocation()
  const [satId, setSatId] = useLocalStorage('satellite-id', 25544)
  const [customTle, setCustomTle] = useLocalStorage('satellite-custom-tle', '')
  const [showAll, setShowAll] = useState(false)
  const [fetched, setFetched] = useState({})
  const [errors, setErrors] = useState({})
  const [reload, setReload] = useState(0)
  const [selected, setSelected] = useState(0)
  const now = useNow(1000)

  const info = SATELLITES.find((s) => s.id === satId)
  const isCustom = satId === 'custom'

  useEffect(() => {
    if (isCustom) return undefined
    const cached = readCache(satId)
    if (!reload && cached && Date.now() - cached.at < CACHE_HOURS * 3_600_000) return undefined
    let cancelled = false
    fetch(tleUrl(satId))
      .then((r) => {
        if (!r.ok) throw new Error(`CelesTrak a répondu ${r.status}`)
        return r.text()
      })
      .then((text) => {
        if (!parseTle(text)) throw new Error('Réponse de CelesTrak illisible')
        writeCache(satId, text)
        if (!cancelled) {
          setFetched((f) => ({ ...f, [satId]: { text, at: Date.now() } }))
          setErrors((e) => ({ ...e, [satId]: null }))
        }
      })
      .catch((err) => !cancelled && setErrors((e) => ({ ...e, [satId]: err.message || 'Réseau indisponible' })))
    return () => {
      cancelled = true
    }
  }, [satId, isCustom, reload])

  const tleText = isCustom ? customTle : (fetched[satId] ?? readCache(satId))?.text
  const tle = useMemo(() => (tleText ? parseTle(tleText) : null), [tleText])
  const error = isCustom ? null : errors[satId]

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
          <button type="button" className="btn" onClick={() => setReload((r) => r + 1)} title="Recharger l'orbite depuis CelesTrak">
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
          <p className="mt-2 text-xs text-zinc-500">
            Copiez les TLE depuis{' '}
            <a className="underline hover:text-orange-500" href="https://celestrak.org/NORAD/elements/" target="_blank" rel="noreferrer">
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
            <p className="text-zinc-500">
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
                    <dt className="text-xs text-zinc-500">Survole</dt>
                    <dd className="font-mono">
                      {fmtLat(live.lat, 2)} {fmtLon(live.lon, 2)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Altitude</dt>
                    <dd className="font-mono">{fmt(live.height, 0)} km</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Vitesse</dt>
                    <dd className="font-mono">{fmt(live.speed * 3600, 0)} km/h</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Vu d'ici</dt>
                    <dd className="font-mono">{live.el > 0 ? `${fmt(live.el, 1)}° ${compass(live.az)}` : 'sous l’horizon'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Distance</dt>
                    <dd className="font-mono">{fmt(live.range, 0)} km</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-zinc-500">Éclairage</dt>
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
                  <p className="text-sm text-zinc-500">
                    dans {fmt((next.start.t - now) / 3_600_000, 1)} h · jusqu'à {fmt(next.peak.el, 0)}°
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-500">Aucun dans les 10 prochains jours.</p>
              )}
            </div>
            <div className="card card-pad">
              <p className="label">Orbite (TLE)</p>
              <p className="text-sm">
                Époque : <span className="font-mono">{fmtShortDate(tle.epoch)}</span>
              </p>
              <p className={`text-xs ${ageDays > 14 ? 'text-amber-500' : 'text-zinc-500'}`}>
                {ageDays > 14 ? `Ancienne de ${fmt(ageDays, 0)} jours : précision dégradée.` : `Âge : ${fmt(ageDays, 1)} jour(s).`}
              </p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                <h2 className="font-semibold">Passages des 10 prochains jours</h2>
                <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <input type="checkbox" className="accent-orange-500" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
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
                      <tr key={p.aos.getTime()} onClick={() => setSelected(i)} className={`cursor-pointer ${current === p ? 'bg-orange-500/5' : ''} ${p.visible ? '' : 'text-zinc-500'}`}>
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
                        <td colSpan={6} className="py-6 text-center text-zinc-500">
                          Aucun passage visible. Cochez « Inclure les passages non visibles » pour tout afficher.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-zinc-200 px-4 py-2 text-xs text-zinc-500 dark:border-zinc-800">
                Visible = satellite éclairé par le Soleil, observateur dans la nuit (Soleil sous −6°) et hauteur ≥ 10°. Magnitude estimée
                (plus elle est négative, plus c'est brillant ; Vénus ≈ −4).
              </p>
            </div>

            <div className="card card-pad">
              <p className="label">Trajectoire du passage sélectionné</p>
              {current ? (
                <>
                  <PassTrack pass={current} />
                  <p className="mt-2 text-center text-xs text-zinc-500">
                    <span className="text-emerald-500">●</span> début · <span className="text-red-400">●</span> fin · trait jaune : partie visible
                  </p>
                </>
              ) : (
                <p className="text-sm text-zinc-500">Sélectionnez un passage dans la liste.</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { useObserverLocation } from '../../../context/location'
import { useAstroClock } from '../../../hooks/useAstroClock'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { LocationButton } from '../../../components/LocationPicker'
import Segmented from '../../../components/Segmented'
import { compass, fmt, fmtDMS, fmtHMS, fmtTime } from '../../../lib/format'
import { makeObserver } from '../lib/astro'
import TimeControls from '../components/TimeControls'
import { computeScene, describe, drawScene } from './skyScene'

const TOGGLES = [
  ['lines', 'Tracés'],
  ['constellationNames', 'Constellations'],
  ['starNames', 'Noms'],
  ['planets', 'Planètes'],
  ['messier', 'Messier'],
  ['grid', 'Grille'],
  ['ecliptic', 'Écliptique'],
]

const DEFAULT_OPTIONS = {
  lines: true,
  constellationNames: true,
  starNames: true,
  planets: true,
  messier: false,
  grid: false,
  ecliptic: true,
  magLimit: 5,
  rotation: 0,
  night: false,
}

export default function SkyMap() {
  const { location } = useObserverLocation()
  const clock = useAstroClock({ intervalMs: 30_000 })
  const [stored, setOptions] = useLocalStorage('sky-map-options', DEFAULT_OPTIONS)
  const options = { ...DEFAULT_OPTIONS, ...stored }
  const [selectedId, setSelectedId] = useState(null)
  const [size, setSize] = useState(0)
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const targetsRef = useRef([])

  const scene = useMemo(() => computeScene(clock.date, makeObserver(location)), [clock.date, location])

  // Retrouve l'objet sélectionné dans la scène courante (sa position change avec le temps).
  const selected = useMemo(() => {
    if (!selectedId) return null
    const [kind, key] = selectedId.split(':')
    const obj =
      kind === 'body' ? scene.bodies.find((b) => b.id === key) : kind === 'messier' ? scene.messier.find((m) => m.id === key) : scene.stars[Number(key)]
    return obj ? describe({ kind, obj }) : null
  }, [selectedId, scene])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => setSize(Math.floor(Math.min(entry.contentRect.width, 900))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !size) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    const ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    targetsRef.current = drawScene(ctx, size, scene, { ...options, selected: selected?.ref })
  })

  const pick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    let best = null
    let bestScore = Infinity
    for (const t of targetsRef.current) {
      const d = Math.hypot(t.x - x, t.y - y)
      if (d > Math.max(t.r, 14)) continue
      const score = d - (t.priority ?? 0) * 6 + (t.kind === 'star' ? t.obj.mag : 0)
      if (score < bestScore) {
        bestScore = score
        best = t
      }
    }
    if (!best) return setSelectedId(null)
    const key = best.kind === 'body' ? best.obj.id : best.kind === 'messier' ? best.obj.id : best.obj.i
    setSelectedId(`${best.kind}:${key}`)
  }

  const visibleBodies = scene.bodies.filter((b) => b.alt > 0)

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <LocationButton showCoords />
        <TimeControls clock={clock} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="card p-2 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {TOGGLES.map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={options[key]}
                onClick={() => setOptions({ ...options, [key]: !options[key] })}
                className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                  options[key]
                    ? 'border-accent-500/60 bg-accent-500/10 text-accent-700 dark:text-accent-400'
                    : 'border-night-200 text-night-500 hover:border-accent-500/40 dark:border-night-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            ref={wrapRef}
            className="mx-auto w-full max-w-[900px] overflow-hidden rounded-lg bg-night-950"
            style={options.night ? { filter: 'sepia(1) saturate(6) hue-rotate(-50deg) brightness(0.75)' } : undefined}
          >
            <canvas
              ref={canvasRef}
              onClick={pick}
              style={{ width: size, height: size }}
              className="block cursor-crosshair"
              role="img"
              aria-label={`Carte du ciel pour ${location.name} le ${clock.date.toLocaleString('fr-FR')}`}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-xs text-night-600 dark:text-night-400">
              Magnitude limite
              <input
                type="range"
                min="2"
                max="6"
                step="0.5"
                value={options.magLimit}
                onChange={(e) => setOptions({ ...options, magLimit: Number(e.target.value) })}
                className="accent-accent-500"
              />
              <span className="w-6 font-mono">{fmt(options.magLimit, 1)}</span>
            </label>
            <Segmented
              size="sm"
              ariaLabel="Orientation"
              value={options.rotation}
              onChange={(rotation) => setOptions({ ...options, rotation })}
              options={[
                { value: 0, label: 'Nord en haut' },
                { value: 180, label: 'Sud en haut' },
              ]}
            />
            <label className="flex items-center gap-2 text-xs text-night-600 dark:text-night-400">
              <input type="checkbox" checked={options.night} onChange={(e) => setOptions({ ...options, night: e.target.checked })} className="accent-accent-500" />
              Vision nocturne (rouge)
            </label>
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <div className="card card-pad">
            <p className="label">Objet sélectionné</p>
            {selected ? (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold">{selected.title}</p>
                    <p className="text-sm text-night-500">{selected.subtitle}</p>
                  </div>
                  <button type="button" className="text-night-400 hover:text-accent-500" onClick={() => setSelectedId(null)} aria-label="Désélectionner">
                    <X size={16} />
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                  {selected.mag != null && (
                    <>
                      <dt className="text-night-500">Magnitude</dt>
                      <dd className="font-mono">{fmt(selected.mag, 2)}</dd>
                    </>
                  )}
                  <dt className="text-night-500">Hauteur</dt>
                  <dd className="font-mono">{fmt(selected.alt, 1)}°</dd>
                  <dt className="text-night-500">Azimut</dt>
                  <dd className="font-mono">
                    {fmt(selected.az, 1)}° {compass(selected.az)}
                  </dd>
                  <dt className="text-night-500">Asc. droite</dt>
                  <dd className="font-mono">{fmtHMS(selected.raHours)}</dd>
                  <dt className="text-night-500">Déclinaison</dt>
                  <dd className="font-mono">{fmtDMS(selected.dec)}</dd>
                  {selected.constellation && (
                    <>
                      <dt className="text-night-500">Constellation</dt>
                      <dd>{selected.constellation}</dd>
                    </>
                  )}
                  {selected.distance != null && (
                    <>
                      <dt className="text-night-500">Distance</dt>
                      <dd className="font-mono">{selected.distance < 0.01 ? `${fmt(selected.distance * 149_597_870.7, 0)} km` : `${fmt(selected.distance, 3)} ua`}</dd>
                    </>
                  )}
                </dl>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-night-500">
                <Maximize2 size={14} /> Touchez une étoile, une planète ou un objet pour l'identifier.
              </p>
            )}
          </div>

          <div className="card card-pad">
            <p className="label">Au-dessus de l'horizon à {fmtTime(clock.date)}</p>
            {visibleBodies.length ? (
              <ul className="space-y-1.5 text-sm">
                {visibleBodies.map((b) => (
                  <li key={b.id}>
                    <button type="button" onClick={() => setSelectedId(`body:${b.id}`)} className="flex w-full items-center justify-between gap-2 hover:text-accent-500">
                      <span>
                        <span className="sym" style={{ color: b.color }}>{b.symbol}</span> {b.name}
                      </span>
                      <span className="font-mono text-xs text-night-500">
                        {fmt(b.alt, 0)}° {compass(b.az)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-night-500">Ni le Soleil, ni la Lune, ni aucune planète.</p>
            )}
          </div>

          <div className="card card-pad text-xs leading-relaxed text-night-500">
            Projection stéréographique centrée sur le zénith : le bord du cercle est l'horizon, l'est est à gauche quand le nord est en haut
            (comme en regardant le ciel au-dessus de soi). {scene.stars.length.toLocaleString('fr-FR')} étoiles jusqu'à la magnitude 6,
            tracés et noms des 88 constellations, 110 objets Messier. Pointillés orange : écliptique ; bleus : équateur céleste.
          </div>
        </aside>
      </div>
    </div>
  )
}

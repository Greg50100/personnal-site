import { useMemo } from 'react'
import { LAND_PATH } from '../data/world-land'
import { nightPaths } from '../lib/geo'

const GRID_LON = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150]
const GRID_LAT = [-60, -30, 0, 30, 60]

/**
 * Planisphère équirectangulaire avec zones de jour, crépuscules et nuit à l'instant `date`.
 * Les éléments enfants sont dessinés par-dessus, dans le même repère (utiliser `xy`).
 */
export default function WorldMap({ date, observer, showNight = true, showSun = true, children, label = 'Carte du monde' }) {
  const night = useMemo(() => (showNight ? nightPaths(date) : null), [date, showNight])
  return (
    <svg viewBox="0 0 360 180" className="block h-auto w-full rounded-xl" role="img" aria-label={label}>
      <rect width="360" height="180" fill="#123056" />
      <path d={LAND_PATH} fill="#3f6b4a" stroke="#2c4f36" strokeWidth="0.15" />
      <g stroke="#ffffff" strokeOpacity="0.12" strokeWidth="0.2">
        {GRID_LON.map((lon) => (
          <line key={lon} x1={lon + 180} x2={lon + 180} y1="0" y2="180" />
        ))}
        {GRID_LAT.map((lat) => (
          <line key={lat} x1="0" x2="360" y1={90 - lat} y2={90 - lat} strokeOpacity={lat === 0 ? 0.25 : 0.12} />
        ))}
      </g>
      {night?.layers.map((l) => (
        <path key={l.h} d={l.d} fill="#020617" fillOpacity="0.22" />
      ))}
      {night && showSun && (
        <g>
          <circle cx={night.sun.lon + 180} cy={90 - night.sun.lat} r="3.2" fill="#fbbf24" fillOpacity="0.25" />
          <circle cx={night.sun.lon + 180} cy={90 - night.sun.lat} r="1.8" fill="#fbbf24" stroke="#fff7d6" strokeWidth="0.3" />
        </g>
      )}
      {observer && (
        <g>
          <circle cx={observer.lon + 180} cy={90 - observer.lat} r="1.6" fill="#f43f5e" stroke="#fff" strokeWidth="0.4" />
        </g>
      )}
      {children}
    </svg>
  )
}

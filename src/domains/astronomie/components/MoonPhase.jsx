/**
 * Dessin vectoriel de la Lune pour un angle de phase donné (0 = nouvelle, 180 = pleine).
 * Dans l'hémisphère sud (`south`), l'image est inversée gauche-droite.
 */
export default function MoonPhase({ phase, size = 48, south = false, className = '', title }) {
  const r = 50
  const p = (((phase % 360) + 360) % 360) * (Math.PI / 180)
  const rx = Math.abs(Math.cos(p)) * r
  const waxing = phase % 360 < 180
  // Bord éclairé : demi-cercle droit (croissante) ou gauche (décroissante) ; puis terminateur elliptique.
  const limbSweep = waxing ? 1 : 0
  const gibbous = Math.cos(p) < 0
  const termSweep = waxing ? (gibbous ? 1 : 0) : gibbous ? 0 : 1
  const d = `M 50 0 A ${r} ${r} 0 0 ${limbSweep} 50 100 A ${rx} ${r} 0 0 ${termSweep} 50 0 Z`
  return (
    <svg
      viewBox="-2 -2 104 104"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
      style={south ? { transform: 'scaleX(-1)' } : undefined}
    >
      {title && <title>{title}</title>}
      <circle cx="50" cy="50" r="50" fill="#27272a" stroke="#52525b" strokeWidth="1.5" />
      <path d={d} fill="#f4f4f5" />
    </svg>
  )
}

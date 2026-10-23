import { useRef, useState } from 'react'
import { fmt, fmtTime } from '../../../lib/format'

const W = 960
const H = 320
const PAD = { l: 40, r: 12, t: 12, b: 28 }
const ALT_MIN = -30
const ALT_MAX = 90

/** Couleur de fond selon la hauteur du Soleil (jour, crépuscules, nuit). */
const skyColor = (sunAlt) =>
  sunAlt > 0 ? '#38bdf826' : sunAlt > -6 ? '#6366f12e' : sunAlt > -12 ? '#4338ca33' : sunAlt > -18 ? '#1e1b4b4d' : '#02061766'

/**
 * Courbes de hauteur de plusieurs astres sur une période (graphique SVG responsive).
 * series : [{ id, name, color, points: [{ t: Date, alt }] }] ; la série 'Sun' colore le fond.
 */
export default function AltitudeChart({ series, start, end, now }) {
  const svgRef = useRef(null)
  const [hover, setHover] = useState(null)
  const span = end - start
  const x = (t) => PAD.l + ((t - start) / span) * (W - PAD.l - PAD.r)
  const y = (alt) => PAD.t + ((ALT_MAX - Math.max(ALT_MIN, Math.min(ALT_MAX, alt))) / (ALT_MAX - ALT_MIN)) * (H - PAD.t - PAD.b)

  const sun = series.find((s) => s.id === 'Sun')
  const background = sun ? sun.points.slice(0, -1).map((p, i) => ({ x1: x(p.t), x2: x(sun.points[i + 1].t), color: skyColor(p.alt) })) : []

  const hours = []
  const first = new Date(start)
  first.setMinutes(0, 0, 0)
  for (let t = first.getTime() + 3_600_000; t < end.getTime(); t += 3_600_000) hours.push(new Date(t))

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    if (px < PAD.l || px > W - PAD.r) return setHover(null)
    const t = start.getTime() + ((px - PAD.l) / (W - PAD.l - PAD.r)) * span
    setHover(new Date(t))
  }

  const valueAt = (points, t) => {
    const i = Math.min(points.length - 1, Math.max(0, Math.round(((t - start) / span) * (points.length - 1))))
    return points[i]?.alt
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label="Hauteur des astres au-dessus de l'horizon"
      >
        {background.map((b, i) => (
          <rect key={i} x={b.x1} width={b.x2 - b.x1 + 0.5} y={PAD.t} height={H - PAD.t - PAD.b} fill={b.color} />
        ))}
        {[0, 30, 60, 90, -30].map((a) => (
          <g key={a}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(a)} y2={y(a)} className={a === 0 ? 'stroke-zinc-500' : 'stroke-zinc-400/30'} strokeWidth={a === 0 ? 1.5 : 1} />
            <text x={PAD.l - 6} y={y(a) + 4} textAnchor="end" className="fill-zinc-500 font-mono text-[11px]">
              {a}°
            </text>
          </g>
        ))}
        {hours.map((h) => (
          <g key={h.getTime()}>
            <line x1={x(h)} x2={x(h)} y1={PAD.t} y2={H - PAD.b} className="stroke-zinc-400/20" />
            {h.getHours() % 2 === 0 && (
              <text x={x(h)} y={H - 8} textAnchor="middle" className="fill-zinc-500 font-mono text-[11px]">
                {String(h.getHours()).padStart(2, '0')}h
              </text>
            )}
          </g>
        ))}
        {series.map((s) => (
          <polyline
            key={s.id}
            fill="none"
            stroke={s.color}
            strokeWidth={s.id === 'Sun' || s.id === 'Moon' ? 2.5 : 1.8}
            strokeDasharray={s.id === 'Sun' ? '6 4' : undefined}
            points={s.points.map((p) => `${x(p.t).toFixed(1)},${y(p.alt).toFixed(1)}`).join(' ')}
          />
        ))}
        {now && now >= start && now <= end && <line x1={x(now)} x2={x(now)} y1={PAD.t} y2={H - PAD.b} stroke="#f97316" strokeWidth="1.5" />}
        {hover && <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={H - PAD.b} className="stroke-zinc-900 dark:stroke-white" strokeWidth="1" strokeDasharray="3 3" />}
      </svg>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((s) => {
          const v = hover ? valueAt(s.points, hover) : null
          return (
            <span key={s.id} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4" style={{ backgroundColor: s.color }} />
              {s.name}
              {v != null && <span className={`font-mono ${v > 0 ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500'}`}>{fmt(v, 0)}°</span>}
            </span>
          )
        })}
        {hover && <span className="ml-auto font-mono text-zinc-500">{fmtTime(hover)}</span>}
      </div>
    </div>
  )
}

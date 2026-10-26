import { useRef, useState } from 'react'
import { smartNumber } from '../lib/format'

const W = 640
const H = 300
const PAD = { l: 56, r: 16, t: 14, b: 40 }

/** Graduations « rondes » entre min et max. */
function ticks(min, max, count = 6) {
  const span = max - min || 1
  const step0 = span / count
  const mag = 10 ** Math.floor(Math.log10(step0))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? mag * 10
  const out = []
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v)
  return out
}

/**
 * Graphique de courbes simple et responsive.
 * chart : { title, x: { label, log?, ticks?, format? }, y: { label, min?, max?, ticks?, format? }, series: [{ name, color, points: [[x, y], …], dashed? }], markers?: [{ x, y, label }] }
 * `ticks` impose les graduations, `format` met en forme les valeurs (graduations et survol).
 */
export default function LineChart({ chart }) {
  const svgRef = useRef(null)
  const [hover, setHover] = useState(null)
  const all = chart.series.flatMap((s) => s.points).filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
  if (!all.length) return null
  const logX = chart.x?.log
  const tx = (x) => (logX ? Math.log10(x) : x)
  let xMin = Math.min(...all.map((p) => tx(p[0])))
  let xMax = Math.max(...all.map((p) => tx(p[0])))
  let yMin = chart.y?.min ?? Math.min(...all.map((p) => p[1]))
  let yMax = chart.y?.max ?? Math.max(...all.map((p) => p[1]))
  if (xMax === xMin) xMax = xMin + 1
  if (yMax === yMin) {
    yMax += 1
    yMin -= 1
  }
  const yPad = chart.y?.min != null || chart.y?.max != null ? 0 : (yMax - yMin) * 0.06
  yMin -= yPad
  yMax += yPad
  const sx = (x) => PAD.l + ((tx(x) - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r)
  const sy = (y) => PAD.t + ((yMax - y) / (yMax - yMin)) * (H - PAD.t - PAD.b)
  const xTicks =
    chart.x?.ticks ??
    (logX ? Array.from({ length: Math.floor(xMax) - Math.ceil(xMin) + 1 }, (_, i) => 10 ** (Math.ceil(xMin) + i)) : ticks(xMin, xMax))
  const yTicks = chart.y?.ticks ?? ticks(yMin, yMax, 5)
  const fx = chart.x?.format ?? ((v) => smartNumber(v, 4))
  const fy = chart.y?.format ?? ((v) => smartNumber(v, 4))

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    if (px < PAD.l || px > W - PAD.r) return setHover(null)
    const v = xMin + ((px - PAD.l) / (W - PAD.l - PAD.r)) * (xMax - xMin)
    setHover(logX ? 10 ** v : v)
  }
  const nearest = (points, x) => points.reduce((best, p) => (Math.abs(tx(p[0]) - tx(x)) < Math.abs(tx(best[0]) - tx(x)) ? p : best), points[0])

  return (
    <figure className="mt-2">
      {chart.title && <figcaption className="label">{chart.title}</figcaption>}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full touch-none select-none rounded-xl bg-night-50 dark:bg-night-950"
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={chart.title ?? 'Graphique'}
      >
        {yTicks.map((v) => (
          <g key={`y${v}`}>
            <line x1={PAD.l} x2={W - PAD.r} y1={sy(v)} y2={sy(v)} className={v === 0 ? 'stroke-night-400' : 'stroke-night-300/40 dark:stroke-night-700/60'} />
            <text x={PAD.l - 6} y={sy(v) + 4} textAnchor="end" className="fill-night-500 font-mono text-[11px]">
              {fy(v)}
            </text>
          </g>
        ))}
        {xTicks.map((v) => (
          <g key={`x${v}`}>
            <line y1={PAD.t} y2={H - PAD.b} x1={sx(v)} x2={sx(v)} className="stroke-night-300/40 dark:stroke-night-700/60" />
            <text x={sx(v)} y={H - PAD.b + 16} textAnchor="middle" className="fill-night-500 font-mono text-[11px]">
              {fx(v)}
            </text>
          </g>
        ))}
        {chart.x?.label && (
          <text x={(PAD.l + W - PAD.r) / 2} y={H - 4} textAnchor="middle" className="fill-night-500 text-[11px]">
            {chart.x.label}
          </text>
        )}
        {chart.y?.label && (
          <text x={12} y={(PAD.t + H - PAD.b) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(PAD.t + H - PAD.b) / 2})`} className="fill-night-500 text-[11px]">
            {chart.y.label}
          </text>
        )}
        {chart.series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            stroke={s.color ?? '#f59e0b'}
            strokeWidth="2.5"
            strokeDasharray={s.dashed ? '6 4' : undefined}
            strokeLinejoin="round"
            points={s.points
              .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))
              .map(([x, y]) => `${sx(x).toFixed(1)},${sy(Math.max(yMin, Math.min(yMax, y))).toFixed(1)}`)
              .join(' ')}
          />
        ))}
        {chart.markers?.map((m) => (
          <g key={`${m.label}-${m.x}`}>
            <circle cx={sx(m.x)} cy={sy(m.y)} r="4.5" fill={m.color ?? '#f59e0b'} />
            <text x={sx(m.x) + 7} y={sy(m.y) - 7} className="fill-night-600 text-[11px] dark:fill-night-300">
              {m.label}
            </text>
          </g>
        ))}
        {hover != null && <line x1={sx(hover)} x2={sx(hover)} y1={PAD.t} y2={H - PAD.b} className="stroke-night-500" strokeDasharray="3 3" />}
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-night-600 dark:text-night-400">
        {chart.series.map((s) => {
          const p = hover != null ? nearest(s.points, hover) : null
          return (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-4" style={{ backgroundColor: s.color ?? '#f59e0b' }} />
              {s.name}
              {p && <span className="font-mono text-night-900 dark:text-night-100">{fy(p[1])}</span>}
            </span>
          )
        })}
        {hover != null && (
          <span className="ml-auto font-mono">
            {chart.x?.label ? `${chart.x.label} = ` : 'x = '}
            {fx(hover)}
          </span>
        )}
      </div>
    </figure>
  )
}

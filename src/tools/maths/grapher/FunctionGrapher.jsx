import { useMemo, useRef, useState } from 'react'
import { Maximize, Minus, Plus, Trash2 } from 'lucide-react'
import { smartNumber } from '../../../lib/format'
import { compile } from '../../utilities/calculator/expression'

const W = 800
const H = 500
const COLORS = ['#f59e0b', '#38bdf8', '#a78bfa', '#34d399', '#f472b6', '#f87171']
const DEFAULT_VIEW = { cx: 0, cy: 0, scale: 50 } // pixels par unité

/** Pas de graduation lisible pour une échelle donnée. */
function gridStep(scale) {
  const raw = 80 / scale
  const mag = 10 ** Math.floor(Math.log10(raw))
  return [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw)
}

function compileSafe(text) {
  try {
    return { fn: compile(text, ['x']) }
  } catch (err) {
    return { error: err.message }
  }
}

export default function FunctionGrapher() {
  const [funcs, setFuncs] = useState(['sin(x)', 'x^2/4 - 1', 'exp(-x) * cos(3x)'])
  const [view, setView] = useState(DEFAULT_VIEW)
  const [hoverX, setHoverX] = useState(null)
  const svgRef = useRef(null)
  const drag = useRef(null)

  const compiled = useMemo(() => funcs.map((f) => (f.trim() ? compileSafe(f) : { empty: true })), [funcs])

  const toScreen = (x, y) => [W / 2 + (x - view.cx) * view.scale, H / 2 - (y - view.cy) * view.scale]
  const xMin = view.cx - W / 2 / view.scale
  const xMax = view.cx + W / 2 / view.scale
  const yMin = view.cy - H / 2 / view.scale
  const yMax = view.cy + H / 2 / view.scale
  const step = gridStep(view.scale)

  const evalAt = (fn, x) => {
    try {
      const y = fn({ x, angle: 'rad', allowInfinity: true })
      return Number.isFinite(y) ? y : NaN
    } catch {
      return NaN
    }
  }

  const paths = compiled.map((c) => {
    if (!c.fn) return ''
    let d = ''
    let prev = null
    for (let px = 0; px <= W; px += 1) {
      const x = xMin + px / view.scale
      const y = evalAt(c.fn, x)
      // Discontinuité : on lève le crayon (asymptote de tan, 1/x…)
      if (!Number.isFinite(y) || (prev !== null && Math.abs(y - prev) * view.scale > H * 2)) {
        prev = Number.isFinite(y) ? y : null
        if (!Number.isFinite(y)) continue
        d += `M${px},${(H / 2 - (y - view.cy) * view.scale).toFixed(1)}`
        continue
      }
      const sy = Math.max(-H, Math.min(2 * H, H / 2 - (y - view.cy) * view.scale))
      d += `${prev === null ? 'M' : 'L'}${px},${sy.toFixed(1)}`
      prev = y
    }
    return d
  })

  const pointer = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    return [((e.clientX - rect.left) / rect.width) * W, ((e.clientY - rect.top) / rect.height) * H]
  }

  const onPointerDown = (e) => {
    svgRef.current.setPointerCapture(e.pointerId)
    drag.current = { p: pointer(e), view }
  }
  const onPointerMove = (e) => {
    const [px, py] = pointer(e)
    setHoverX(xMin + px / view.scale)
    if (drag.current) {
      const [x0, y0] = drag.current.p
      const v0 = drag.current.view
      setView({ ...v0, cx: v0.cx - (px - x0) / v0.scale, cy: v0.cy + (py - y0) / v0.scale })
    }
  }
  const zoom = (factor, anchor = [W / 2, H / 2]) => {
    setView((v) => {
      const ax = v.cx + (anchor[0] - W / 2) / v.scale
      const ay = v.cy - (anchor[1] - H / 2) / v.scale
      const scale = Math.min(5000, Math.max(0.5, v.scale * factor))
      return { scale, cx: ax - (anchor[0] - W / 2) / scale, cy: ay + (anchor[1] - H / 2) / scale }
    })
  }
  const onWheel = (e) => zoom(e.deltaY < 0 ? 1.15 : 1 / 1.15, pointer(e))

  const gridLines = []
  for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) gridLines.push({ x })
  for (let y = Math.ceil(yMin / step) * step; y <= yMax; y += step) gridLines.push({ y })
  const [ox, oy] = toScreen(0, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card p-2 sm:p-4">
        <div className="relative">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full cursor-grab touch-none select-none rounded-xl bg-night-50 active:cursor-grabbing dark:bg-night-950"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (drag.current = null)}
            onPointerLeave={() => {
              drag.current = null
              setHoverX(null)
            }}
            onWheel={onWheel}
            role="img"
            aria-label="Graphique des fonctions"
          >
            {gridLines.map((g, i) =>
              g.x !== undefined ? (
                <g key={`x${i}`}>
                  <line x1={toScreen(g.x, 0)[0]} x2={toScreen(g.x, 0)[0]} y1="0" y2={H} className="stroke-night-300/50 dark:stroke-night-800" />
                  {Math.abs(g.x) > step / 2 && (
                    <text x={toScreen(g.x, 0)[0]} y={Math.min(H - 4, Math.max(12, oy + 14))} textAnchor="middle" className="fill-night-500 font-mono text-[11px]">
                      {smartNumber(parseFloat(g.x.toPrecision(10)), 5)}
                    </text>
                  )}
                </g>
              ) : (
                <g key={`y${i}`}>
                  <line y1={toScreen(0, g.y)[1]} y2={toScreen(0, g.y)[1]} x1="0" x2={W} className="stroke-night-300/50 dark:stroke-night-800" />
                  {Math.abs(g.y) > step / 2 && (
                    <text x={Math.min(W - 4, Math.max(4, ox + 5))} y={toScreen(0, g.y)[1] - 3} className="fill-night-500 font-mono text-[11px]">
                      {smartNumber(parseFloat(g.y.toPrecision(10)), 5)}
                    </text>
                  )}
                </g>
              ),
            )}
            <line x1="0" x2={W} y1={oy} y2={oy} className="stroke-night-500" strokeWidth="1.5" />
            <line y1="0" y2={H} x1={ox} x2={ox} className="stroke-night-500" strokeWidth="1.5" />
            {paths.map((d, i) => d && <path key={i} d={d} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="2.5" strokeLinejoin="round" />)}
            {hoverX !== null && (
              <>
                <line x1={toScreen(hoverX, 0)[0]} x2={toScreen(hoverX, 0)[0]} y1="0" y2={H} className="stroke-night-400" strokeDasharray="3 3" />
                {compiled.map((c, i) => {
                  if (!c.fn) return null
                  const y = evalAt(c.fn, hoverX)
                  if (!Number.isFinite(y)) return null
                  const [sx, sy] = toScreen(hoverX, y)
                  return <circle key={i} cx={sx} cy={sy} r="4.5" fill={COLORS[i % COLORS.length]} />
                })}
              </>
            )}
          </svg>
          <div className="absolute right-2 top-2 flex flex-col gap-1">
            <button type="button" className="btn-icon" onClick={() => zoom(1.5)} aria-label="Zoom avant">
              <Plus size={16} />
            </button>
            <button type="button" className="btn-icon" onClick={() => zoom(1 / 1.5)} aria-label="Zoom arrière">
              <Minus size={16} />
            </button>
            <button type="button" className="btn-icon" onClick={() => setView(DEFAULT_VIEW)} aria-label="Vue initiale">
              <Maximize size={16} />
            </button>
          </div>
        </div>
        <p className="mt-2 text-xs text-night-500">Glissez pour vous déplacer, molette ou boutons pour zoomer. Angles en radians.</p>
      </div>

      <aside className="card card-pad h-fit space-y-3">
        <p className="label">Fonctions f(x)</p>
        {funcs.map((f, i) => (
          <div key={i}>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <input
                className={`input font-mono ${compiled[i].error ? 'border-red-500' : ''}`}
                value={f}
                onChange={(e) => setFuncs(funcs.map((g, j) => (j === i ? e.target.value : g)))}
                aria-label={`Fonction ${i + 1}`}
                spellCheck={false}
              />
              <button type="button" className="text-night-400 hover:text-red-500" onClick={() => setFuncs(funcs.filter((_, j) => j !== i))} aria-label="Supprimer">
                <Trash2 size={15} />
              </button>
            </div>
            {compiled[i].error && <p className="mt-1 text-xs text-red-500">{compiled[i].error}</p>}
            {hoverX !== null && compiled[i].fn && (
              <p className="mt-1 font-mono text-xs text-night-500">
                f({smartNumber(hoverX, 4)}) = {smartNumber(evalAt(compiled[i].fn, hoverX), 6)}
              </p>
            )}
          </div>
        ))}
        {funcs.length < COLORS.length && (
          <button type="button" className="btn w-full" onClick={() => setFuncs([...funcs, ''])}>
            <Plus size={15} /> Ajouter une fonction
          </button>
        )}
        <p className="text-xs text-night-500">
          Exemples : 2x+1, x^3-3x, sqrt(x), 1/x, abs(sin(x)), ln(x), exp(-x^2). Fonctions : sin, cos, tan, asin, acos, atan, sinh, cosh, tanh,
          sqrt, cbrt, ln, log, exp, abs, floor, round, sign.
        </p>
      </aside>
    </div>
  )
}

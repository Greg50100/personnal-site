import { useEffect, useMemo, useRef, useState } from 'react'
import { fmt } from '../../../lib/format'
import {
  airState,
  dewPointFromVapor,
  enthalpy,
  humidityRatio,
  ratioFromEnthalpy,
  ratioFromWetBulb,
  saturationRatio,
  saturationVaporPressure,
  specificVolume,
  temperatureFromVolume,
} from './psychro'

/**
 * DIAGRAMME DE L'AIR HUMIDE (type ASHRAE / Carrier)
 * --------------------------------------------------
 * Abscisse : température sèche ; ordonnée (à droite) : rapport de mélange. Courbe de saturation graduée en
 * température humide (= point de rosée sur cette courbe), courbes d'humidité relative, droites de température
 * humide, d'enthalpie et de volume spécifique, toutes calculées pour la pression donnée.
 * chart : { component: PsychroChart, title, p (hPa), t (°C), w (kg/kg) }
 */

const FAMILIES = [
  { id: 'rh', label: 'Humidité relative', key: 'bg-[#2a78d6] dark:bg-[#3987e5]', stroke: 'stroke-[#2a78d6] dark:stroke-[#3987e5]' },
  { id: 'tw', label: 'Température humide', key: 'bg-[#1baf7a] dark:bg-[#199e70]', stroke: 'stroke-[#1baf7a] dark:stroke-[#199e70]', dashed: true },
  { id: 'h', label: 'Enthalpie', key: 'bg-[#eb6834] dark:bg-[#d95926]', stroke: 'stroke-[#eb6834] dark:stroke-[#d95926]' },
  { id: 'v', label: 'Volume spécifique', key: 'bg-[#6250d6] dark:bg-[#9085e9]', stroke: 'stroke-[#6250d6] dark:stroke-[#9085e9]' },
]
const ACCENT = 'fill-accent-500 dark:fill-accent-400'
const ACCENT_STROKE = 'stroke-accent-500 dark:stroke-accent-400'
const HALO = 'stroke-night-50 dark:stroke-night-950'
const PAD = { l: 14, r: 52, t: 18, b: 40 }

/** Racine d'une fonction décroissante (ou croissante) par dichotomie sur [lo, hi]. */
function solve(f, lo, hi) {
  const flo = f(lo)
  if (!(flo * f(hi) <= 0)) return null
  let a = lo
  let b = hi
  for (let i = 0; i < 60; i++) {
    const m = (a + b) / 2
    if ((f(m) > 0) === (flo > 0)) a = m
    else b = m
  }
  return (a + b) / 2
}

const path = (pts) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('')

/** Géométrie du diagramme : toutes les courbes en coordonnées écran. */
function buildGeometry({ width, height, p, t, w }) {
  const wg = w * 1000
  const tMin = Math.min(-10, Math.floor((t - 5) / 5) * 5)
  const tMax = Math.max(50, Math.ceil((t + 5) / 5) * 5)
  const wMax = Math.max(30, Math.ceil((wg + 3) / 5) * 5)
  const plotW = width - PAD.l - PAD.r
  const plotH = height - PAD.t - PAD.b
  const x = (tt) => PAD.l + ((tt - tMin) / (tMax - tMin)) * plotW
  const y = (ww) => PAD.t + (1 - ww / wMax) * plotH
  const ws = (tt) => saturationRatio(tt, p) * 1000
  // Au-delà de cette température, la vapeur saturante approche la pression totale : pas de solution utile
  const tSafe = Math.min(100, dewPointFromVapor(0.5 * p))
  const tTop = solve((tt) => ws(tt) - wMax, tMin - 30, tSafe) ?? tMax // la saturation sort par le haut

  const step = (tMax - tMin) / 240
  const temps = []
  for (let tt = tMin; tt <= tMax + 1e-9; tt += step) temps.push(tt)

  const satPts = temps.filter((tt) => tt <= tTop).map((tt) => [x(tt), y(ws(tt))])
  if (tTop < tMax) satPts.push([x(tTop), y(wMax)])
  const clip = `${path([[x(tMin), y(0)], ...satPts, [x(tMax), y(wMax)], [x(tMax), y(0)]])}Z`

  // Graduations
  const xStep = plotW / ((tMax - tMin) / 5) < 30 ? 10 : 5
  const xTicks = []
  for (let tt = Math.ceil(tMin / xStep) * xStep; tt <= tMax; tt += xStep) xTicks.push(tt)
  const yStep = wMax <= 30 ? 2 : wMax <= 60 ? 5 : 10
  const yTicks = []
  for (let v = 0; v <= wMax + 1e-9; v += yStep) yTicks.push(v)

  // Humidité relative : 10 à 90 %, étiquetée sur une diagonale qui va du haut de la saturation vers le bas à droite
  const diag = (tt) => wMax - 0.78 * wMax * ((tt - tTop) / (tMax - tTop || 1))
  const rh = []
  for (let phi = 10; phi <= 90; phi += 10) {
    const wOf = (tt) => humidityRatio((phi / 100) * saturationVaporPressure(tt), p) * 1000
    const pts = []
    for (const tt of temps) {
      const ww = wOf(tt)
      pts.push([x(tt), y(Math.min(ww, wMax * 1.02))])
      if (ww > wMax) break
    }
    const tl = solve((tt) => wOf(tt) - diag(tt), Math.max(tMin, tTop - 5), tMax - 2.5) ?? tMax - 2.5
    rh.push({ phi, d: path(pts), label: { x: x(tl), y: y(Math.min(wOf(tl), wMax * 0.97)), text: `${phi} %` } })
  }

  // Température humide : droites partant de la saturation, tous les 5 °C ; graduations sur la courbe de saturation
  const tw = []
  for (let a = Math.ceil(tMin / 5) * 5; a <= tTop; a += 5) {
    const pts = []
    for (let tt = a; tt <= tMax + 1; tt += 1) {
      const ww = ratioFromWetBulb(tt, a, p) * 1000
      pts.push([x(tt), y(Math.max(ww, -1))])
      if (ww < 0) break
    }
    const label = x(a) - PAD.l > 24 ? { x: x(a) - 5, y: y(ws(a)) - 3, text: String(a) } : null
    tw.push({ value: a, d: path(pts), label })
  }

  // Enthalpie : tous les 10 kJ/kg, prolongées au-delà de la saturation jusqu'à leur graduation
  const hMin = enthalpy(tMin, 0)
  const hMax = enthalpy(tMax, wMax / 1000)
  const hStep = hMax - hMin > 160 ? 20 : 10
  const hs = []
  for (let h = Math.ceil(hMin / hStep) * hStep; h <= hMax; h += hStep) {
    const wOf = (tt) => ratioFromEnthalpy(tt, h) * 1000
    const ts = solve((tt) => wOf(tt) - ws(tt), tMin - 30, tSafe)
    if (ts == null) continue
    const t0 = h / 1.006
    const tStart = ts < tTop ? ts : (h - 2501 * (wMax / 1000)) / (1.006 + 1.86 * (wMax / 1000))
    const pts = [
      [x(tStart), y(wOf(tStart))],
      [x((tStart + t0) / 2), y(wOf((tStart + t0) / 2))],
      [x(t0), y(0)],
    ]
    let label = null
    let ext = null
    if (ts < tTop && ts >= tMin) {
      // Prolongement de 30 px vers le haut à gauche, dans la direction de la droite
      const [x1, y1] = [x(ts), y(ws(ts))]
      const dx = x(ts - 1) - x1
      const dy = y(wOf(ts - 1)) - y1
      const n = Math.hypot(dx, dy)
      const [ex, ey] = [x1 + (dx / n) * 30, y1 + (dy / n) * 30]
      ext = path([[x1, y1], [ex, ey]])
      label = { x: ex - 2, y: ey + 3, text: String(h), anchor: 'end' }
    } else if (ts >= tTop && tStart <= tMax) {
      label = { x: x(tStart), y: PAD.t - 5, text: String(h), anchor: 'middle' }
    }
    hs.push({ value: h, d: path(pts), ext, label })
  }

  // Volume spécifique : tous les 0,01 m³/kg (0,02 si trop serré), graduations en bas
  const vMin = specificVolume(tMin, 0, p)
  const vMax = specificVolume(tMax, wMax / 1000, p)
  const vGap = x(tMin + 0.01 / (vMin / (tMin + 273.15))) - x(tMin)
  const vStep = vGap < 34 ? 0.02 : 0.01
  const vs = []
  for (let k = Math.ceil(vMin / vStep - 1e-9); k * vStep <= vMax; k++) {
    const v = k * vStep
    const tAt = (ww) => temperatureFromVolume(v, ww / 1000, p)
    const pts = [0, wMax / 2, wMax].map((ww) => [x(tAt(ww)), y(ww)])
    const tb = tAt(0.9 * yStep)
    const label = tb > tMin + 1 && tb < tMax - 1 && 0.9 * yStep < ws(tb) ? { x: x(tb), y: y(0.9 * yStep) + 4, text: fmt(v, 2) } : null
    vs.push({ value: v, d: path(pts), label })
  }

  return { tMin, tMax, wMax, x, y, ws, clip, satPath: path(satPts), xTicks, yTicks, rh, tw, hs, vs, plotW, plotH, tTop }
}

function useWidth(ref) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

function Label({ x, y, text, anchor = 'middle', className = 'fill-night-600 dark:fill-night-300', size = 'text-[10px]' }) {
  return (
    <text x={x} y={y} textAnchor={anchor} className={`${className} ${HALO} ${size}`} strokeWidth="3" strokeLinejoin="round" style={{ paintOrder: 'stroke' }}>
      {text}
    </text>
  )
}

function Readout({ state, hover }) {
  const items = [
    ['Température sèche', `${fmt(state.t, 1)} °C`],
    ['Humidité relative', `${fmt(state.rh, 0)} %`],
    ['Rapport de mélange', `${fmt(state.w * 1000, 2)} g/kg`],
    ['Température humide', `${fmt(state.tw, 1)} °C`],
    ['Point de rosée', `${fmt(state.td, 1)} °C`],
    ['Enthalpie', `${fmt(state.h, 1)} kJ/kg`],
    ['Volume spécifique', `${fmt(state.v, 3)} m³/kg`],
  ]
  return (
    <div className="mt-2 rounded-xl border border-night-200 px-3 py-2 dark:border-night-800" aria-live="polite">
      <p className="text-[11px] text-night-500">{hover ? 'Sous le pointeur' : 'Votre air (survolez le diagramme pour lire un autre point)'}</p>
      <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4">
        {items.map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="truncate text-[11px] text-night-500">{k}</dt>
            <dd className="font-mono text-sm font-semibold text-night-900 tabular-nums dark:text-night-50">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default function PsychroChart({ chart }) {
  const { p, t, w, title } = chart
  const boxRef = useRef(null)
  const svgRef = useRef(null)
  const width = useWidth(boxRef)
  const [layers, setLayers] = useState({ rh: true, tw: true, h: true, v: true })
  const [hover, setHover] = useState(null)
  const W = Math.max(300, width)
  const H = Math.round(Math.min(560, Math.max(300, W * 0.66)))
  const g = useMemo(() => buildGeometry({ width: W, height: H, p, t, w }), [W, H, p, t, w])
  const state = useMemo(() => airState(t, w, p), [t, w, p])
  const twSat = state.tw
  const twPath = useMemo(() => {
    const pts = []
    const n = 12
    for (let i = 0; i <= n; i++) {
      const tt = twSat + ((t - twSat) * i) / n
      pts.push([g.x(tt), g.y(ratioFromWetBulb(tt, twSat, p) * 1000)])
    }
    return path(pts)
  }, [g, t, twSat, p])

  const onMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * W
    const py = ((e.clientY - rect.top) / rect.height) * H
    const tt = g.tMin + ((px - PAD.l) / g.plotW) * (g.tMax - g.tMin)
    const ww = (1 - (py - PAD.t) / g.plotH) * g.wMax
    if (tt < g.tMin || tt > g.tMax || ww < 0 || ww > g.wMax || ww > g.ws(tt)) return setHover(null)
    setHover(airState(tt, ww / 1000, p))
  }

  const sx = g.x(t)
  const sy = g.y(w * 1000)
  const right = PAD.l + g.plotW

  return (
    <figure className="mt-4" ref={boxRef}>
      <figcaption className="label">{title}</figcaption>
      <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Familles de courbes affichées">
        {FAMILIES.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={layers[f.id]}
            onClick={() => setLayers((l) => ({ ...l, [f.id]: !l[f.id] }))}
            className={`chip cursor-pointer gap-1.5 ${layers[f.id] ? 'text-night-800 dark:text-night-100' : 'opacity-50'}`}
          >
            <span className={`inline-block h-0.5 w-4 ${f.key} ${f.dashed ? 'opacity-70' : ''}`} />
            {f.label}
          </button>
        ))}
        <span className="chip gap-1.5 text-night-800 dark:text-night-100">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-accent-500 dark:bg-accent-400" />
          Votre air
        </span>
      </div>
      {width > 0 && (
        <svg
          ref={svgRef}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-auto w-full touch-none select-none rounded-xl bg-night-50 dark:bg-night-950"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
          role="img"
          aria-label={`${title}. Votre air : ${fmt(t, 1)} °C, ${fmt(state.rh, 0)} % d’humidité relative, ${fmt(w * 1000, 1)} g/kg.`}
        >
          <defs>
            <clipPath id="psychro-clip">
              <path d={g.clip} />
            </clipPath>
          </defs>

          {/* Quadrillage : températures sèches (verticales) et rapports de mélange (horizontales), sous la saturation */}
          <g clipPath="url(#psychro-clip)" className="stroke-night-200 dark:stroke-night-800" strokeWidth="1">
            {g.xTicks.map((v) => (
              <line key={`gx${v}`} x1={g.x(v)} x2={g.x(v)} y1={PAD.t} y2={g.y(0)} />
            ))}
            {g.yTicks.map((v) => (
              <line key={`gy${v}`} x1={PAD.l} x2={right} y1={g.y(v)} y2={g.y(v)} />
            ))}
          </g>

          <g clipPath="url(#psychro-clip)" fill="none" strokeWidth="1">
            {layers.v && g.vs.map((l) => <path key={`v${l.value}`} d={l.d} className={FAMILIES[3].stroke} opacity="0.7" />)}
            {layers.h && g.hs.map((l) => <path key={`h${l.value}`} d={l.d} className={FAMILIES[2].stroke} opacity="0.75" />)}
            {layers.tw && g.tw.map((l) => <path key={`tw${l.value}`} d={l.d} className={FAMILIES[1].stroke} strokeDasharray="4 3" />)}
            {layers.rh && g.rh.map((l) => <path key={`rh${l.phi}`} d={l.d} className={FAMILIES[0].stroke} opacity="0.8" />)}
          </g>
          {layers.h && (
            <g fill="none" strokeWidth="1">
              {g.hs.filter((l) => l.ext).map((l) => <path key={`he${l.value}`} d={l.ext} className={FAMILIES[2].stroke} opacity="0.75" />)}
            </g>
          )}

          {/* Courbe de saturation (100 %) et axes */}
          <path d={g.satPath} fill="none" strokeWidth="2" strokeLinejoin="round" className={FAMILIES[0].stroke} />
          <line x1={PAD.l} x2={right} y1={g.y(0)} y2={g.y(0)} className="stroke-night-300 dark:stroke-night-700" />
          <line x1={right} x2={right} y1={PAD.t} y2={g.y(0)} className="stroke-night-300 dark:stroke-night-700" />

          {g.xTicks.map((v) => (
            <text key={`tx${v}`} x={g.x(v)} y={g.y(0) + 15} textAnchor="middle" className="fill-night-500 font-mono text-[11px]">
              {v}
            </text>
          ))}
          {g.yTicks.map((v) => (
            <text key={`ty${v}`} x={right + 6} y={g.y(v) + 4} className="fill-night-500 font-mono text-[11px]">
              {v}
            </text>
          ))}
          <text x={PAD.l + g.plotW / 2} y={H - 6} textAnchor="middle" className="fill-night-500 text-[11px]">
            Température sèche (°C)
          </text>
          <text
            x={W - 10}
            y={PAD.t + g.plotH / 2}
            textAnchor="middle"
            transform={`rotate(90 ${W - 10} ${PAD.t + g.plotH / 2})`}
            className="fill-night-500 text-[11px]"
          >
            {g.plotH < 340 ? 'w (g/kg d’air sec)' : 'Rapport de mélange w (g/kg d’air sec)'}
          </text>

          {/* Graduations des familles */}
          {layers.rh && g.rh.map((l) => <Label key={`lrh${l.phi}`} {...l.label} />)}
          {g.tw
            .filter((l) => l.label && Math.abs(l.value - state.td) > 2 && Math.abs(l.value - twSat) > 2)
            .map((l) => (
              <Label key={`ltw${l.value}`} {...l.label} anchor="end" className="fill-night-700 font-semibold dark:fill-night-200" />
            ))}
          {layers.h && g.hs.filter((l) => l.label).map((l) => <Label key={`lh${l.value}`} {...l.label} className="fill-night-500" />)}
          {layers.v && g.vs.filter((l) => l.label).map((l) => <Label key={`lv${l.value}`} {...l.label} className="fill-night-500" />)}
          {layers.h && (
            <text x={g.x(g.tMin + (g.tTop - g.tMin) * 0.12)} y={g.y(g.wMax * 0.72)} className="fill-night-500 text-[11px]">
              <tspan>Enthalpie h</tspan>
              <tspan x={g.x(g.tMin + (g.tTop - g.tMin) * 0.12)} dy="14">
                (kJ/kg d’air sec)
              </tspan>
            </text>
          )}

          {/* Votre air : construction du point de rosée, de la température humide et de la température sèche */}
          <g fill="none" strokeWidth="1.5" strokeDasharray="5 3" className={ACCENT_STROKE}>
            <line x1={g.x(state.td)} x2={right} y1={sy} y2={sy} />
            <line x1={sx} x2={sx} y1={sy} y2={g.y(0)} />
            <path d={twPath} />
          </g>
          <circle cx={g.x(state.td)} cy={sy} r="3.5" className={`${ACCENT} ${HALO}`} strokeWidth="2" />
          <circle cx={g.x(twSat)} cy={g.y(g.ws(twSat))} r="3.5" className={`${ACCENT} ${HALO}`} strokeWidth="2" />
          <Label x={g.x(state.td) - 7} y={sy + 4} anchor="end" text={`Td ${fmt(state.td, 1)}`} className="fill-night-900 font-semibold dark:fill-night-50" size="text-[11px]" />
          <Label x={g.x(twSat) - 7} y={g.y(g.ws(twSat)) - 6} anchor="end" text={`Tw ${fmt(twSat, 1)}`} className="fill-night-900 font-semibold dark:fill-night-50" size="text-[11px]" />
          <circle cx={sx} cy={sy} r="5.5" className={`${ACCENT} ${HALO}`} strokeWidth="2" />

          {hover && <circle cx={g.x(hover.t)} cy={g.y(hover.w * 1000)} r="4" fill="none" strokeWidth="2" className="stroke-night-900 dark:stroke-night-50" />}
        </svg>
      )}
      <Readout state={hover ?? state} hover={Boolean(hover)} />
      <p className="mt-2 text-xs text-night-500">
        Courbe de saturation graduée en température humide (égale au point de rosée sur cette courbe). Construction : le
        point de rosée se lit à l’horizontale, la température humide le long de la droite pointillée, la température sèche
        à la verticale.
      </p>
    </figure>
  )
}

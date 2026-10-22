import { useState } from 'react'
import { parseNumber, smartNumber } from '../../../lib/format'
import { solveQuadratic } from './quadratic'

const n = (x) => smartNumber(x, 8)

/** Écrit un polynôme proprement : 2x² − 3x + 1. */
function polynomial(a, b, c) {
  const terms = [
    [a, 'x²'],
    [b, 'x'],
    [c, ''],
  ].filter(([k]) => k !== 0)
  if (!terms.length) return '0'
  return terms
    .map(([k, v], i) => {
      const sign = k < 0 ? '−' : '+'
      const abs = Math.abs(k)
      const coef = abs === 1 && v ? '' : n(abs)
      return `${i === 0 ? (k < 0 ? '−' : '') : ` ${sign} `}${coef}${v}`
    })
    .join('')
}

const complexStr = (z) => {
  if (Math.abs(z.im) < 1e-15) return n(z.re)
  const re = Math.abs(z.re) < 1e-15 ? '' : n(z.re)
  const im = `${n(Math.abs(z.im))} i`
  return re ? `${re} ${z.im < 0 ? '−' : '+'} ${im}` : `${z.im < 0 ? '−' : ''}${im}`
}

function Plot({ a, b, c, result }) {
  const W = 480
  const H = 300
  const pts = [result.vertex.x, ...result.roots.filter((r) => r.im === 0).map((r) => r.re)]
  const span = Math.max(2, (Math.max(...pts) - Math.min(...pts)) * 1.6, Math.sqrt(Math.abs(4 / a)) * 2)
  const xMin = (Math.max(...pts) + Math.min(...pts)) / 2 - span / 2
  const xMax = xMin + span
  const f = (x) => a * x * x + b * x + c
  const samples = Array.from({ length: 121 }, (_, i) => xMin + (i / 120) * span)
  const ys = samples.map(f)
  let yMin = Math.min(0, ...ys)
  let yMax = Math.max(0, ...ys)
  const pad = (yMax - yMin) * 0.1 || 1
  yMin -= pad
  yMax += pad
  const sx = (x) => ((x - xMin) / (xMax - xMin)) * W
  const sy = (y) => H - ((y - yMin) / (yMax - yMin)) * H
  const path = samples.map((x, i) => `${i ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(ys[i]).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950" role="img" aria-label="Tracé de la parabole">
      {yMin < 0 && yMax > 0 && <line x1="0" x2={W} y1={sy(0)} y2={sy(0)} className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1" />}
      {xMin < 0 && xMax > 0 && <line y1="0" y2={H} x1={sx(0)} x2={sx(0)} className="stroke-zinc-400 dark:stroke-zinc-600" strokeWidth="1" />}
      <line x1={sx(result.vertex.x)} x2={sx(result.vertex.x)} y1="0" y2={H} stroke="#f97316" strokeDasharray="4 4" strokeOpacity="0.4" />
      <path d={path} fill="none" stroke="#f97316" strokeWidth="2.5" />
      <circle cx={sx(result.vertex.x)} cy={sy(result.vertex.y)} r="4.5" fill="#f97316" />
      {result.roots
        .filter((r) => r.im === 0)
        .map((r) => (
          <circle key={r.re} cx={sx(r.re)} cy={sy(0)} r="5" className="fill-white stroke-emerald-500 dark:fill-zinc-950" strokeWidth="2.5" />
        ))}
    </svg>
  )
}

export default function QuadraticSolver() {
  const [coefs, setCoefs] = useState({ a: '1', b: '-3', c: '2' })
  const a = parseNumber(coefs.a)
  const b = parseNumber(coefs.b)
  const c = parseNumber(coefs.c)
  const valid = [a, b, c].every(Number.isFinite)
  const result = valid ? solveQuadratic(a, b, c) : null

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card card-pad">
        <p className="mb-4 text-center font-mono text-lg">
          a·x² + b·x + c = 0
        </p>
        <div className="grid grid-cols-3 gap-3">
          {['a', 'b', 'c'].map((k) => (
            <div key={k}>
              <label htmlFor={`q-${k}`} className="label">
                {k}
              </label>
              <input
                id={`q-${k}`}
                className="input font-mono"
                inputMode="decimal"
                value={coefs[k]}
                onChange={(e) => setCoefs({ ...coefs, [k]: e.target.value })}
              />
            </div>
          ))}
        </div>

        {result && (
          <div className="mt-6 space-y-4 text-sm">
            <p className="rounded-lg bg-zinc-100 p-3 text-center font-mono text-base dark:bg-zinc-950">{polynomial(a, b, c)} = 0</p>
            {result.kind === 'all' && <p>Tous les réels sont solutions (0 = 0).</p>}
            {result.kind === 'none' && <p>Aucune solution ({n(c)} ≠ 0).</p>}
            {result.kind === 'linear' && (
              <p>
                Équation du premier degré : <strong className="font-mono">x = {n(result.roots[0].re)}</strong>
              </p>
            )}
            {'delta' in result && (
              <>
                <div>
                  <p className="label">Discriminant</p>
                  <p className="font-mono">
                    Δ = b² − 4ac = {n(result.delta)}{' '}
                    <span className="text-zinc-500">
                      {result.kind === 'real' ? '> 0 : deux racines réelles' : result.kind === 'double' ? '= 0 : une racine double' : '< 0 : deux racines complexes conjuguées'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="label">Solutions</p>
                  <ul className="space-y-1 font-mono text-base font-semibold text-orange-600 dark:text-orange-400">
                    {result.roots.map((r, i) => (
                      <li key={i}>
                        {result.kind === 'double' ? 'x₀' : `x${i === 0 ? '₁' : '₂'}`} = {complexStr(r)}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="label">Sommet</p>
                    <p className="font-mono">
                      S({n(result.vertex.x)} ; {n(result.vertex.y)})
                    </p>
                  </div>
                  <div>
                    <p className="label">Forme canonique</p>
                    <p className="font-mono">
                      {a === 1 ? '' : a === -1 ? '−' : n(a)}(x {result.vertex.x < 0 ? '+' : '−'} {n(Math.abs(result.vertex.x))})² {result.vertex.y < 0 ? '−' : '+'}{' '}
                      {n(Math.abs(result.vertex.y))}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
        {!valid && <p className="mt-4 text-sm text-red-500">Les trois coefficients doivent être des nombres.</p>}
      </div>

      {result && 'vertex' in result && (
        <div className="card card-pad">
          <p className="label">Parabole</p>
          <Plot a={a} b={b} c={c} result={result} />
          <p className="mt-2 text-xs text-zinc-500">
            <span className="text-orange-500">●</span> sommet · <span className="text-emerald-500">○</span> racines réelles
          </p>
        </div>
      )}
    </div>
  )
}

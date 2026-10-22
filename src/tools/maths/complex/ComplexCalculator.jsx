import { useState } from 'react'
import { parseNumber, smartNumber } from '../../../lib/format'
import Segmented from '../../../components/Segmented'
import * as C from './complex'

const OPERATIONS = [
  { value: 'add', label: 'z₁ + z₂', binary: true, fn: C.add },
  { value: 'sub', label: 'z₁ − z₂', binary: true, fn: C.sub },
  { value: 'mul', label: 'z₁ × z₂', binary: true, fn: C.mul },
  { value: 'div', label: 'z₁ ÷ z₂', binary: true, fn: C.div },
  { value: 'pow', label: 'z₁ⁿ', power: true },
  { value: 'sqrt', label: '√z₁', fn: C.sqrt },
  { value: 'conj', label: 'z̄₁', fn: C.conj },
  { value: 'exp', label: 'exp z₁', fn: C.exp },
  { value: 'ln', label: 'ln z₁', fn: C.ln },
]

const n = (x) => smartNumber(Math.abs(x) < 1e-12 ? 0 : x, 8)
const deg = (rad) => (rad * 180) / Math.PI

function algebraic(z) {
  const re = Math.abs(z.re) < 1e-12 ? 0 : z.re
  const im = Math.abs(z.im) < 1e-12 ? 0 : z.im
  if (im === 0) return n(re)
  const imStr = `${Math.abs(im) === 1 ? '' : n(Math.abs(im))}i`
  if (re === 0) return `${im < 0 ? '−' : ''}${imStr}`
  return `${n(re)} ${im < 0 ? '−' : '+'} ${imStr}`
}

function Forms({ z, label }) {
  const r = C.abs(z)
  const theta = C.arg(z)
  return (
    <div className="space-y-1.5 text-sm">
      <p className="label">{label}</p>
      <p className="font-mono text-lg font-semibold text-orange-600 dark:text-orange-400">{algebraic(z)}</p>
      <p className="font-mono text-zinc-600 dark:text-zinc-400">
        |z| = {n(r)} · arg z = {n(deg(theta))}° ({n(theta)} rad)
      </p>
      <p className="font-mono text-zinc-600 dark:text-zinc-400">
        z = {n(r)} · e<sup>i·{n(theta)}</sup> = {n(r)}∠{n(deg(theta))}°
      </p>
    </div>
  )
}

function Argand({ points }) {
  const S = 260
  const max = Math.max(1, ...points.map((p) => Math.max(Math.abs(p.z.re), Math.abs(p.z.im)))) * 1.25
  const sx = (x) => S / 2 + (x / max) * (S / 2)
  const sy = (y) => S / 2 - (y / max) * (S / 2)
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="mx-auto h-auto w-full max-w-[320px] rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950" role="img" aria-label="Plan complexe">
      <line x1="0" x2={S} y1={S / 2} y2={S / 2} className="stroke-zinc-300 dark:stroke-zinc-700" />
      <line y1="0" y2={S} x1={S / 2} x2={S / 2} className="stroke-zinc-300 dark:stroke-zinc-700" />
      <text x={S - 6} y={S / 2 - 6} textAnchor="end" className="fill-zinc-500 font-mono text-[10px]">
        Re
      </text>
      <text x={S / 2 + 6} y="12" className="fill-zinc-500 font-mono text-[10px]">
        Im
      </text>
      {points.map((p) =>
        Number.isFinite(p.z.re) && Number.isFinite(p.z.im) ? (
          <g key={p.label}>
            <line x1={S / 2} y1={S / 2} x2={sx(p.z.re)} y2={sy(p.z.im)} stroke={p.color} strokeWidth="2" />
            <circle cx={sx(p.z.re)} cy={sy(p.z.im)} r="4" fill={p.color} />
            <text x={sx(p.z.re) + 6} y={sy(p.z.im) - 6} fill={p.color} className="font-mono text-[11px] font-bold">
              {p.label}
            </text>
          </g>
        ) : null,
      )}
    </svg>
  )
}

export default function ComplexCalculator() {
  const [inputs, setInputs] = useState({ z1: '3+4i', z2: '1-2i', n: '2' })
  const [op, setOp] = useState('mul')
  const operation = OPERATIONS.find((o) => o.value === op)

  const z1 = C.parseComplex(inputs.z1)
  const z2 = C.parseComplex(inputs.z2)
  const power = parseNumber(inputs.n)

  let result = null
  let error = ''
  if (!z1) error = 'z₁ invalide (exemple : 3+4i).'
  else if (operation.binary && !z2) error = 'z₂ invalide (exemple : 1-2i).'
  else if (operation.power && !Number.isFinite(power)) error = 'Exposant invalide.'
  else {
    try {
      result = operation.power ? C.pow(z1, power) : operation.binary ? operation.fn(z1, z2) : operation.fn(z1)
    } catch (e) {
      error = e.message
    }
  }

  const points = [
    z1 && { label: 'z₁', z: z1, color: '#38bdf8' },
    operation.binary && z2 && { label: 'z₂', z: z2, color: '#a78bfa' },
    result && { label: 'r', z: result, color: '#f97316' },
  ].filter(Boolean)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card card-pad space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="z1" className="label">
              z₁
            </label>
            <input id="z1" className="input font-mono" value={inputs.z1} onChange={(e) => setInputs({ ...inputs, z1: e.target.value })} />
          </div>
          {operation.binary && (
            <div>
              <label htmlFor="z2" className="label">
                z₂
              </label>
              <input id="z2" className="input font-mono" value={inputs.z2} onChange={(e) => setInputs({ ...inputs, z2: e.target.value })} />
            </div>
          )}
          {operation.power && (
            <div>
              <label htmlFor="zn" className="label">
                Exposant n (réel)
              </label>
              <input id="zn" className="input font-mono" inputMode="decimal" value={inputs.n} onChange={(e) => setInputs({ ...inputs, n: e.target.value })} />
            </div>
          )}
        </div>
        <div>
          <p className="label">Opération</p>
          <Segmented value={op} onChange={setOp} options={OPERATIONS.map(({ value, label }) => ({ value, label }))} ariaLabel="Opération" />
        </div>
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {error ? <p className="text-sm text-red-500">{error}</p> : result && <Forms z={result} label={`Résultat : ${operation.label}`} />}
        </div>
        {z1 && (
          <div className="grid gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:grid-cols-2">
            <Forms z={z1} label="z₁" />
            {operation.binary && z2 && <Forms z={z2} label="z₂" />}
          </div>
        )}
      </div>
      <div className="card card-pad">
        <p className="label">Plan complexe (Argand)</p>
        <Argand points={points} />
        <p className="mt-3 text-xs text-zinc-500">Saisie acceptée : 3+4i, -2i, 1,5 - j2, i, 5…</p>
      </div>
    </div>
  )
}

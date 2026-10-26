import { useState } from 'react'
import Segmented from '../../../../components/Segmented'
import { parseNumber, smartNumber } from '../../../../lib/format'
import * as M from './matrix'

const OPS = [
  { value: 'add', label: 'A + B', binary: true },
  { value: 'sub', label: 'A − B', binary: true },
  { value: 'mul', label: 'A × B', binary: true },
  { value: 'det', label: 'det(A)' },
  { value: 'inv', label: 'A⁻¹' },
  { value: 'tr', label: 'Aᵀ' },
  { value: 'pow', label: 'Aⁿ' },
  { value: 'props', label: 'Trace et rang' },
]

const resize = (grid, n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => grid[i]?.[j] ?? (i === j ? '1' : '0')))

function Grid({ label, grid, onChange }) {
  const n = grid.length
  return (
    <div>
      <p className="label">{label}</p>
      <div className="inline-grid gap-1.5 rounded-xl border-x-2 border-night-400 px-2 py-1 dark:border-night-500" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 4.5rem))` }}>
        {grid.map((row, i) =>
          row.map((cell, j) => (
            <input
              key={`${i}-${j}`}
              className="input px-1.5 py-1.5 text-center font-mono"
              value={cell}
              inputMode="decimal"
              aria-label={`${label}, ligne ${i + 1}, colonne ${j + 1}`}
              onChange={(e) => onChange(grid.map((r, a) => r.map((c, b) => (a === i && b === j ? e.target.value : c))))}
            />
          )),
        )}
      </div>
    </div>
  )
}

function Display({ matrix }) {
  return (
    <div className="inline-grid gap-x-4 gap-y-1 rounded-xl border-x-2 border-accent-500 px-3 py-2 font-mono" style={{ gridTemplateColumns: `repeat(${matrix[0].length}, auto)` }}>
      {matrix.flatMap((row, i) =>
        row.map((x, j) => (
          <span key={`${i}-${j}`} className="text-right">
            {smartNumber(Math.abs(x) < 1e-12 ? 0 : x, 6)}
          </span>
        )),
      )}
    </div>
  )
}

export default function Matrices() {
  const [n, setN] = useState(3)
  const [a, setA] = useState([
    ['2', '1', '0'],
    ['1', '3', '1'],
    ['0', '1', '4'],
  ])
  const [b, setB] = useState([
    ['1', '0', '2'],
    ['0', '1', '0'],
    ['3', '0', '1'],
  ])
  const [op, setOp] = useState('mul')
  const [k, setK] = useState('2')

  const changeSize = (size) => {
    setN(size)
    setA((g) => resize(g, size))
    setB((g) => resize(g, size))
  }

  const parse = (g) => g.map((row) => row.map(parseNumber))
  const A = parse(a)
  const B = parse(b)
  const operation = OPS.find((o) => o.value === op)
  let result = null
  let error = ''
  try {
    if (A.flat().some((x) => !Number.isFinite(x)) || (operation.binary && B.flat().some((x) => !Number.isFinite(x)))) throw new Error('Toutes les cases doivent contenir un nombre.')
    if (op === 'add') result = { matrix: M.add(A, B) }
    if (op === 'sub') result = { matrix: M.sub(A, B) }
    if (op === 'mul') result = { matrix: M.multiply(A, B) }
    if (op === 'det') result = { scalar: M.determinant(A), label: 'det(A)' }
    if (op === 'inv') result = { matrix: M.inverse(A) }
    if (op === 'tr') result = { matrix: M.transpose(A) }
    if (op === 'pow') result = { matrix: M.power(A, parseNumber(k)) }
    if (op === 'props') result = { list: [['Trace', M.trace(A)], ['Rang', M.rank(A)], ['Déterminant', M.determinant(A)]] }
  } catch (err) {
    error = err.message
  }

  return (
    <div className="grid gap-6">
      <div className="card card-pad space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label mb-0">Taille</span>
          <Segmented size="sm" value={n} onChange={changeSize} ariaLabel="Taille des matrices" options={[2, 3, 4, 5].map((s) => ({ value: s, label: `${s}×${s}` }))} />
        </div>
        <div className="flex flex-wrap gap-6">
          <Grid label="Matrice A" grid={a} onChange={setA} />
          {operation.binary && <Grid label="Matrice B" grid={b} onChange={setB} />}
        </div>
        <div>
          <p className="label">Opération</p>
          <Segmented value={op} onChange={setOp} ariaLabel="Opération" options={OPS.map(({ value, label }) => ({ value, label }))} />
          {op === 'pow' && (
            <label className="mt-3 flex items-center gap-2 text-sm">
              n =
              <input className="input w-24 font-mono" value={k} onChange={(e) => setK(e.target.value)} inputMode="numeric" />
            </label>
          )}
        </div>
      </div>
      <div className="card card-pad">
        <p className="label">Résultat : {operation.label}</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {result?.matrix && <Display matrix={result.matrix} />}
        {result?.scalar !== undefined && <p className="font-mono text-2xl font-bold text-accent-800 dark:text-accent-300">{smartNumber(result.scalar, 10)}</p>}
        {result?.list && (
          <dl className="grid gap-2 sm:grid-cols-3">
            {result.list.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-night-50 px-3 py-2 dark:bg-night-950">
                <dt className="text-xs text-night-500">{label}</dt>
                <dd className="font-mono text-lg">{smartNumber(value, 10)}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}

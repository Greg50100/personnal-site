import { useMemo, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import Segmented from '../../components/Segmented'
import { parseNumber, toDateInput } from '../../lib/format'
import { formatSI, parseSI } from '../../lib/si'
import { formatResult } from './format'
import LineChart from './LineChart'

/**
 * CALCULATEUR GÉNÉRIQUE
 * ---------------------
 * Affiche un outil décrit par une « spec » (objet JavaScript pur, facile à tester) :
 *
 * {
 *   inputs: [
 *     { id: 'r', label: 'Résistance', unit: 'Ω', value: '1k' },                  // nombre, préfixes SI acceptés (4k7, 10µ…)
 *     { id: 'n', label: 'Âge', type: 'number', value: '30', unit: 'ans' },       // nombre simple
 *     { id: 'mode', label: 'Mode', type: 'choice', value: 'a', options: [{ value: 'a', label: 'A' }] },
 *     { id: 'code', label: 'Code', type: 'text', value: '104' },
 *     { id: 'd', label: 'Date', type: 'date', value: 'today' },
 *     { …, optional: true },                     // peut rester vide (valeur NaN)
 *     { …, show: (v) => v.mode === 'a' },        // affiché selon les autres valeurs
 *     { …, presets: [{ label: 'Terre', value: '9.81' }] },
 *   ],
 *   compute(v) {                                  // v.r → nombre, v.mode → texte
 *     return {
 *       results: [{ label, value, unit, format: 'si' | 'num' | 'auto' | 'text' | 'percent' | 'duration', digits, main, hint }],
 *       table: { title, columns: [...], rows: [[...]] },
 *       chart: { title, x: { label }, y: { label }, series: [{ name, color, points: [[x, y]] }] },
 *       notes: ['…'],
 *     } // ou { error: 'message' } ou null (calcul impossible)
 *   },
 *   formulas: ['τ = R × C'],
 *   notes: ['texte d'aide'],
 * }
 */

const NUMERIC = new Set(['si', 'number', undefined])

const today = () => toDateInput(new Date())
/** Le libellé d'un champ peut dépendre des autres valeurs (fonction). */
const labelOf = (input, values) => (typeof input.label === 'function' ? input.label(values) : input.label)
const initialValue = (input) => (input.type === 'date' && input.value === 'today' ? today() : String(input.value ?? ''))

function readValues(spec, raw) {
  const v = {}
  for (const input of spec.inputs) {
    const text = raw[input.id] ?? ''
    if (input.type === 'number') v[input.id] = parseNumber(text)
    else if (NUMERIC.has(input.type)) v[input.id] = parseSI(text)
    else v[input.id] = text
  }
  return v
}

function Field({ input, value, onChange, values }) {
  const id = `calc-${input.id}`
  if (input.type === 'choice') {
    const short = input.options.length <= 4 && input.options.every((o) => o.label.length < 22)
    return (
      <div className={short ? 'sm:col-span-2' : ''}>
        <span className="label" id={`${id}-label`}>
          {labelOf(input, values)}
        </span>
        {short ? (
          <Segmented ariaLabel={labelOf(input, values)} value={value} onChange={onChange} options={input.options} />
        ) : (
          <select id={id} aria-labelledby={`${id}-label`} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
            {input.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
      </div>
    )
  }

  const numeric = NUMERIC.has(input.type)
  const parsed = input.type === 'number' ? parseNumber(value) : numeric ? parseSI(value) : null
  const empty = value.trim() === ''
  const invalid = numeric && !empty && !Number.isFinite(parsed)
  const echo =
    input.type === undefined || input.type === 'si'
      ? !empty && Number.isFinite(parsed) && input.unit && String(parsed) !== value.trim().replace(',', '.')
        ? `= ${formatSI(parsed, input.unit, 6)}`
        : ''
      : ''
  const hint = typeof input.hint === 'function' ? input.hint(values) : input.hint

  return (
    <div>
      <label htmlFor={id} className="label">
        {labelOf(input, values)}
        {input.unit && <span className="text-night-400"> ({input.unit})</span>}
      </label>
      <input
        id={id}
        type={input.type === 'date' ? 'date' : 'text'}
        className={`input ${input.type === 'text' ? '' : 'font-mono'} ${invalid ? 'border-red-500' : ''}`}
        inputMode={numeric ? 'decimal' : undefined}
        value={value}
        placeholder={input.placeholder ?? (input.optional ? 'facultatif' : '')}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        spellCheck={false}
      />
      {input.presets && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {input.presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(String(p.value))}
              className={`chip cursor-pointer hover:border-accent-400 ${String(p.value) === value ? 'border-accent-400 text-accent-800 dark:text-accent-300' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
      {(invalid || echo || hint) && (
        <p className={`mt-1 text-xs ${invalid ? 'text-red-500' : 'text-night-500'}`}>{invalid ? 'Valeur non reconnue' : echo || hint}</p>
      )}
    </div>
  )
}

export function ResultTiles({ results }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {results.map((r, i) => (
        <div
          key={`${r.label}-${i}`}
          className={`rounded-xl px-3 py-2 ${r.main ? 'border border-accent-400/50 bg-accent-400/10 sm:col-span-2 xl:col-span-1' : 'bg-night-50 dark:bg-night-950'}`}
        >
          <p className="text-xs text-night-500 dark:text-night-400">{r.label}</p>
          <p className={`break-words font-mono ${r.main ? 'text-2xl font-bold text-accent-800 dark:text-accent-300' : 'text-base'}`}>{formatResult(r)}</p>
          {r.hint && <p className="text-[11px] text-night-500">{r.hint}</p>}
        </div>
      ))}
    </div>
  )
}

export function ResultTable({ table }) {
  return (
    <div className="mt-4">
      {table.title && <p className="label">{table.title}</p>}
      <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
        <table className="table-data">
          <thead>
            <tr>
              {table.columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={j > 0 ? 'font-mono' : ''}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Calculator({ spec }) {
  const defaults = useMemo(() => Object.fromEntries(spec.inputs.map((i) => [i.id, initialValue(i)])), [spec])
  const [raw, setRaw] = useState(defaults)
  const values = readValues(spec, raw)
  const visible = spec.inputs.filter((i) => !i.show || i.show(values))
  const missing = visible.filter((i) => NUMERIC.has(i.type) && !i.optional && !Number.isFinite(values[i.id]))

  let output = null
  if (!missing.length) {
    try {
      output = spec.compute(values)
    } catch (err) {
      output = { error: err.message }
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="card card-pad min-w-0">
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((input) => (
            <Field key={input.id} input={input} value={raw[input.id]} values={values} onChange={(val) => setRaw((r) => ({ ...r, [input.id]: val }))} />
          ))}
        </div>

        <div className="mt-5 border-t border-night-200 pt-4 dark:border-night-800">
          {missing.length > 0 && <p className="text-sm text-night-500">Renseignez : {missing.map((i) => labelOf(i, values).toLowerCase()).join(', ')}.</p>}
          {!missing.length && !output && <p className="text-sm text-night-500">Calcul impossible avec ces valeurs.</p>}
          {output?.error && <p className="text-sm text-red-500">{output.error}</p>}
          {output?.results?.length > 0 && <ResultTiles results={output.results} />}
          {output?.table && <ResultTable table={output.table} />}
          {output?.chart && <LineChart chart={output.chart} />}
          {output?.notes?.map((n) => (
            <p key={n} className="mt-3 text-sm text-night-600 dark:text-night-400">
              {n}
            </p>
          ))}
        </div>
      </div>

      <aside className="card card-pad h-fit">
        {spec.formulas?.length > 0 && (
          <>
            <p className="label">Formules</p>
            <ul className="space-y-1.5 font-mono text-sm">
              {spec.formulas.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </>
        )}
        {spec.notes?.length > 0 && (
          <div className={`space-y-2 text-sm text-night-600 dark:text-night-400 ${spec.formulas?.length ? 'mt-4' : ''}`}>
            {spec.notes.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </div>
        )}
        <button type="button" className="btn mt-4 w-full" onClick={() => setRaw(defaults)}>
          <RotateCcw size={14} /> Valeurs par défaut
        </button>
      </aside>
    </div>
  )
}

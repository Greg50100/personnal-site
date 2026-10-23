import { useRef, useState } from 'react'
import { Delete, History, Trash2 } from 'lucide-react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { smartNumber } from '../../../lib/format'
import Segmented from '../../../components/Segmented'
import { evaluate } from './expression'

// [libellé affiché, texte inséré, style]
const FUNCTION_KEYS = [
  ['sin', 'sin('],
  ['cos', 'cos('],
  ['tan', 'tan('],
  ['√', '√('],
  ['x²', '²'],
  ['xʸ', '^'],
  ['sin⁻¹', 'asin('],
  ['cos⁻¹', 'acos('],
  ['tan⁻¹', 'atan('],
  ['ln', 'ln('],
  ['log', 'log('],
  ['n!', '!'],
]

const MAIN_KEYS = [
  ['(', '('],
  [')', ')'],
  ['%', '%'],
  ['π', 'π'],
  ['e', 'e'],
  ['7', '7', 'num'],
  ['8', '8', 'num'],
  ['9', '9', 'num'],
  ['÷', '÷', 'op'],
  ['Ans', 'Ans'],
  ['4', '4', 'num'],
  ['5', '5', 'num'],
  ['6', '6', 'num'],
  ['×', '×', 'op'],
  ['EXP', 'e'],
  ['1', '1', 'num'],
  ['2', '2', 'num'],
  ['3', '3', 'num'],
  ['−', '-', 'op'],
  ['⌫', 'back', 'action'],
  ['0', '0', 'num'],
  [',', '.', 'num'],
  ['=', 'eval', 'eq'],
  ['+', '+', 'op'],
  ['C', 'clear', 'action'],
]

const keyStyle = {
  num: 'bg-white text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100',
  op: 'bg-zinc-100 text-orange-600 dark:bg-zinc-900 dark:text-orange-400 font-bold',
  eq: 'bg-orange-600 text-white border-orange-600 hover:bg-orange-700 font-bold',
  action: 'bg-zinc-100 text-red-600 dark:bg-zinc-900 dark:text-red-400',
  default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
}

const tryEval = (expr, opts) => {
  try {
    return { value: evaluate(expr, opts) }
  } catch (err) {
    return { error: err.message }
  }
}

export default function ScientificCalculator() {
  const [expr, setExpr] = useState('')
  const [angle, setAngle] = useLocalStorage('calc-angle', 'deg')
  const [history, setHistory] = useLocalStorage('calc-history', [])
  const [lastError, setLastError] = useState('')
  const inputRef = useRef(null)

  const ans = history[0]?.result ?? 0
  const preview = expr.trim() ? tryEval(expr, { angle, ans }) : null

  const run = () => {
    if (!expr.trim()) return
    const res = tryEval(expr, { angle, ans })
    if ('error' in res) {
      setLastError(res.error)
      return
    }
    setHistory((h) => [{ expr, result: res.value, angle }, ...h].slice(0, 30))
    setExpr(String(res.value))
    setLastError('')
  }

  const insert = (text) => {
    const el = inputRef.current
    const start = el?.selectionStart ?? expr.length
    const end = el?.selectionEnd ?? expr.length
    const next = expr.slice(0, start) + text + expr.slice(end)
    setExpr(next)
    setLastError('')
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(start + text.length, start + text.length)
    })
  }

  const press = (value) => {
    if (value === 'eval') return run()
    if (value === 'clear') {
      setExpr('')
      setLastError('')
      return inputRef.current?.focus()
    }
    if (value === 'back') {
      const el = inputRef.current
      const pos = el?.selectionStart ?? expr.length
      if (pos === 0) return
      setExpr(expr.slice(0, pos - 1) + expr.slice(pos))
      requestAnimationFrame(() => {
        el?.focus()
        el?.setSelectionRange(pos - 1, pos - 1)
      })
      return
    }
    insert(value)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="card card-pad">
        <div className="mb-3 flex items-center justify-between">
          <Segmented
            size="sm"
            className="shrink-0"
            ariaLabel="Unité d'angle"
            value={angle}
            onChange={setAngle}
            options={[
              { value: 'deg', label: 'DEG' },
              { value: 'rad', label: 'RAD' },
            ]}
          />
          <span className="hidden font-mono text-[11px] text-zinc-500 sm:inline">Entrée = calculer · Échap = effacer</span>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
          <input
            ref={inputRef}
            className="w-full bg-transparent text-right font-mono text-2xl outline-none"
            value={expr}
            onChange={(e) => {
              setExpr(e.target.value)
              setLastError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                run()
              } else if (e.key === 'Escape') setExpr('')
            }}
            placeholder="0"
            aria-label="Expression"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            inputMode="text"
          />
          <p className="mt-1 min-h-[1.5rem] text-right font-mono text-sm" aria-live="polite">
            {lastError ? (
              <span className="text-red-500">{lastError}</span>
            ) : preview && 'value' in preview ? (
              <span className="text-zinc-500">= {smartNumber(preview.value, 12)}</span>
            ) : null}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-6 gap-1.5">
          {FUNCTION_KEYS.map(([label, value]) => (
            <button
              key={label}
              type="button"
              onClick={() => press(value)}
              className={`rounded-md border border-zinc-200 py-2 font-mono text-xs transition-colors hover:border-orange-500 dark:border-zinc-800 ${keyStyle.default}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {MAIN_KEYS.map(([label, value, style]) => (
            <button
              key={label}
              type="button"
              onClick={() => press(value)}
              aria-label={label === '⌫' ? 'Effacer le dernier caractère' : undefined}
              className={`flex h-12 items-center justify-center rounded-md border border-zinc-200 font-mono text-lg transition-colors hover:border-orange-500 dark:border-zinc-800 sm:h-14 ${
                keyStyle[style ?? 'default']
              }`}
            >
              {label === '⌫' ? <Delete size={18} /> : label}
            </button>
          ))}
        </div>
      </div>

      <aside className="card flex max-h-[600px] flex-col">
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <History size={15} className="text-orange-500" /> Historique
          </h2>
          {history.length > 0 && (
            <button type="button" className="text-zinc-400 hover:text-red-500" onClick={() => setHistory([])} aria-label="Vider l'historique">
              <Trash2 size={15} />
            </button>
          )}
        </div>
        <ul className="flex-1 overflow-y-auto">
          {history.length === 0 && <li className="p-4 text-sm text-zinc-500">Les calculs apparaîtront ici. Cliquez pour les réutiliser.</li>}
          {history.map((h, i) => (
            <li key={`${i}-${h.expr}`} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/60">
              <button type="button" className="w-full px-4 py-2 text-right hover:bg-orange-500/5" onClick={() => insert(String(h.result))}>
                <span className="block truncate font-mono text-xs text-zinc-500">
                  {h.expr} <span className="text-[10px] uppercase">{h.angle}</span>
                </span>
                <span className="font-mono font-semibold">{smartNumber(h.result, 12)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800">
          Fonctions : sin, cos, tan, asin, acos, atan, sinh, cosh, tanh, sqrt, cbrt, ln, log, log2, exp, abs, floor, ceil, round. Constantes : π (pi), e, φ (phi), Ans.
        </div>
      </aside>
    </div>
  )
}

import { useState } from 'react'
import { ArrowLeftRight, Check, Copy } from 'lucide-react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { parseNumber, smartNumber } from '../../../lib/format'
import { QUANTITIES, convert, getQuantity, getUnit } from './units'

const initialState = { quantity: 'longueur', from: 'km', to: 'mi', value: '1' }

export default function UnitConverter() {
  const [state, setState] = useLocalStorage('converter', initialState)
  const [copied, setCopied] = useState(false)

  const quantity = getQuantity(state.quantity)
  const from = getUnit(quantity, state.from)
  const to = getUnit(quantity, state.to)
  const value = parseNumber(state.value)
  const result = Number.isFinite(value) ? convert(quantity.id, value, from.id, to.id) : NaN
  const unitRate = convert(quantity.id, 1, from.id, to.id)

  const selectQuantity = (id) => {
    const q = getQuantity(id)
    setState((s) => ({ ...s, quantity: q.id, from: q.defaults[0], to: q.defaults[1] }))
  }
  const swap = () =>
    setState((s) => ({
      ...s,
      from: s.to,
      to: s.from,
      value: Number.isFinite(result) ? String(parseFloat(result.toPrecision(12))) : s.value,
    }))

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(parseFloat(result.toPrecision(12))))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // presse-papiers indisponible
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <label htmlFor="quantity" className="label">
          Grandeur
        </label>
        <select id="quantity" className="input sm:hidden" value={quantity.id} onChange={(e) => selectQuantity(e.target.value)}>
          {QUANTITIES.map((q) => (
            <option key={q.id} value={q.id}>
              {q.label}
            </option>
          ))}
        </select>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {QUANTITIES.map((q) => (
            <button
              key={q.id}
              type="button"
              onClick={() => selectQuantity(q.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                q.id === quantity.id
                  ? 'border-orange-500 bg-orange-500/10 font-semibold text-orange-600 dark:text-orange-400'
                  : 'border-zinc-200 text-zinc-600 hover:border-orange-500/50 dark:border-zinc-800 dark:text-zinc-400'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card card-pad">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="grid gap-2">
            <label htmlFor="conv-value" className="label">
              Valeur
            </label>
            <input
              id="conv-value"
              className="input font-mono text-lg"
              inputMode="decimal"
              value={state.value}
              onChange={(e) => setState((s) => ({ ...s, value: e.target.value }))}
              autoComplete="off"
            />
            <select className="input" value={from.id} onChange={(e) => setState((s) => ({ ...s, from: e.target.value }))} aria-label="Unité de départ">
              {quantity.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.symbol})
                </option>
              ))}
            </select>
          </div>

          <button type="button" className="btn-icon mx-auto mb-1 rotate-90 md:rotate-0" onClick={swap} aria-label="Inverser les unités" title="Inverser">
            <ArrowLeftRight size={16} />
          </button>

          <div className="grid gap-2">
            <span className="label">Résultat</span>
            <div className="flex items-center gap-2 rounded-lg border border-orange-500/40 bg-orange-500/5 px-3 py-2">
              <output className="min-w-0 flex-1 truncate font-mono text-lg font-semibold text-orange-600 dark:text-orange-400" aria-live="polite">
                {Number.isFinite(result) ? smartNumber(result, 10) : '—'}
              </output>
              <button type="button" onClick={copy} disabled={!Number.isFinite(result)} className="text-zinc-400 hover:text-orange-500" aria-label="Copier le résultat">
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <select className="input" value={to.id} onChange={(e) => setState((s) => ({ ...s, to: e.target.value }))} aria-label="Unité d'arrivée">
              {quantity.units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} ({u.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-4 font-mono text-xs text-zinc-500">
          {state.value.trim() && !Number.isFinite(value) ? (
            <span className="text-red-500">Valeur non numérique.</span>
          ) : from.toBase || to.toBase ? (
            'Conversion non proportionnelle (formule affine ou inverse).'
          ) : (
            <>
              1 {from.symbol} = {smartNumber(unitRate, 10)} {to.symbol}
            </>
          )}
        </p>
      </div>

      {Number.isFinite(value) && (
        <div className="card overflow-hidden">
          <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-sm font-semibold">
              {smartNumber(value, 10)} {from.symbol} dans toutes les unités
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="table-data">
              <tbody>
                {quantity.units.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setState((s) => ({ ...s, to: u.id }))}
                    className={`cursor-pointer ${u.id === to.id ? 'bg-orange-500/5' : ''}`}
                  >
                    <td className="w-full text-zinc-600 dark:text-zinc-400">{u.label}</td>
                    <td className="text-right font-mono">{smartNumber(convert(quantity.id, value, from.id, u.id), 10)}</td>
                    <td className="font-mono text-zinc-500">{u.symbol}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

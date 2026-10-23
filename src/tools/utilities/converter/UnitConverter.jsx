import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeftRight, Atom, Check, Coffee, Cog, Copy, Cpu, FlaskConical, Lightbulb, RefreshCw, Ruler, Search, Thermometer, X, Zap } from 'lucide-react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { parseNumber, smartNumber } from '../../../lib/format'
import { QUANTITIES, UNIT_COUNT, convertWith, getUnit } from './units/index'
import { CURRENCY, currencyQuantity, fetchRates, isFresh, readCachedRates } from './currency'

const FAMILY_ICONS = {
  'Grandeurs courantes': Ruler,
  Mécanique: Cog,
  'Vie courante': Coffee,
  Thermique: Thermometer,
  'Électricité et magnétisme': Zap,
  'Lumière et rayonnements': Lightbulb,
  Chimie: FlaskConical,
  Informatique: Cpu,
}

const ALL = [CURRENCY, ...QUANTITIES]
const GROUPS = [...new Set(ALL.map((q) => q.family))]
  .sort((a, b) => QUANTITIES.findIndex((q) => q.family === a) - QUANTITIES.findIndex((q) => q.family === b))
  .map((family) => ({ family, icon: FAMILY_ICONS[family] ?? Atom, quantities: ALL.filter((q) => q.family === family) }))

const initialState = { quantity: 'longueur', from: 'km', to: 'mi', value: '1' }

const normalize = (s) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/** Recherche dans les noms de grandeurs, puis dans les noms et symboles d'unités. */
function search(query, quantities) {
  const q = normalize(query.trim())
  if (!q) return []
  return quantities
    .map((quantity) => {
      const inLabel = normalize(quantity.label).includes(q)
      const units = quantity.units.filter((u) => normalize(u.label).includes(q) || normalize(u.symbol) === q || u.symbol.toLowerCase().startsWith(q))
      return { quantity, units, score: inLabel ? 0 : units.length ? 1 : 2 }
    })
    .filter((r) => r.score < 2)
    .sort((a, b) => a.score - b.score)
    .slice(0, 12)
}

/** Taux de change : cache local, rafraîchi en ligne quand la grandeur « Devises » est affichée. */
function useRates(enabled) {
  const [state, setState] = useState(() => ({ data: readCachedRates(), error: null, attempt: 0 }))
  useEffect(() => {
    if (!enabled || isFresh(state.data)) return undefined
    let cancelled = false
    fetchRates()
      .then((data) => !cancelled && setState((s) => ({ ...s, data, error: null })))
      .catch((err) => !cancelled && setState((s) => ({ ...s, error: err.message || 'réseau indisponible' })))
    return () => {
      cancelled = true
    }
  }, [enabled, state.data, state.attempt])
  const retry = () => setState((s) => ({ ...s, error: null, attempt: s.attempt + 1 }))
  return { ...state, loading: enabled && !isFresh(state.data) && !state.error, retry }
}

function QuantityButton({ quantity, active, onSelect, hint }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`block w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
        active ? 'bg-accent-400/15 font-semibold text-accent-800 dark:text-accent-300' : 'text-night-700 hover:bg-night-100 dark:text-night-300 dark:hover:bg-night-800/60'
      }`}
    >
      {quantity.label}
      {hint && <span className="block truncate text-xs font-normal text-night-500">{hint}</span>}
    </button>
  )
}

export default function UnitConverter() {
  const [state, setState] = useLocalStorage('converter', initialState)
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)

  // La grandeur affichée peut venir de l'URL (#/utilitaires/convertisseur?g=pression).
  const quantityId = params.get('g') ?? state.quantity
  const rates = useRates(quantityId === CURRENCY.id)
  const currency = useMemo(() => currencyQuantity(rates.data), [rates.data])
  const quantity = quantityId === CURRENCY.id ? currency : (QUANTITIES.find((q) => q.id === quantityId) ?? QUANTITIES[0])
  const same = quantity.id === state.quantity
  const from = getUnit(quantity, same ? state.from : quantity.defaults[0])
  const to = getUnit(quantity, same ? state.to : quantity.defaults[1])
  const ready = Boolean(from && to)

  const value = parseNumber(state.value)
  const result = ready && Number.isFinite(value) ? convertWith(quantity, value, from.id, to.id) : NaN
  const unitRate = ready ? convertWith(quantity, 1, from.id, to.id) : NaN
  const results = useMemo(() => search(query, [currency, ...QUANTITIES]), [query, currency])

  const update = (patch) => setState((s) => ({ ...s, quantity: quantity.id, from: from?.id, to: to?.id, ...patch }))

  const selectQuantity = (q, unit) => {
    const fromId = unit?.id ?? q.defaults[0]
    setState((s) => ({ ...s, quantity: q.id, from: fromId, to: fromId === q.defaults[0] ? q.defaults[1] : q.defaults[0] }))
    setParams(q.id === initialState.quantity ? {} : { g: q.id }, { replace: true })
    setQuery('')
  }

  const swap = () => update({ from: to.id, to: from.id, value: Number.isFinite(result) ? String(parseFloat(result.toPrecision(12))) : state.value })

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(parseFloat(result.toPrecision(12))))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // presse-papiers indisponible
    }
  }

  const unitOptions = ready
    ? quantity.units.map((u) => (
        <option key={u.id} value={u.id}>
          {u.label} ({u.symbol})
        </option>
      ))
    : null

  return (
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="flex flex-col gap-3 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:self-start">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-night-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Grandeur ou unité (psi, nœud…)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher une grandeur ou une unité"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-night-400 hover:text-night-700" aria-label="Effacer">
              <X size={14} />
            </button>
          )}
        </div>
        <p className="text-xs text-night-500">
          {QUANTITIES.length} grandeurs · {UNIT_COUNT} unités · devises
        </p>

        {query ? (
          <div className="card p-1.5">
            {results.length === 0 && <p className="p-2 text-sm text-night-500">Aucun résultat.</p>}
            {results.map(({ quantity: q, units }) => (
              <QuantityButton
                key={q.id}
                quantity={q}
                active={q.id === quantity.id}
                onSelect={() => selectQuantity(q, units[0])}
                hint={units.length ? units.slice(0, 3).map((u) => `${u.label} (${u.symbol})`).join(', ') : q.family}
              />
            ))}
          </div>
        ) : (
          <>
            <select className="input lg:hidden" value={quantity.id} onChange={(e) => selectQuantity(ALL.find((q) => q.id === e.target.value))} aria-label="Grandeur">
              {GROUPS.map((g) => (
                <optgroup key={g.family} label={g.family}>
                  {g.quantities.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <nav className="card hidden min-h-0 flex-1 overflow-y-auto p-2 lg:block" aria-label="Grandeurs">
              {GROUPS.map((g) => (
                <div key={g.family} className="mb-2 last:mb-0">
                  <p className="label mb-0 flex items-center gap-1.5 px-2.5 pt-2">
                    <g.icon size={13} className="text-accent-600" /> {g.family}
                  </p>
                  {g.quantities.map((q) => (
                    <QuantityButton key={q.id} quantity={q} active={q.id === quantity.id} onSelect={() => selectQuantity(q)} />
                  ))}
                </div>
              ))}
            </nav>
          </>
        )}
      </aside>

      <div className="grid min-w-0 content-start gap-6">
        <div className="card card-pad">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">{quantity.label}</h2>
            <span className="text-xs text-night-500">
              {quantity.family} · {quantity.units.length} {quantity.online ? 'devises' : 'unités'}
            </span>
          </div>

          {quantity.online && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-night-100 px-3 py-2 text-xs text-night-600 dark:bg-night-800/60 dark:text-night-300">
              {rates.loading && <span>Chargement des taux de change…</span>}
              {rates.data && !rates.loading && (
                <span>
                  Taux de référence de la BCE du {new Date(`${rates.data.date}T12:00:00`).toLocaleDateString('fr-FR', { dateStyle: 'long' })} (source :
                  Frankfurter). Indicatifs : les banques appliquent une marge.
                </span>
              )}
              {rates.error && (
                <>
                  <span className="text-red-600 dark:text-red-400">
                    Impossible de récupérer les taux ({rates.error}){rates.data ? ' : derniers taux connus affichés.' : '.'}
                  </span>
                  <button type="button" className="btn py-0.5 text-xs" onClick={rates.retry}>
                    <RefreshCw size={12} /> Réessayer
                  </button>
                </>
              )}
            </div>
          )}

          {ready && (
            <>
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
                    onChange={(e) => update({ value: e.target.value })}
                    autoComplete="off"
                  />
                  <select className="input" value={from.id} onChange={(e) => update({ from: e.target.value })} aria-label="Unité de départ">
                    {unitOptions}
                  </select>
                </div>

                <button type="button" className="btn-icon mx-auto mb-1 rotate-90 md:rotate-0" onClick={swap} aria-label="Inverser les unités" title="Inverser">
                  <ArrowLeftRight size={16} />
                </button>

                <div className="grid gap-2">
                  <span className="label">Résultat</span>
                  <div className="flex items-center gap-2 rounded-lg border border-accent-500/40 bg-accent-400/10 px-3 py-2">
                    <output className="min-w-0 flex-1 truncate font-mono text-lg font-semibold text-accent-800 dark:text-accent-300" aria-live="polite">
                      {Number.isFinite(result) ? smartNumber(result, 10) : '—'}
                    </output>
                    <button type="button" onClick={copy} disabled={!Number.isFinite(result)} className="text-night-400 hover:text-accent-600" aria-label="Copier le résultat">
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <select className="input" value={to.id} onChange={(e) => update({ to: e.target.value })} aria-label="Unité d'arrivée">
                    {unitOptions}
                  </select>
                </div>
              </div>
              <p className="mt-4 font-mono text-xs text-night-500">
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
            </>
          )}
        </div>

        {ready && Number.isFinite(value) && (
          <div className="card overflow-hidden">
            <div className="border-b border-night-200 px-4 py-3 dark:border-night-800">
              <h2 className="text-sm font-semibold">
                {smartNumber(value, 10)} {from.symbol} dans toutes les unités
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table-data">
                <tbody>
                  {quantity.units.map((u) => (
                    <tr key={u.id} onClick={() => update({ to: u.id })} className={`cursor-pointer ${u.id === to.id ? 'bg-accent-400/10' : ''}`}>
                      <td className="w-full text-night-600 dark:text-night-400">{u.label}</td>
                      <td className="text-right font-mono">{smartNumber(convertWith(quantity, value, from.id, u.id), 10)}</td>
                      <td className="font-mono text-night-500">{u.symbol}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

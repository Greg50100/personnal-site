import { useState } from 'react'
import { CONNECTORS, FAMILIES, KINDS, searchText } from './data/connectors'
import ConnectorFace from './ConnectorFace'
import { KIND_STYLE } from './kinds'
import { Links, SearchField } from '../materiel/ui'
import { useLocalStorage } from '../../../hooks/useLocalStorage'

const DEFAULT_COLUMNS = [
  { key: 'signal', label: 'Signal' },
  { key: 'role', label: 'Rôle' },
]

/** Colonnes du tableau : celles du connecteur, ou Signal / Rôle (+ Couleur si des fils ont une couleur conventionnelle). */
function columnsOf(c) {
  if (c.columns) return c.columns
  return c.pins.some((x) => x.color) ? [...DEFAULT_COLUMNS, { key: 'color', label: 'Couleur' }] : DEFAULT_COLUMNS
}

function KindDot({ kind }) {
  const k = KIND_STYLE[kind] ?? KIND_STYLE.nc
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${k.bg}`} title={KINDS[kind]} aria-hidden="true" />
}

function PinTable({ connector, active, onPick }) {
  const cols = columnsOf(connector)
  return (
    <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
      <table className="table-data">
        <thead>
          <tr>
            <th>Broche</th>
            {cols.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {connector.pins.map((pin) => (
            <tr key={pin.n} onMouseEnter={() => onPick(pin.n)} className={String(active) === String(pin.n) ? 'bg-accent-400/15' : undefined}>
              <td className="font-mono font-semibold">
                <span className="inline-flex items-center gap-2">
                  <KindDot kind={pin.kind} />
                  {pin.n}
                </span>
              </td>
              {cols.map((c) => (
                <td key={c.key} className={`${c.key === 'signal' ? 'font-mono' : ''} ${c.key === 'role' ? 'min-w-[12rem] !whitespace-normal' : ''}`}>
                  {pin[c.key] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Legend({ connector }) {
  const kinds = [...new Set(connector.pins.map((x) => x.kind))]
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-night-600 dark:text-night-400" aria-label="Nature des broches">
      {Object.keys(KINDS)
        .filter((k) => kinds.includes(k))
        .map((k) => (
          <li key={k} className="inline-flex items-center gap-1.5">
            <KindDot kind={k} />
            {KINDS[k]}
          </li>
        ))}
    </ul>
  )
}

export default function Connectors() {
  const [id, setId] = useLocalStorage('references-connecteur', 'usb-c')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)
  const connector = CONNECTORS.find((c) => c.id === id) ?? CONNECTORS[0]
  const q = query.trim().toLowerCase()
  const list = CONNECTORS.filter((c) => !q || searchText(c).includes(q))
  const choose = (next) => {
    setId(next)
    setActive(null)
  }
  const activePin = connector.pins.find((x) => String(x.n) === String(active))

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="card card-pad h-fit space-y-3 lg:sticky lg:top-20">
        <SearchField value={query} onChange={setQuery} placeholder="Connecteur ou signal (CC1, PoE…)" />
        <select className="input lg:hidden" value={connector.id} onChange={(e) => choose(e.target.value)} aria-label="Connecteur">
          {FAMILIES.map((f) => (
            <optgroup key={f.id} label={f.label}>
              {list
                .filter((c) => c.family === f.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <nav className="hidden max-h-[70vh] space-y-3 overflow-y-auto pr-1 lg:block" aria-label="Connecteurs">
          {FAMILIES.filter((f) => list.some((c) => c.family === f.id)).map((f) => (
            <div key={f.id}>
              <p className="label">{f.label}</p>
              <ul className="space-y-0.5">
                {list
                  .filter((c) => c.family === f.id)
                  .map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => choose(c.id)}
                        aria-current={c.id === connector.id ? 'true' : undefined}
                        className={`w-full rounded-lg px-2 py-1 text-left text-sm transition-colors ${
                          c.id === connector.id ? 'bg-accent-400/15 font-medium text-night-900 dark:text-night-50' : 'text-night-700 hover:bg-night-100 dark:text-night-300 dark:hover:bg-night-800'
                        }`}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {!list.length && <p className="text-sm text-night-500">Aucun connecteur ne correspond.</p>}
        </nav>
      </aside>

      <article className="min-w-0 space-y-4">
        <header className="card card-pad space-y-2">
          <h2 className="font-display text-xl font-semibold text-night-900 dark:text-night-50">{connector.name}</h2>
          {connector.aka?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {connector.aka.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          )}
        </header>

        <section className="card card-pad space-y-3">
          <ConnectorFace connector={connector} active={active} onPick={setActive} />
          <Legend connector={connector} />
          <p className="min-h-[1.5rem] text-sm text-night-700 dark:text-night-300" aria-live="polite">
            {activePin ? (
              <>
                <span className="font-mono font-semibold">{activePin.n}</span> · <span className="font-mono">{activePin.signal}</span> : {activePin.role}
                {activePin.color && <> · fil {activePin.color}</>}
              </>
            ) : (
              <span className="text-night-500">Survolez une broche ou une ligne du tableau.</span>
            )}
          </p>
          <PinTable connector={connector} active={active} onPick={setActive} />
        </section>

        {connector.notes?.length > 0 && (
          <section className="card card-pad space-y-2">
            <h3 className="label">À savoir</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-night-700 dark:text-night-300">
              {connector.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="card card-pad space-y-2">
          <h3 className="label">Sources</h3>
          <Links links={connector.sources} />
        </section>
      </article>
    </div>
  )
}

import { useState } from 'react'
import { COMPONENTS, GROUPS, PACKAGES, PIN_KINDS, searchText } from './data/components'
import ComponentPackage from './ComponentPackage'
import { KIND_STYLE } from './kinds'
import { Links, SearchField, SpecList } from '../materiel/ui'
import { useLocalStorage } from '../../hooks/useLocalStorage'

function KindDot({ kind }) {
  const k = KIND_STYLE[kind] ?? KIND_STYLE.nc
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${k.bg}`} title={PIN_KINDS[kind]} aria-hidden="true" />
}

function PinTable({ component, active, onPick }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
      <table className="table-data">
        <thead>
          <tr>
            <th>Broche</th>
            <th>Nom</th>
            <th>Rôle</th>
          </tr>
        </thead>
        <tbody>
          {component.pins.map(([n, name, role, kind]) => (
            <tr key={n} onMouseEnter={() => onPick(n)} className={active === n ? 'bg-accent-400/15' : undefined}>
              <td className="font-mono font-semibold">
                <span className="inline-flex items-center gap-2">
                  <KindDot kind={kind} />
                  {n}
                </span>
              </td>
              <td className="font-mono">{name}</td>
              <td className="min-w-[12rem] !whitespace-normal">{role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Components() {
  const [id, setId] = useLocalStorage('references-composant', '2n2222a')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)
  const component = COMPONENTS.find((c) => c.id === id) ?? COMPONENTS[0]
  const q = query.trim().toLowerCase()
  const list = COMPONENTS.filter((c) => !q || searchText(c).includes(q))
  const choose = (next) => {
    setId(next)
    setActive(null)
  }
  const kinds = [...new Set(component.pins.map((p) => p[3]))]

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
      <aside className="card card-pad h-fit space-y-3 lg:sticky lg:top-20">
        <SearchField value={query} onChange={setQuery} placeholder="Référence ou broche (TL431, SDA…)" />
        <select className="input lg:hidden" value={component.id} onChange={(e) => choose(e.target.value)} aria-label="Composant">
          {GROUPS.map((g) => (
            <optgroup key={g.id} label={g.label}>
              {list
                .filter((c) => c.group === g.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <nav className="hidden max-h-[70vh] space-y-3 overflow-y-auto pr-1 lg:block" aria-label="Composants">
          {GROUPS.filter((g) => list.some((c) => c.group === g.id)).map((g) => (
            <div key={g.id}>
              <p className="label">{g.label}</p>
              <ul className="space-y-0.5">
                {list
                  .filter((c) => c.group === g.id)
                  .map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => choose(c.id)}
                        aria-current={c.id === component.id ? 'true' : undefined}
                        className={`w-full rounded-lg px-2 py-1 text-left text-sm transition-colors ${
                          c.id === component.id ? 'bg-accent-400/15 font-medium text-night-900 dark:text-night-50' : 'text-night-700 hover:bg-night-100 dark:text-night-300 dark:hover:bg-night-800'
                        }`}
                      >
                        {c.name}
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {!list.length && <p className="text-sm text-night-500">Aucun composant ne correspond.</p>}
        </nav>
      </aside>

      <article className="min-w-0 space-y-4">
        <header className="card card-pad space-y-2">
          <h2 className="font-display text-xl font-semibold text-night-900 dark:text-night-50">{component.name}</h2>
          {component.aka?.length > 0 && (
            <p className="flex flex-wrap items-center gap-1 text-sm text-night-600 dark:text-night-400">
              <span className="mr-1">Voir aussi :</span>
              {component.aka.map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </p>
          )}
        </header>

        <section className="card card-pad grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <ComponentPackage component={component} caption={PACKAGES[component.package].caption} active={active} onPick={setActive} />
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-night-600 dark:text-night-400" aria-label="Nature des broches">
              {Object.keys(PIN_KINDS)
                .filter((k) => kinds.includes(k))
                .map((k) => (
                  <li key={k} className="inline-flex items-center gap-1.5">
                    <KindDot kind={k} />
                    {PIN_KINDS[k]}
                  </li>
                ))}
            </ul>
          </div>
          <div className="min-w-0 space-y-4">
            <PinTable component={component} active={active} onPick={setActive} />
            <SpecList rows={component.specs} />
          </div>
        </section>

        {component.notes?.length > 0 && (
          <section className="card card-pad space-y-2">
            <h3 className="label">À savoir</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-night-700 dark:text-night-300">
              {component.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        )}

        <section className="card card-pad space-y-2">
          <h3 className="label">Sources</h3>
          <Links links={component.sources} />
          <p className="text-xs text-night-500">Brochages recoupés avec la bibliothèque de symboles KiCad. Un même nom peut cacher plusieurs brochages selon le fabricant : en cas de doute, la fiche technique fait foi.</p>
        </section>
      </article>
    </div>
  )
}

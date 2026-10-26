import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { DOMAINS, RUBRIQUES, TOOLS, searchTools, toolsOf } from '../registry'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SectionTitle from '../components/SectionTitle'
import ToolCard from '../components/ToolCard'

export default function ToolsIndex() {
  useDocumentTitle('Tous les outils')
  const [query, setQuery] = useState('')
  const found = useMemo(() => (query.trim() ? searchTools(query) : null), [query])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle kicker="Catalogue" title="Tous les outils">
        {TOOLS.length} outils répartis en {DOMAINS.length} espaces et {RUBRIQUES.length} rubriques. Tous fonctionnent directement dans le navigateur, sans compte ni
        installation.
      </SectionTitle>

      <div className="relative mb-8 max-w-xl">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-night-400" />
        <input
          type="search"
          className="input py-3 pl-9 text-base"
          placeholder="Rechercher (ex. « lune », « résistance », « IMC »)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un outil"
        />
      </div>

      {found ? (
        found.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {found.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-night-500">Aucun outil ne correspond à « {query} ».</p>
        )
      ) : (
        DOMAINS.map((d) => (
          <section key={d.id} className="mb-12" aria-labelledby={`espace-${d.id}`}>
            <h2 id={`espace-${d.id}`} className="mb-4 flex items-center gap-2 text-2xl font-bold">
              <d.icon size={22} className="text-accent-600" /> {d.label}
            </h2>
            {d.rubriques.map((r) => (
              <div key={r.id} className="mb-6">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-night-500">{r.label}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {toolsOf(r.id).map((tool) => (
                    <ToolCard key={tool.id} tool={tool} compact />
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { CATEGORIES, TOOLS, searchTools } from '../tools/registry'
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
        {TOOLS.length} outils répartis en {CATEGORIES.length} rubriques. Tous fonctionnent directement dans le navigateur, sans compte ni
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
        CATEGORIES.map((cat) => (
          <section key={cat.id} className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <cat.icon size={18} className="text-accent-600" /> {cat.label}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {TOOLS.filter((t) => t.category === cat.id).map((tool) => (
                <ToolCard key={tool.id} tool={tool} compact />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { CATEGORIES, TOOLS } from '../tools/registry'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SectionTitle from '../components/SectionTitle'
import Segmented from '../components/Segmented'
import ToolCard from '../components/ToolCard'

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export default function ToolsIndex() {
  useDocumentTitle('Outils')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return TOOLS.filter(
      (t) =>
        (category === 'all' || t.category === category) &&
        (!q || normalize([t.title, t.summary, ...(t.tags ?? [])].join(' ')).includes(q)),
    )
  }, [query, category])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle kicker="Catalogue" title="Tous les outils">
        {TOOLS.length} outils répartis en {CATEGORIES.length} rubriques. Tous fonctionnent directement dans le navigateur, sans compte ni
        installation.
      </SectionTitle>

      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            className="input pl-9"
            placeholder="Rechercher un outil (ex. « lune », « hexa »)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Rechercher un outil"
          />
        </div>
        <Segmented
          ariaLabel="Filtrer par rubrique"
          value={category}
          onChange={setCategory}
          options={[{ value: 'all', label: 'Tout' }, ...CATEGORIES.map((c) => ({ value: c.id, label: c.label }))]}
        />
      </div>

      {CATEGORIES.filter((c) => category === 'all' || c.id === category).map((cat) => {
        const tools = filtered.filter((t) => t.category === cat.id)
        if (!tools.length) return null
        return (
          <section key={cat.id} className="mb-10">
            <h2 className="mb-4 flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-zinc-500">
              <cat.icon size={16} className="text-orange-500" /> {cat.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        )
      })}
      {!filtered.length && <p className="py-12 text-center text-zinc-500">Aucun outil ne correspond à « {query} ».</p>}
    </div>
  )
}

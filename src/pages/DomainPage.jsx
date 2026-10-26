import { useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { LEGACY_CATEGORIES, getDomain, searchTools, toolsOf, toolsOfDomain } from '../registry'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import ToolCard from '../components/ToolCard'
import NotFound from './NotFound'

/** Pastille de filtre par rubrique. */
function RubriqueChip({ active, onClick, icon: Icon, label, count }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`chip cursor-pointer gap-1.5 px-3 py-1.5 text-sm transition-colors ${
        active ? 'border-accent-400 bg-accent-400/15 text-accent-800 dark:text-accent-200' : 'hover:border-accent-400'
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
      <span className="text-xs text-night-500">{count}</span>
    </button>
  )
}

/**
 * PAGE D'UN ESPACE
 * Rubriques de l'espace (filtre par ?rubrique=…), recherche limitée à l'espace et cartes des outils.
 * Les anciennes pages de rubrique (#/materiel, #/maths…) renvoient ici.
 */
export default function DomainPage() {
  const { domain: domainId } = useParams()
  const domain = getDomain(domainId)
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  useDocumentTitle(domain?.label)
  const found = useMemo(() => (domain && query.trim() ? searchTools(query, { domain: domain.id }) : null), [domain, query])

  if (!domain) {
    const legacy = LEGACY_CATEGORIES[domainId]
    if (legacy) return <Navigate to={`/${legacy.domain}${legacy.rubrique ? `?rubrique=${legacy.rubrique}` : ''}`} replace />
    return <NotFound />
  }

  const selected = domain.rubriques.find((r) => r.id === params.get('rubrique'))
  const shown = selected ? [selected] : domain.rubriques
  const select = (id) => setParams(id ? { rubrique: id } : {}, { replace: true })
  const total = toolsOfDomain(domain.id).length

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-6 flex items-start gap-4">
        <span className="hidden rounded-2xl bg-accent-400/15 p-3 text-accent-700 dark:text-accent-300 sm:block">
          <domain.icon size={28} />
        </span>
        <div>
          <p className="mb-1 text-sm font-medium text-accent-700 dark:text-accent-400">
            {total} outils · {domain.rubriques.length} rubriques
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{domain.label}</h1>
          <p className="mt-2 max-w-3xl text-night-600 dark:text-night-400">{domain.description}</p>
        </div>
      </header>

      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-night-400" />
          <input
            type="search"
            className="input py-2.5 pl-9"
            placeholder={`Rechercher dans ${domain.label}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={`Rechercher un outil dans ${domain.label}`}
          />
        </div>
        {!found && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Rubriques">
            <RubriqueChip active={!selected} onClick={() => select(null)} label="Tout" count={total} />
            {domain.rubriques.map((r) => (
              <RubriqueChip key={r.id} active={selected?.id === r.id} onClick={() => select(selected?.id === r.id ? null : r.id)} icon={r.icon} label={r.label} count={toolsOf(r.id).length} />
            ))}
          </div>
        )}
      </div>

      {found ? (
        found.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {found.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-night-500">Aucun outil de {domain.label} ne correspond à « {query} ».</p>
        )
      ) : (
        <div className="space-y-12">
          {shown.map((r) => (
            <section key={r.id} aria-labelledby={`rubrique-${r.id}`}>
              <div className="mb-4">
                <h2 id={`rubrique-${r.id}`} className="flex items-center gap-2 text-xl font-semibold">
                  <r.icon size={20} className="text-accent-600" /> {r.label}
                </h2>
                <p className="mt-1 max-w-3xl text-sm text-night-600 dark:text-night-400">{r.description}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {toolsOf(r.id).map((tool) => (
                  <ToolCard key={tool.id} tool={tool} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

import { Suspense } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Github } from 'lucide-react'
import { getCategory, getTool } from '../tools/registry'
import { SITE } from '../config/site'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import ErrorBoundary from '../components/ErrorBoundary'
import Loader from '../components/Loader'
import StatusBadge from '../components/StatusBadge'
import NotFound from './NotFound'

export default function ToolPage() {
  const { category: categoryId, toolId } = useParams()
  const tool = getTool(categoryId, toolId)
  const category = getCategory(categoryId)
  useDocumentTitle(tool?.title)

  if (!tool || !category) return <NotFound />

  const Icon = tool.icon
  const Tool = tool.component

  return (
    <div className={`mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${tool.wide ? 'max-w-[1600px]' : 'max-w-5xl'}`}>
      <nav aria-label="Fil d'Ariane" className="mb-4 flex flex-wrap items-center gap-1 text-sm text-night-500">
        <Link to="/outils" className="hover:text-accent-600">
          Outils
        </Link>
        <ChevronRight size={12} />
        <Link to={`/${category.id}`} className="hover:text-accent-600">
          {category.label}
        </Link>
      </nav>

      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-1 hidden rounded-xl bg-accent-400/15 p-2.5 text-accent-700 dark:text-accent-300 sm:block">
            <Icon size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tool.title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-night-600 dark:text-night-400">{tool.summary}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={tool.status} />
          {tool.repo && (
            <a href={`${SITE.github}/${tool.repo}`} target="_blank" rel="noreferrer" className="chip hover:border-accent-500" title="Projet d'origine">
              <Github size={11} /> {tool.repo}
            </a>
          )}
        </div>
      </header>

      <ErrorBoundary key={tool.id}>
        <Suspense fallback={<Loader />}>
          <Tool />
        </Suspense>
      </ErrorBoundary>
    </div>
  )
}

import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { SITE } from '../config/site'
import { CATEGORIES, TOOLS, toolPath, toolsOf } from '../registry'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SectionTitle from '../components/SectionTitle'
import ToolCard from '../components/ToolCard'
import Loader from '../components/Loader'
import ErrorBoundary from '../components/ErrorBoundary'

// Chargé à part : le moteur astronomique ne pèse pas sur le premier affichage.
const TonightWidget = lazy(() => import('../domains/astronomie/tonight/TonightWidget.jsx'))

// La palette de recherche est gérée par l'en-tête, qui écoute cet événement.
const openSearch = () => window.dispatchEvent(new Event('open-search'))

export default function Home() {
  useDocumentTitle()
  const featured = TOOLS.filter((t) => t.featured)

  return (
    <>
      <section className="relative overflow-hidden bg-night-950 text-white">
        <div className="bg-stars absolute inset-0 opacity-70" />
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent-400/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:px-8 lg:py-20">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Calculez, convertissez,
              <br />
              <span className="text-accent-400">observez le ciel.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-night-200">{SITE.description}</p>
            <button
              type="button"
              onClick={openSearch}
              className="mt-8 flex w-full max-w-lg items-center gap-3 rounded-2xl border border-night-700 bg-night-900/80 px-4 py-3.5 text-left text-night-300 shadow-lg transition-colors hover:border-accent-400"
            >
              <Search size={18} className="text-accent-400" />
              <span className="flex-1">Rechercher parmi {TOOLS.length} outils…</span>
              <kbd className="hidden rounded border border-night-600 px-1.5 font-mono text-[11px] sm:block">Ctrl K</kbd>
            </button>
            <div className="mt-4 flex flex-wrap gap-2">
              {featured.slice(0, 6).map((t) => (
                <Link key={t.id} to={toolPath(t)} className="rounded-full border border-night-700 px-3 py-1 text-sm text-night-200 transition-colors hover:border-accent-400 hover:text-white">
                  {t.title}
                </Link>
              ))}
            </div>
          </div>
          <ErrorBoundary>
            <Suspense fallback={<div className="card"><Loader label="Calcul du ciel…" /></div>}>
              <div className="text-night-900 dark:text-night-100">
                <TonightWidget />
              </div>
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="pt-14">
          <SectionTitle kicker="Rubriques" title="Tous les outils, par thème" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((cat) => {
              const tools = toolsOf(cat.id)
              return (
                <Link key={cat.id} to={`/${cat.id}`} className="card group flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-accent-400/70">
                  <div className="flex items-center justify-between">
                    <span className="rounded-xl bg-accent-400/15 p-2.5 text-accent-700 transition-colors group-hover:bg-accent-400 group-hover:text-night-950 dark:text-accent-300">
                      <cat.icon size={22} />
                    </span>
                    <span className="chip">{tools.length} outil{tools.length > 1 ? 's' : ''}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{cat.label}</h3>
                  <p className="mt-1 flex-1 text-sm text-night-600 dark:text-night-400">{cat.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent-700 dark:text-accent-400">
                    Voir la rubrique <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        <section className="pt-14">
          <SectionTitle kicker="Les plus utilisés" title="Outils à la une" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {featured.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

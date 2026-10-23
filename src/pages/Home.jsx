import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, Github } from 'lucide-react'
import { SITE } from '../config/site'
import { CATEGORIES, toolsOf } from '../tools/registry'
import { PROJECTS } from '../data/projects'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SectionTitle from '../components/SectionTitle'
import ToolCard from '../components/ToolCard'
import Loader from '../components/Loader'
import ErrorBoundary from '../components/ErrorBoundary'
import { ProjectCard } from './Projects'

// Chargé à part : le moteur astronomique ne pèse pas sur le premier affichage.
const TonightWidget = lazy(() => import('../tools/astronomy/tonight/TonightWidget.jsx'))

export default function Home() {
  useDocumentTitle()
  const activeProjects = PROJECTS.filter((p) => p.status === 'actif' || p.status === 'prototype').slice(0, 3)

  return (
    <>
      <section className="bg-grid relative overflow-hidden border-b border-zinc-200 dark:border-zinc-900">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-8 lg:py-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded border border-orange-500/40 bg-orange-500/10 px-3 py-1 font-mono text-xs text-orange-600 dark:text-orange-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" /> SYSTEM_STATUS: ONLINE
            </p>
            <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl lg:text-6xl">
              Codeur et maker
              <span className="animate-blink text-orange-500">_</span>
              <br />
              <span className="bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">autodidacte</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-light text-zinc-600 dark:text-zinc-400">{SITE.description}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/outils" className="btn-primary px-6 py-3 text-base">
                Accéder aux outils <ChevronRight size={18} />
              </Link>
              <a href={SITE.github} target="_blank" rel="noreferrer" className="btn px-6 py-3 text-base">
                <Github size={18} /> GitHub
              </a>
            </div>
          </div>
          <ErrorBoundary>
            <Suspense fallback={<div className="card"><Loader label="Calcul du ciel…" /></div>}>
              <TonightWidget />
            </Suspense>
          </ErrorBoundary>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {CATEGORIES.map((cat) => (
          <section key={cat.id} className="pt-14">
            <SectionTitle
              kicker={cat.label}
              title={cat.label}
              action={
                <Link to={`/${cat.id}`} className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-orange-500">
                  Voir la rubrique <ArrowRight size={12} />
                </Link>
              }
            >
              {cat.description}
            </SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-5">
              {toolsOf(cat.id).map((tool) => (
                <ToolCard key={tool.id} tool={tool} mobileCompact />
              ))}
            </div>
          </section>
        ))}

        <section className="pt-16">
          <SectionTitle
            kicker="En cours"
            title="Projets actifs"
            action={
              <Link to="/projets" className="inline-flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-orange-500">
                Tous les projets <ArrowRight size={12} />
              </Link>
            }
          >
            Les dépôts sur lesquels je travaille en ce moment.
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            {activeProjects.map((p) => (
              <ProjectCard key={p.repo} project={p} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}

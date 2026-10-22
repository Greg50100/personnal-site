import { Link } from 'react-router-dom'
import { ExternalLink, FolderGit2 } from 'lucide-react'
import { PROJECTS, PROJECT_STATUS } from '../data/projects'
import { SITE } from '../config/site'
import { TOOLS, toolPath } from '../tools/registry'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SectionTitle from '../components/SectionTitle'

export function ProjectCard({ project }) {
  const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.prototype
  const tools = TOOLS.filter((t) => project.tools?.includes(t.id))
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <FolderGit2 size={18} className="text-orange-500" />
          {project.title}
        </h3>
        <span className={`chip bg-transparent dark:bg-transparent ${status.className}`}>{status.label}</span>
      </div>
      <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">{project.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {project.tech.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
      {tools.length > 0 && (
        <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
          <p className="label">Sur ce site</p>
          <div className="flex flex-wrap gap-2">
            {tools.map((t) => (
              <Link key={t.id} to={toolPath(t)} className="text-xs font-medium text-orange-600 hover:underline dark:text-orange-400">
                {t.title}
              </Link>
            ))}
          </div>
        </div>
      )}
      <a
        href={`${SITE.github}/${project.repo}`}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500 hover:text-orange-500"
      >
        <ExternalLink size={12} /> github.com/{project.repo}
      </a>
    </article>
  )
}

export default function Projects() {
  useDocumentTitle('Projets')
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle kicker="Dépôts GitHub" title="Projets">
        Mes applications et bibliothèques, terminées ou en cours. Quand un projet a une version web, elle est intégrée directement dans
        les outils du site.
      </SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p) => (
          <ProjectCard key={p.repo} project={p} />
        ))}
      </div>
    </div>
  )
}

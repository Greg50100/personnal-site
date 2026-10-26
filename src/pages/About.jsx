import { Link } from 'react-router-dom'
import { ExternalLink, FolderGit2 } from 'lucide-react'
import { PROJECTS, PROJECT_STATUS } from '../data/projects'
import { SITE } from '../config/site'
import { CATEGORIES, TOOLS, toolPath, toolsOf } from '../registry'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import SectionTitle from '../components/SectionTitle'

function ProjectCard({ project }) {
  const status = PROJECT_STATUS[project.status] ?? PROJECT_STATUS.prototype
  const tools = TOOLS.filter((t) => project.tools?.includes(t.id))
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold">
          <FolderGit2 size={17} className="text-accent-600" />
          {project.title}
        </h3>
        <span className={`chip bg-transparent dark:bg-transparent ${status.className}`}>{status.label}</span>
      </div>
      <p className="flex-1 text-sm text-night-600 dark:text-night-400">{project.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {project.tech.map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
      {tools.length > 0 && (
        <p className="mt-3 text-xs text-night-500">
          Sur le site :{' '}
          {tools.map((t, i) => (
            <span key={t.id}>
              {i > 0 && ', '}
              <Link to={toolPath(t)} className="text-accent-700 hover:underline dark:text-accent-400">
                {t.title}
              </Link>
            </span>
          ))}
        </p>
      )}
      {project.private ? (
        <p className="mt-3 text-xs text-night-500">Dépôt privé</p>
      ) : (
        <a
          href={`${SITE.github}/${project.repo}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-xs text-night-500 hover:text-accent-600"
        >
          <ExternalLink size={12} /> github.com/{project.repo}
        </a>
      )}
    </article>
  )
}

export default function About() {
  useDocumentTitle('À propos')
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <SectionTitle kicker="À propos" title={`Qu'est-ce que ${SITE.name} ?`} />
      <div className="max-w-3xl space-y-4 text-night-700 dark:text-night-300">
        <p>
          {SITE.name} rassemble {TOOLS.length} outils de calcul et d'observation du ciel, gratuits et sans inscription. Tout est calculé
          directement dans votre navigateur : aucune donnée n'est envoyée à un serveur. Seuls les orbites de satellites et les taux de
          change sont téléchargés depuis des sources publiques.
        </p>
        <p>
          Le site est la version web de l'application Android du même nom. Il réunit aussi des outils issus d'autres projets d'astronomie
          et de conversion d'unités. Les calculs astronomiques s'appuient sur des théories planétaires reconnues (VSOP87, ELP), avec une
          précision de l'ordre de la minute d'arc : ils conviennent à l'observation et à la curiosité, pas à la navigation.
        </p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={`/${c.id}`} className="inline-flex items-center gap-2 hover:text-accent-700 dark:hover:text-accent-300">
                <c.icon size={15} className="text-accent-600" /> {c.label} ({toolsOf(c.id).length})
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <section className="mt-14">
        <SectionTitle kicker="Projets liés" title="Les projets à l'origine du site">
          Applications et bibliothèques open source dont proviennent certains outils.
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.filter((p) => p.status !== 'archive').map((p) => (
            <ProjectCard key={p.repo} project={p} />
          ))}
        </div>
      </section>

      <section className="mt-14">
        <SectionTitle kicker="Archives" title="Projets intégrés au site">
          Anciens dépôts dont les outils ont été repris ici. Ils restent consultables en lecture seule.
        </SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.filter((p) => p.status === 'archive').map((p) => (
            <ProjectCard key={p.repo} project={p} />
          ))}
        </div>
      </section>
    </div>
  )
}

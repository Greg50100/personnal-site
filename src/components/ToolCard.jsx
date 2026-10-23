import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { toolPath } from '../tools/registry'
import StatusBadge from './StatusBadge'

/** Carte d'un outil. `mobileCompact` masque le résumé sur petit écran (grilles denses de l'accueil). */
export default function ToolCard({ tool, mobileCompact = false }) {
  const Icon = tool.icon
  const desktopOnly = mobileCompact ? 'hidden sm:flex' : 'flex'
  return (
    <Link
      to={toolPath(tool)}
      className="card group relative flex h-full flex-col p-4 transition-all hover:-translate-y-0.5 hover:border-orange-500/60 sm:p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-orange-600 transition-colors group-hover:border-orange-500/50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-orange-400">
          <Icon size={20} />
        </span>
        <StatusBadge status={tool.status} />
      </div>
      <h3 className="font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{tool.title}</h3>
      <p className={`mt-1.5 flex-1 text-sm text-zinc-600 dark:text-zinc-400 ${mobileCompact ? 'hidden sm:block' : ''}`}>{tool.summary}</p>
      <span
        className={`${desktopOnly} mt-3 items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-zinc-500 transition-colors group-hover:text-orange-500`}
      >
        Ouvrir <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

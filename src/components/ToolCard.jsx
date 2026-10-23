import { Link } from 'react-router-dom'
import { toolPath } from '../tools/registry'
import StatusBadge from './StatusBadge'

/** Carte d'un outil. `compact` : icône + titre seulement (grilles denses). */
export default function ToolCard({ tool, compact = false }) {
  const Icon = tool.icon
  return (
    <Link
      to={toolPath(tool)}
      className={`card group flex h-full gap-3 transition-all hover:-translate-y-0.5 hover:border-accent-400/70 ${compact ? 'items-center p-3' : 'flex-col p-4 sm:p-5'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-xl bg-accent-400/15 p-2 text-accent-700 transition-colors group-hover:bg-accent-400 group-hover:text-night-950 dark:text-accent-300">
          <Icon size={compact ? 18 : 20} />
        </span>
        {!compact && <StatusBadge status={tool.status} />}
      </div>
      <div className="min-w-0">
        <h3 className={`font-semibold leading-snug text-night-900 dark:text-night-50 ${compact ? 'text-sm' : ''}`}>{tool.title}</h3>
        {!compact && <p className="mt-1 text-sm text-night-600 dark:text-night-400">{tool.summary}</p>}
      </div>
    </Link>
  )
}

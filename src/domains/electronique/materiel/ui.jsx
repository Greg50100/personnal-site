import { ExternalLink } from 'lucide-react'

/** Bouton-filtre en forme de pastille, actif ou non. */
export function ToggleChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`chip cursor-pointer px-2.5 py-1 text-xs transition-colors ${
        active ? 'border-accent-400 bg-accent-400/15 text-accent-800 dark:text-accent-200' : 'hover:border-accent-400'
      }`}
    >
      {children}
    </button>
  )
}

/** Niveau logique : 3,3 V ou 5 V (texte + couleur, jamais la couleur seule). */
export function LogicBadge({ volts }) {
  const five = volts === 5
  return (
    <span className={`chip ${five ? 'border-sky-500/40 text-sky-700 dark:text-sky-300' : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'}`}>
      Logique {five ? '5 V' : '3,3 V'}
    </span>
  )
}

/** Liste de caractéristiques « libellé : valeur ». */
export function SpecList({ rows, className = '' }) {
  return (
    <dl className={`grid content-start gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[max-content_1fr] ${className}`}>
      {rows
        .filter(([, v]) => v != null && v !== '')
        .map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-night-500 dark:text-night-400">{k}</dt>
            <dd className="min-w-0 text-night-800 dark:text-night-100">{v}</dd>
          </div>
        ))}
    </dl>
  )
}

/** Liens vers les fiches techniques et la documentation. */
export function Links({ links }) {
  if (!links?.length) return null
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {links.map((l) => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-accent-700 hover:underline dark:text-accent-300">
            <ExternalLink size={12} className="shrink-0" />
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

/** Champ de recherche compact. */
export function SearchField({ value, onChange, placeholder }) {
  return (
    <input
      type="search"
      className="input max-w-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  )
}

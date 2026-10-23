/** Carte de données : titre avec icône et lignes « libellé — valeur ». */
export function InfoCard({ title, icon: Icon, children, className = '', aside }) {
  return (
    <section className={`card card-pad ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display font-semibold">
          {Icon && <Icon size={17} className="text-accent-600 dark:text-accent-400" />}
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Row({ label, value, sub, hint }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-night-100 py-1.5 last:border-0 dark:border-night-800/60">
      <span className="text-sm text-night-600 dark:text-night-400" title={hint}>
        {label}
      </span>
      <span className="text-right font-mono text-sm tabular-nums">
        {value}
        {sub && <span className="ml-2 text-xs text-night-500">{sub}</span>}
      </span>
    </div>
  )
}

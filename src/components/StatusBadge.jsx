const STATUS = {
  stable: null,
  beta: { label: 'Bêta', className: 'border-sky-500/40 text-sky-700 dark:text-sky-300' },
  dev: { label: 'En construction', className: 'border-accent-500/40 text-accent-700 dark:text-accent-300' },
}

/** Pastille d'état d'un outil (rien n'est affiché pour un outil stable). */
export default function StatusBadge({ status }) {
  const s = STATUS[status]
  if (!s) return null
  return <span className={`chip bg-transparent dark:bg-transparent ${s.className}`}>{s.label}</span>
}

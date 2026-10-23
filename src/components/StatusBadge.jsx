const STATUS = {
  stable: { label: 'Stable', className: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400' },
  beta: { label: 'Bêta', className: 'border-sky-500/40 text-sky-600 dark:text-sky-400' },
  dev: { label: 'En dev', className: 'border-amber-500/40 text-amber-600 dark:text-amber-400' },
}

export default function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.dev
  return <span className={`chip bg-transparent dark:bg-transparent ${s.className}`}>{s.label}</span>
}

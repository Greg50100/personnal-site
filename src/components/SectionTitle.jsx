export default function SectionTitle({ kicker, title, children, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker && <p className="mb-1 text-sm font-medium text-accent-700 dark:text-accent-400">{kicker}</p>}
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {children && <p className="mt-2 max-w-2xl text-sm text-night-600 dark:text-night-400">{children}</p>}
      </div>
      {action}
    </div>
  )
}

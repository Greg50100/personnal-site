export default function SectionTitle({ kicker, title, children, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker && (
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-orange-600 dark:text-orange-500">
            {'// '}
            {kicker}
          </p>
        )}
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h2>
        {children && <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{children}</p>}
      </div>
      {action}
    </div>
  )
}

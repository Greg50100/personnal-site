/** Sélecteur à boutons (onglets compacts). options : [{ value, label }] */
export default function Segmented({ options, value, onChange, size = 'md', className = '', ariaLabel }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap gap-1 rounded-lg border border-night-200 bg-night-100 p-1 dark:border-night-800 dark:bg-night-950 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-md font-medium transition-colors ${pad} ${
              active
                ? 'bg-white text-accent-700 shadow-sm dark:bg-night-800 dark:text-accent-400'
                : 'text-night-600 hover:text-night-900 dark:text-night-400 dark:hover:text-night-100'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

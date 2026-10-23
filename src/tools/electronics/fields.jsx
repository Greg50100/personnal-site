import { formatSI, parseSI } from './si'

/**
 * Champ numérique acceptant les préfixes SI (4k7, 10µ, 20m…), avec rappel de la valeur lue.
 * `optional` : un champ vide n'est pas signalé comme erreur.
 */
export function SIField({ id, label, unit, value, onChange, placeholder, optional = false }) {
  const parsed = parseSI(value)
  const empty = value.trim() === ''
  const invalid = !empty && !Number.isFinite(parsed)
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <input
        id={id}
        className={`input font-mono text-lg ${invalid ? 'border-red-500' : ''}`}
        inputMode="decimal"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
      <p className={`mt-1 font-mono text-xs ${invalid ? 'text-red-500' : 'text-zinc-500'}`}>
        {invalid ? 'Valeur non reconnue' : empty ? (optional ? 'facultatif' : '\u00a0') : `= ${formatSI(parsed, unit, 6)}`}
      </p>
    </div>
  )
}

/** Tuile de résultat ; `main` la met en avant. */
export function Result({ label, value, hint, main = false }) {
  return (
    <div className={`rounded-lg px-3 py-2 ${main ? 'border border-orange-500/40 bg-orange-500/5' : 'bg-zinc-50 dark:bg-zinc-950'}`}>
      <p className="text-[11px] text-zinc-500">{label}</p>
      <p className={`font-mono ${main ? 'text-2xl font-bold text-orange-600 dark:text-orange-400' : 'text-base'}`}>{value}</p>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
    </div>
  )
}

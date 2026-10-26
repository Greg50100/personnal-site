import { useState } from 'react'
import { Links, SearchField } from '../materiel/ui'

/** Section titrée d'une page de références. */
export function RefSection({ id, title, intro, children }) {
  return (
    <section className="card card-pad min-w-0 space-y-3" aria-labelledby={id}>
      <h2 id={id} className="font-display text-lg font-semibold text-night-900 dark:text-night-50">
        {title}
      </h2>
      {intro && <p className="text-sm text-night-600 dark:text-night-400">{intro}</p>}
      {children}
    </section>
  )
}

/**
 * Tableau de référence, avec recherche facultative.
 *   columns : [{ label, wrap?, mono?, align? }] ; rows : tableaux de cellules (texte ou élément React)
 */
export function DataTable({ columns, rows, searchable, placeholder = 'Rechercher', highlight }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const text = (cell) => (typeof cell === 'string' || typeof cell === 'number' ? String(cell) : '')
  const shown = q ? rows.filter((r) => r.some((c) => text(c).toLowerCase().includes(q))) : rows
  return (
    <div className="space-y-2">
      {searchable && <SearchField value={query} onChange={setQuery} placeholder={placeholder} />}
      <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
        <table className="table-data">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.label} className={c.align === 'right' ? 'text-right' : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className={highlight?.(row) ? 'bg-accent-400/15' : undefined}>
                {row.map((cell, j) => {
                  const c = columns[j] ?? {}
                  return (
                    <td key={j} className={`align-top ${j === 0 ? 'font-medium' : ''} ${c.mono ? 'font-mono' : ''} ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.wrap ? 'min-w-[12rem] !whitespace-normal' : ''}`}>
                      {cell}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {q && !shown.length && <p className="text-sm text-night-500">Aucune ligne ne correspond.</p>}
    </div>
  )
}

/** Liste de remarques. */
export function Notes({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-night-700 dark:text-night-300">
      {items.map((n) => (
        <li key={n}>{n}</li>
      ))}
    </ul>
  )
}

export function Sources({ links }) {
  return (
    <RefSection id="sources" title="Sources">
      <Links links={links} />
    </RefSection>
  )
}

/** Pastille de couleur (fil, fusible) avec un libellé ; deux couleurs pour un fil bicolore. */
export function Swatch({ colors, label }) {
  const [a, b] = colors
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-block h-4 w-7 shrink-0 rounded border border-night-300 dark:border-night-600"
        style={{ background: b ? `repeating-linear-gradient(135deg, ${a} 0 6px, ${b} 6px 12px)` : a }}
        aria-hidden="true"
      />
      {label}
    </span>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { searchTools, toolPath, getCategory } from '../registry'

/** Recherche rapide d'un outil (ouverte par Ctrl/⌘ + K ou le bouton de l'en-tête). À monter à l'ouverture. */
export default function CommandPalette({ onClose }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const listRef = useRef(null)

  const results = useMemo(() => searchTools(query).slice(0, 12), [query])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const open = (tool) => {
    navigate(toolPath(tool))
    onClose()
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' && results[active]) {
      open(results[active])
    }
  }

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active])

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-night-950/70 p-3 pt-[10vh] backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Rechercher un outil" className="card w-full max-w-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-night-200 px-4 dark:border-night-800">
          <Search size={18} className="shrink-0 text-night-400" />
          <input
            autoFocus
            className="w-full bg-transparent py-4 text-base outline-none placeholder:text-night-400"
            placeholder="Rechercher un outil, une unité, un calcul…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            onKeyDown={onKeyDown}
            aria-label="Rechercher"
          />
          <kbd className="hidden rounded border border-night-300 px-1.5 text-[10px] text-night-500 dark:border-night-700 sm:block">Échap</kbd>
        </div>
        <ul ref={listRef} className="max-h-[60vh] overflow-y-auto p-2" role="listbox">
          {results.map((tool, i) => {
            const Icon = tool.icon
            return (
              <li key={`${tool.category}/${tool.id}`} role="option" aria-selected={i === active} data-active={i === active}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => open(tool)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    i === active ? 'bg-accent-400/15' : ''
                  }`}
                >
                  <span className="rounded-lg bg-accent-400/15 p-1.5 text-accent-700 dark:text-accent-300">
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{tool.title}</span>
                    <span className="block truncate text-xs text-night-500">
                      {getCategory(tool.category)?.label} · {tool.summary}
                    </span>
                  </span>
                  {i === active && <CornerDownLeft size={14} className="shrink-0 text-night-400" />}
                </button>
              </li>
            )
          })}
          {!results.length && <li className="px-3 py-6 text-center text-sm text-night-500">Aucun outil ne correspond à « {query} ».</li>}
        </ul>
      </div>
    </div>
  )
}

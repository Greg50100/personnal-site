import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Moon, Search, Sun, X } from 'lucide-react'
import { useTheme } from '../context/theme'
import { CATEGORIES, toolsOf } from '../registry'
import Brand from './Brand'
import CommandPalette from './CommandPalette'
import { LocationButton } from './LocationPicker'

const NAV = [
  { to: '/astronomie', label: 'Astronomie' },
  { to: '/outils', label: 'Calculateurs' },
  { to: '/utilitaires/convertisseur', label: 'Convertisseur' },
  { to: '/a-propos', label: 'À propos' },
]

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
    isActive ? 'bg-accent-400/15 text-accent-800 dark:text-accent-300' : 'text-night-600 hover:text-night-950 dark:text-night-300 dark:hover:text-white'
  }`

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  // Le menu mobile se referme à chaque changement de page.
  const [menu, setMenu] = useState({ open: false, path: pathname })
  const menuOpen = menu.open && menu.path === pathname
  const setMenuOpen = (open) => setMenu({ open, path: pathname })
  const [searchOpen, setSearchOpen] = useState(false)
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    const onOpen = () => setSearchOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-search', onOpen)
    }
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b border-night-200 bg-night-50/85 backdrop-blur-md dark:border-night-800 dark:bg-night-950/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="btn hidden w-56 justify-between text-night-500 sm:inline-flex"
            aria-label="Rechercher un outil (Ctrl + K)"
          >
            <span className="inline-flex items-center gap-2">
              <Search size={15} /> Rechercher…
            </span>
            <kbd className="rounded border border-night-300 px-1.5 font-mono text-[10px] dark:border-night-700">Ctrl K</kbd>
          </button>
          <button type="button" onClick={() => setSearchOpen(true)} className="btn-icon sm:hidden" aria-label="Rechercher un outil">
            <Search size={16} />
          </button>
          <LocationButton className="hidden max-w-[190px] xl:inline-flex" />
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-icon"
            aria-label={theme === 'dark' ? 'Activer le thème clair' : 'Activer le thème sombre'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button type="button" className="btn-icon lg:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label="Menu">
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-night-200 bg-night-50 px-4 pb-6 pt-3 dark:border-night-800 dark:bg-night-950 lg:hidden">
          <nav className="grid grid-cols-2 gap-2" aria-label="Navigation mobile">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="btn justify-start">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3">
            <LocationButton className="w-full justify-start" showCoords />
          </div>
          <div className="mt-5 grid gap-x-4 sm:grid-cols-2">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="mt-3">
                <Link to={`/${cat.id}`} className="label flex items-center gap-1.5 hover:text-accent-600">
                  <cat.icon size={13} /> {cat.label}
                </Link>
                <ul className="grid gap-0.5">
                  {toolsOf(cat.id).map((tool) => (
                    <li key={tool.id}>
                      <Link to={`/${cat.id}/${tool.id}`} className="block rounded-md px-2 py-1 text-sm text-night-700 hover:bg-accent-400/10 dark:text-night-300">
                        {tool.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
      {searchOpen && <CommandPalette onClose={closeSearch} />}
    </header>
  )
}

import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Github, Menu, Moon, Sun, X } from 'lucide-react'
import { useTheme } from '../context/theme'
import { SITE } from '../config/site'
import { CATEGORIES, toolPath, toolsOf } from '../tools/registry'
import Brand from './Brand'
import { LocationButton } from './LocationPicker'

const NAV = [
  { to: '/', label: 'Accueil', end: true },
  { to: '/astronomie', label: 'Astronomie' },
  { to: '/outils', label: 'Outils' },
  { to: '/projets', label: 'Projets' },
]

const navClass = ({ isActive }) =>
  `font-mono text-xs uppercase tracking-widest transition-colors hover:text-orange-500 ${
    isActive ? 'text-orange-600 dark:text-orange-500' : 'text-zinc-600 dark:text-zinc-400'
  }`

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { pathname } = useLocation()
  // Le menu mobile se referme à chaque changement de page.
  const [menu, setMenu] = useState({ open: false, path: pathname })
  const menuOpen = menu.open && menu.path === pathname
  const setMenuOpen = (open) => setMenu({ open, path: pathname })

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur-md dark:border-orange-500/20 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Brand />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Navigation principale">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
              <span className="mr-1 text-orange-500">{'//'}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LocationButton className="hidden max-w-[200px] lg:inline-flex" />
          <a href={SITE.github} target="_blank" rel="noreferrer" className="btn-icon hidden sm:inline-flex" aria-label="GitHub">
            <Github size={16} />
          </a>
          <button
            type="button"
            onClick={toggleTheme}
            className="btn-icon"
            aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            className="btn-icon md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-label="Menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="max-h-[calc(100dvh-3.5rem)] overflow-y-auto border-t border-zinc-200 bg-zinc-50 px-4 pb-6 pt-3 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          <nav className="grid grid-cols-2 gap-2" aria-label="Navigation mobile">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className="btn justify-start">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-3">
            <LocationButton className="w-full justify-start" showCoords />
          </div>
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="mt-5">
              <Link to={`/${cat.id}`} className="label hover:text-orange-500">
                {cat.label}
              </Link>
              <ul className="grid gap-1">
                {toolsOf(cat.id).map((tool) => (
                  <li key={tool.id}>
                    <Link
                      to={toolPath(tool)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-orange-500/10 hover:text-orange-600 dark:text-zinc-300"
                    >
                      <tool.icon size={15} className="text-orange-500" />
                      {tool.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </header>
  )
}

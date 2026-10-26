import { Link } from 'react-router-dom'
import { SITE } from '../config/site'
import { DOMAINS, TOOLS, rubriquePath } from '../registry'
import { Logo } from './Brand'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-night-200 dark:border-night-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_1fr_1.3fr] lg:px-8">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <Logo size={24} /> {SITE.name}
          </p>
          <p className="mt-2 max-w-xs text-sm text-night-600 dark:text-night-400">
            {SITE.tagline}. {TOOLS.length} outils gratuits, sans compte ni publicité, qui fonctionnent dans le navigateur.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
          {DOMAINS.map((d) => (
            <div key={d.id}>
              <Link to={`/${d.id}`} className="label hover:text-accent-700 dark:hover:text-accent-300">
                {d.label}
              </Link>
              <ul className="grid gap-0.5">
                {d.rubriques.map((r) => (
                  <li key={r.id}>
                    <Link to={rubriquePath(r)} className="text-night-600 hover:text-accent-700 dark:text-night-400 dark:hover:text-accent-300">
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="text-xs leading-relaxed text-night-500">
          <p className="label">Sources et crédits</p>
          Calculs astronomiques :{' '}
          <a className="underline hover:text-accent-600" href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">
            Astronomy Engine
          </a>{' '}
          (MIT). Étoiles et constellations :{' '}
          <a className="underline hover:text-accent-600" href="https://github.com/ofrohn/d3-celestial" target="_blank" rel="noreferrer">
            d3-celestial
          </a>{' '}
          (BSD-3). Satellites :{' '}
          <a className="underline hover:text-accent-600" href="https://github.com/shashwatak/satellite-js" target="_blank" rel="noreferrer">
            satellite.js
          </a>{' '}
          et{' '}
          <a className="underline hover:text-accent-600" href="https://celestrak.org" target="_blank" rel="noreferrer">
            CelesTrak
          </a>
          . Cartes :{' '}
          <a className="underline hover:text-accent-600" href="https://www.naturalearthdata.com" target="_blank" rel="noreferrer">
            Natural Earth
          </a>
          . Taux de change : Banque centrale européenne.
        </div>
      </div>
      <div className="border-t border-night-200 py-4 text-center text-xs text-night-500 dark:border-night-800">
        © {new Date().getFullYear()} {SITE.name} ·{' '}
        <Link to="/a-propos" className="hover:text-accent-600">
          À propos
        </Link>{' '}
        ·{' '}
        <a href={SITE.repo} className="hover:text-accent-600">
          Code source
        </a>
      </div>
    </footer>
  )
}

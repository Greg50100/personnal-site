import { Link } from 'react-router-dom'
import { SITE } from '../config/site'
import { CATEGORIES } from '../tools/registry'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-900">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="font-mono text-sm font-bold tracking-widest">
            {SITE.name}
            <span className="text-orange-500">{SITE.suffix}</span>
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{SITE.tagline}.</p>
        </div>
        <div>
          <p className="label">Rubriques</p>
          <ul className="grid grid-cols-2 gap-1 text-sm">
            {CATEGORIES.map((c) => (
              <li key={c.id}>
                <Link to={`/${c.id}`} className="text-zinc-600 hover:text-orange-500 dark:text-zinc-400">
                  {c.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/projets" className="text-zinc-600 hover:text-orange-500 dark:text-zinc-400">
                Projets
              </Link>
            </li>
          </ul>
        </div>
        <div className="text-xs leading-relaxed text-zinc-500">
          <p className="label">Crédits</p>
          Calculs astronomiques :{' '}
          <a className="underline hover:text-orange-500" href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer">
            Astronomy Engine
          </a>{' '}
          (Don Cross, MIT). Catalogues d'étoiles et constellations :{' '}
          <a className="underline hover:text-orange-500" href="https://github.com/ofrohn/d3-celestial" target="_blank" rel="noreferrer">
            d3-celestial
          </a>{' '}
          (O. Frohn, BSD-3). Satellites :{' '}
          <a className="underline hover:text-orange-500" href="https://github.com/shashwatak/satellite-js" target="_blank" rel="noreferrer">
            satellite.js
          </a>{' '}
          et données TLE{' '}
          <a className="underline hover:text-orange-500" href="https://celestrak.org" target="_blank" rel="noreferrer">
            CelesTrak
          </a>
          .
        </div>
      </div>
      <p className="border-t border-zinc-200 py-4 text-center font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:border-zinc-900">
        © {new Date().getFullYear()} {SITE.name}
        {SITE.suffix} · <a href={SITE.repo} className="hover:text-orange-500">code source</a>
      </p>
    </footer>
  )
}

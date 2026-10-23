import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page introuvable')
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-sm text-accent-700 dark:text-accent-400">404</p>
      <h1 className="mt-2 text-3xl font-bold">Cette page s'est perdue en orbite.</h1>
      <p className="mt-3 text-night-600 dark:text-night-400">L'adresse demandée ne correspond à aucun outil.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="btn-primary">
          Accueil
        </Link>
        <Link to="/outils" className="btn">
          Tous les outils
        </Link>
      </div>
    </div>
  )
}

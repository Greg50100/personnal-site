import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function NotFound() {
  useDocumentTitle('Page introuvable')
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-mono text-sm text-orange-500">ERREUR_404</p>
      <h1 className="mt-2 text-3xl font-black">Cette page s'est perdue dans l'espace.</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">L'adresse demandée ne correspond à aucun outil ni aucune page.</p>
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

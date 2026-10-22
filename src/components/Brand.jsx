import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { SITE } from '../config/site'

export default function Brand({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="group flex shrink-0 items-center gap-2" aria-label="Accueil">
      <span className="rounded border border-orange-500 p-1 text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-white">
        <Zap size={16} />
      </span>
      <span className="font-mono text-lg font-bold tracking-widest">
        {SITE.name}
        <span className="text-orange-500">{SITE.suffix}</span>
      </span>
    </Link>
  )
}

import { Link } from 'react-router-dom'
import { SITE } from '../config/site'

/** Logo : Ganymède, la plus grande lune de Jupiter, avec son orbite. */
export function Logo({ size = 28 }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <ellipse cx="16" cy="16" rx="14" ry="5" fill="none" stroke="#fbbf24" strokeWidth="1.6" transform="rotate(-20 16 16)" />
      <circle cx="16" cy="16" r="8" fill="#c7cfdf" />
      <circle cx="13" cy="13.5" r="2.2" fill="#8d98b3" />
      <circle cx="19" cy="18" r="2.8" fill="#9aa5be" />
      <circle cx="18.5" cy="12" r="1.2" fill="#8d98b3" />
      <path d="M8.6 18.5a8 8 0 0 0 14.9 0" fill="none" stroke="#fbbf24" strokeWidth="1.6" transform="rotate(-20 16 16)" />
    </svg>
  )
}

export default function Brand({ onClick }) {
  return (
    <Link to="/" onClick={onClick} className="flex shrink-0 items-center gap-2" aria-label={`${SITE.name} — accueil`}>
      <Logo />
      <span className="font-display text-lg font-bold tracking-tight">{SITE.name}</span>
    </Link>
  )
}

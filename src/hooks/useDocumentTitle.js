import { useEffect } from 'react'
import { SITE } from '../config/site'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — ${SITE.name}${SITE.suffix}` : `${SITE.name}${SITE.suffix} — Projets & outils`
  }, [title])
}

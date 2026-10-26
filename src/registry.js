import * as astronomie from './domains/astronomie/registry'
import * as electronique from './domains/electronique/registry'
import * as sciences from './domains/sciences/registry'
import * as pratique from './domains/pratique/registry'

/**
 * REGISTRE DU SITE
 * ----------------
 * Le site est découpé en quatre espaces (Astronomie, Électronique, Sciences, Pratique), chacun en rubriques.
 * Chaque espace décrit ses rubriques et ses outils dans src/domains/<espace>/registry.js : c'est là qu'on ajoute un outil.
 *   - outil simple « formulaire → résultats » : écrire une spec (voir src/kit/Calculator.jsx)
 *     puis component: calc(() => import('./dossier/mon-outil.js'))
 *   - outil avec une interface sur mesure : écrire un composant React (export default)
 *     puis component: lazy(() => import('./dossier/MonOutil.jsx'))
 * Adresse d'un outil : #/<espace>/<outil>. Le menu, la recherche, les pages d'espace et le catalogue sont générés ici.
 *
 * Champs d'un outil — status : 'stable' | 'beta' | 'dev' ; repo : dépôt GitHub d'origine ; featured : mis en avant ;
 * wide : toute la largeur de l'écran.
 */

const MODULES = [astronomie, electronique, sciences, pratique]

export const DOMAINS = MODULES.map((m) => ({ ...m.DOMAIN, rubriques: m.RUBRIQUES.map((r) => ({ ...r, domain: m.DOMAIN.id })) }))

export const RUBRIQUES = DOMAINS.flatMap((d) => d.rubriques)

export const TOOLS = MODULES.flatMap((m) => m.TOOLS.map((t) => ({ ...t, domain: m.DOMAIN.id })))

export const toolPath = (tool) => `/${tool.domain}/${tool.id}`
export const rubriquePath = (rubrique) => `/${rubrique.domain}?rubrique=${rubrique.id}`

export const getDomain = (id) => DOMAINS.find((d) => d.id === id)
export const getRubrique = (id) => RUBRIQUES.find((r) => r.id === id)
export const getTool = (id) => TOOLS.find((t) => t.id === id)
export const toolsOf = (rubriqueId) => TOOLS.filter((t) => t.rubrique === rubriqueId)
export const toolsOfDomain = (domainId) => TOOLS.filter((t) => t.domain === domainId)

/**
 * ANCIENNES ADRESSES
 * Avant les espaces, les outils étaient rangés en rubriques à plat (#/<rubrique>/<outil>). Les pages de rubrique
 * renvoient vers l'espace (et la rubrique) correspondants ; les adresses d'outils se résolvent par l'identifiant de l'outil.
 */
export const LEGACY_CATEGORIES = {
  temps: { domain: 'pratique', rubrique: 'dates' },
  utilitaires: { domain: 'pratique', rubrique: 'conversions' },
  materiel: { domain: 'electronique', rubrique: 'cartes-modules' },
  references: { domain: 'electronique' },
  maths: { domain: 'sciences', rubrique: 'maths' },
  physique: { domain: 'sciences', rubrique: 'physique' },
  meteo: { domain: 'sciences', rubrique: 'meteo' },
  chimie: { domain: 'sciences', rubrique: 'chimie' },
  sante: { domain: 'pratique', rubrique: 'sante' },
}

/** Outils fusionnés dans un autre : « Brochages des cartes » est désormais dans la fiche de chaque carte. */
export const TOOL_ALIASES = { brochages: 'cartes' }

/** Outil désigné par une adresse, ancienne ou actuelle. */
export const resolveTool = (id) => getTool(id) ?? getTool(TOOL_ALIASES[id])

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Recherche plein texte (titre, tags, résumé, rubrique, espace), classée par pertinence ; `domain` la limite à un espace. */
export function searchTools(query, { domain } = {}) {
  const pool = domain ? toolsOfDomain(domain) : TOOLS
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean)
  if (!words.length) return pool.filter((t) => t.featured).concat(pool.filter((t) => !t.featured))
  return pool
    .map((t) => {
      const title = normalize(t.title)
      const tags = normalize((t.tags ?? []).join(' '))
      const rest = normalize(`${t.summary} ${getRubrique(t.rubrique)?.label ?? ''} ${getDomain(t.domain)?.label ?? ''}`)
      let score = 0
      for (const w of words) {
        if (title.startsWith(w)) score += 6
        else if (title.includes(w)) score += 4
        else if (tags.includes(w)) score += 3
        else if (rest.includes(w)) score += 1
        else return null
      }
      return { t, score }
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t)
}

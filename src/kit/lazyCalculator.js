import { createElement, lazy } from 'react'

/**
 * Charge à la demande une « spec » de calculateur (fichier .js décrivant champs et formules)
 * et l'affiche avec le composant générique <Calculator>.
 * Utilisation dans registry.js : component: lazyCalculator(() => import('./physique/chute-libre.js'))
 */
export function lazyCalculator(loader) {
  return lazy(async () => {
    const [{ default: spec }, { default: Calculator }] = await Promise.all([loader(), import('./Calculator.jsx')])
    return { default: () => createElement(Calculator, { spec }) }
  })
}

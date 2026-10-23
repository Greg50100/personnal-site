/**
 * PROJETS GITHUB
 * --------------
 * Liste affichée sur la page « Projets ». Pour ajouter un dépôt, ajouter une entrée.
 * status : 'actif' | 'en-pause' | 'prototype' | 'termine'
 * tools  : identifiants (registry.js) des outils du site issus de ce projet
 */
export const PROJECTS = [
  {
    repo: 'personnal-site',
    title: 'Site personnel',
    description: 'Ce site : vitrine des projets et boîte à outils (astronomie, conversions, calculs) en React + Vite.',
    tech: ['React', 'Vite', 'Tailwind', 'astronomy-engine'],
    status: 'actif',
    tools: [],
  },
  {
    repo: 'Ganymede',
    title: 'Ganymede',
    description:
      'Calculatrice scientifique Android : convertisseur, traceur de fonctions et suite de calculateurs (électronique, maths, santé).',
    tech: ['Kotlin', 'Jetpack Compose', 'Hilt', 'Room'],
    status: 'actif',
    tools: ['second-degre', 'pgcd-ppcm', 'pont-diviseur', 'resistance-led', 'timer-555'],
  },
  {
    repo: 'Celeste_App',
    title: 'Céleste — observatoire',
    description:
      'Application de bureau : positions du Soleil, de la Lune et des planètes, crépuscules, éclipses, carte du ciel et export PDF.',
    tech: ['Python', 'Skyfield', 'CustomTkinter', 'Matplotlib'],
    status: 'actif',
    tools: ['ce-soir', 'carte-du-ciel'],
  },
  {
    repo: 'Celeste_HA',
    title: 'Céleste pour Home Assistant',
    description: "Intégration Home Assistant : capteurs d'éphémérides (IMCCE), visibilité, magnitude et élongation des astres.",
    tech: ['Python', 'Home Assistant', 'astroquery'],
    status: 'prototype',
    tools: [],
  },
  {
    repo: 'ha-meeus-astronomy',
    title: 'Meeus Astronomy (HA)',
    description: "Composant Home Assistant basé sur les « Astronomical Algorithms » de Jean Meeus : jour julien, temps sidéral…",
    tech: ['Python', 'Home Assistant', 'HACS'],
    status: 'prototype',
    tools: ['systeme-solaire'],
  },
  {
    repo: 'Astronomy',
    title: 'Astronomy',
    description: 'Scripts et carnets Skyfield (Soleil, Lune, planètes) intégrés à Home Assistant via des flux Node-RED.',
    tech: ['Python', 'Skyfield', 'Jupyter', 'Node-RED'],
    status: 'en-pause',
    tools: [],
  },
  {
    repo: 'CalculatorPro',
    title: 'CalculatorPro',
    description: 'Application web responsive : calculatrice, convertisseur et calculs avancés (électricité, psychrométrie).',
    tech: ['HTML', 'CSS', 'JavaScript'],
    status: 'en-pause',
    tools: ['calculatrice', 'loi-ohm'],
  },
  {
    repo: 'convertisseur2',
    title: 'Convertisseur universel',
    description: 'Application PyQt6 : conversions, calculatrice, décodeur de résistances (anneaux et CMS) et historique.',
    tech: ['Python', 'PyQt6'],
    status: 'en-pause',
    tools: ['convertisseur', 'code-couleur'],
  },
  {
    repo: 'Convertisseur',
    title: 'Convertisseur (module)',
    description: "Bibliothèque Python couvrant plus de 80 grandeurs physiques (viscosité, dose, flux lumineux…).",
    tech: ['Python'],
    status: 'en-pause',
    tools: ['convertisseur'],
  },
  {
    repo: 'conversions',
    title: 'conversions (PyPI)',
    description: 'Paquet Python de conversion d’unités publié sur PyPI via GitHub Actions.',
    tech: ['Python', 'PyPI'],
    status: 'en-pause',
    tools: ['bases'],
  },
]

export const PROJECT_STATUS = {
  actif: { label: 'Actif', className: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400' },
  prototype: { label: 'Prototype', className: 'border-sky-500/40 text-sky-600 dark:text-sky-400' },
  'en-pause': { label: 'En pause', className: 'border-amber-500/40 text-amber-600 dark:text-amber-400' },
  termine: { label: 'Terminé', className: 'border-zinc-500/40 text-zinc-500' },
}

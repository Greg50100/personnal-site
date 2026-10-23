/**
 * PROJETS GITHUB
 * --------------
 * Liste affichée sur la page « À propos ». Pour ajouter un dépôt, ajouter une entrée.
 * status  : 'actif' | 'en-pause' | 'prototype' | 'termine' | 'archive'
 * private : true pour un dépôt privé (aucun lien affiché, les visiteurs n'y ont pas accès)
 * tools   : identifiants (registry.js) des outils du site issus de ce projet
 */
export const PROJECTS = [
  {
    repo: 'personnal-site',
    title: 'Ganymede (site web)',
    description: 'Ce site : boîte à outils de calcul, de conversion et d’astronomie, en React + Vite.',
    tech: ['React', 'Vite', 'Tailwind', 'astronomy-engine'],
    status: 'actif',
    tools: [],
  },
  {
    repo: 'Ganymede',
    title: 'Ganymede',
    description:
      'Application Android : calculatrice, convertisseur, traceur de fonctions, plus de cent calculateurs et fiches de référence.',
    tech: ['Kotlin', 'Jetpack Compose', 'Hilt', 'Room'],
    status: 'actif',
    tools: ['traceur', 'matrices', 'loi-ohm', 'code-couleur', 'timer-555', 'imc', 'masse-molaire', 'calcul-dates'],
  },
  {
    repo: 'Celeste_App',
    title: 'Céleste — observatoire',
    description:
      'Application de bureau : positions du Soleil, de la Lune et des planètes, crépuscules, éclipses, carte du ciel et export PDF.',
    tech: ['Python', 'CustomTkinter', 'Matplotlib', 'Meeus / VSOP87'],
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
    status: 'archive',
    tools: [],
  },
  {
    repo: 'convertisseur2',
    private: true,
    title: 'Convertisseur universel',
    description: 'Application PyQt6 : conversions, calculatrice, décodeur de résistances (anneaux et CMS) et historique.',
    tech: ['Python', 'PyQt6'],
    status: 'archive',
    tools: ['convertisseur', 'code-couleur', 'air-humide'],
  },
  {
    repo: 'Convertisseur',
    private: true,
    title: 'Convertisseur (module)',
    description: "Bibliothèque Python couvrant plus de 80 grandeurs physiques (viscosité, dose, flux lumineux…).",
    tech: ['Python'],
    status: 'archive',
    tools: ['convertisseur'],
  },
  {
    repo: 'conversions',
    title: 'conversions (PyPI)',
    description: 'Paquet Python de conversion d’unités publié sur PyPI via GitHub Actions.',
    tech: ['Python', 'PyPI'],
    status: 'archive',
    tools: ['bases'],
  },
]

export const PROJECT_STATUS = {
  actif: { label: 'Actif', className: 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400' },
  prototype: { label: 'Prototype', className: 'border-sky-500/40 text-sky-600 dark:text-sky-400' },
  'en-pause': { label: 'En pause', className: 'border-amber-500/40 text-amber-600 dark:text-amber-400' },
  termine: { label: 'Terminé', className: 'border-night-500/40 text-night-500' },
  archive: { label: 'Archivé', className: 'border-night-500/40 text-night-500' },
}

const PRIVATE = new Set(PROJECTS.filter((p) => p.private).map((p) => p.repo))

/** Un dépôt peut-il être montré aux visiteurs (lien GitHub) ? */
export const isPublicRepo = (repo) => Boolean(repo) && !PRIVATE.has(repo)

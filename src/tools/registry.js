import { lazy } from 'react'
import {
  ArrowLeftRight,
  Binary,
  Calculator,
  CalendarDays,
  CircuitBoard,
  Cpu,
  Divide,
  Lightbulb,
  Map,
  MoonStar,
  Orbit,
  Satellite,
  Sigma,
  Split,
  SquareRadical,
  Telescope,
  Timer,
  Waves,
  Wrench,
  Zap,
} from 'lucide-react'

/**
 * REGISTRE DES OUTILS
 * -------------------
 * C'est le seul fichier à modifier pour ajouter un outil au site :
 *   1. créer le composant dans src/tools/<catégorie>/<outil>/MonOutil.jsx (export default) ;
 *   2. ajouter une entrée dans TOOLS ci-dessous.
 * La route (#/<catégorie>/<id>), le menu, le catalogue et la page d'accueil sont générés automatiquement.
 * Chaque composant est chargé à la demande (lazy) : un outil lourd ne ralentit pas le reste du site.
 */

export const CATEGORIES = [
  {
    id: 'astronomie',
    label: 'Astronomie',
    icon: Telescope,
    description: 'Carte du ciel, éphémérides, calendrier des phénomènes, positions des planètes et passages de satellites.',
  },
  {
    id: 'utilitaires',
    label: 'Utilitaires',
    icon: Wrench,
    description: "Outils du quotidien : conversions d'unités et calculatrice scientifique.",
  },
  {
    id: 'maths',
    label: 'Mathématiques',
    icon: Sigma,
    description: 'Équations, arithmétique, nombres complexes et bases numériques.',
  },
  {
    id: 'electronique',
    label: 'Électronique',
    icon: Cpu,
    description: "Code couleur des résistances, loi d'Ohm, pont diviseur, LED et temporisateur 555.",
  },
]

/**
 * status : 'stable' (terminé) | 'beta' (utilisable, à affiner) | 'dev' (en construction)
 * repo   : dépôt GitHub d'origine du projet (facultatif)
 * wide   : true pour donner toute la largeur de l'écran à l'outil
 */
export const TOOLS = [
  // --- Astronomie ---
  {
    id: 'ce-soir',
    category: 'astronomie',
    title: 'Ce soir dans le ciel',
    summary: 'Soleil, Lune, crépuscules et planètes visibles pour votre lieu, avec courbes de hauteur sur 24 h.',
    icon: MoonStar,
    status: 'stable',
    tags: ['éphémérides', 'lever', 'coucher', 'planètes'],
    repo: 'Celeste_App',
    wide: true,
    component: lazy(() => import('./astronomy/tonight/Tonight.jsx')),
  },
  {
    id: 'carte-du-ciel',
    category: 'astronomie',
    title: 'Carte du ciel',
    summary: 'Le ciel en temps réel au-dessus de votre tête : 5 000 étoiles, constellations, planètes et objets Messier.',
    icon: Map,
    status: 'stable',
    tags: ['étoiles', 'constellations', 'planisphère'],
    wide: true,
    component: lazy(() => import('./astronomy/sky-map/SkyMap.jsx')),
  },
  {
    id: 'calendrier',
    category: 'astronomie',
    title: 'Calendrier astronomique',
    summary: 'Phases de la Lune, saisons, éclipses, oppositions, conjonctions et élongations, mois par mois.',
    icon: CalendarDays,
    status: 'stable',
    tags: ['phases', 'éclipses', 'conjonctions'],
    wide: true,
    component: lazy(() => import('./astronomy/calendar/AstroCalendar.jsx')),
  },
  {
    id: 'systeme-solaire',
    category: 'astronomie',
    title: 'Calculateur du système solaire',
    summary: 'Coordonnées héliocentriques, géocentriques, équatoriales ou horizontales, magnitudes et levers/couchers.',
    icon: Orbit,
    status: 'stable',
    tags: ['planètes', 'coordonnées', 'magnitude'],
    repo: 'ha-meeus-astronomy',
    wide: true,
    component: lazy(() => import('./astronomy/solar-system/SolarSystem.jsx')),
  },
  {
    id: 'satellites',
    category: 'astronomie',
    title: "Passages de l'ISS et satellites",
    summary: 'Prévisions des passages visibles (orbites TLE de CelesTrak) et position en temps réel.',
    icon: Satellite,
    status: 'beta',
    tags: ['ISS', 'TLE', 'satellites'],
    wide: true,
    component: lazy(() => import('./astronomy/satellites/SatellitePasses.jsx')),
  },

  // --- Utilitaires ---
  {
    id: 'convertisseur',
    category: 'utilitaires',
    title: "Convertisseur d'unités",
    summary: '19 grandeurs : longueur, masse, température, pression, énergie, données, consommation…',
    icon: ArrowLeftRight,
    status: 'stable',
    tags: ['unités', 'conversion'],
    repo: 'convertisseur2',
    component: lazy(() => import('./utilities/converter/UnitConverter.jsx')),
  },
  {
    id: 'calculatrice',
    category: 'utilitaires',
    title: 'Calculatrice scientifique',
    summary: 'Saisie libre ou clavier, trigonométrie en degrés ou radians, historique et réutilisation des résultats.',
    icon: Calculator,
    status: 'stable',
    tags: ['calcul', 'trigonométrie'],
    repo: 'CalculatorPro',
    component: lazy(() => import('./utilities/calculator/ScientificCalculator.jsx')),
  },

  // --- Mathématiques ---
  {
    id: 'second-degre',
    category: 'maths',
    title: 'Équation du second degré',
    summary: 'Résout ax² + bx + c = 0 avec discriminant, racines réelles ou complexes et tracé de la parabole.',
    icon: SquareRadical,
    status: 'stable',
    tags: ['équation', 'discriminant', 'parabole'],
    repo: 'Ganymede',
    component: lazy(() => import('./maths/quadratic/QuadraticSolver.jsx')),
  },
  {
    id: 'pgcd-ppcm',
    category: 'maths',
    title: 'PGCD, PPCM et facteurs premiers',
    summary: "Algorithme d'Euclide détaillé, PPCM et décomposition en facteurs premiers.",
    icon: Divide,
    status: 'stable',
    tags: ['arithmétique', 'euclide'],
    repo: 'Ganymede',
    component: lazy(() => import('./maths/gcd/GcdLcm.jsx')),
  },
  {
    id: 'complexes',
    category: 'maths',
    title: 'Nombres complexes',
    summary: 'Opérations sur deux complexes, formes algébrique et polaire, module et argument.',
    icon: Waves,
    status: 'stable',
    tags: ['complexe', 'polaire'],
    component: lazy(() => import('./maths/complex/ComplexCalculator.jsx')),
  },
  {
    id: 'bases',
    category: 'maths',
    title: 'Bases numériques',
    summary: 'Conversion instantanée entre binaire, octal, décimal, hexadécimal et toute base de 2 à 36.',
    icon: Binary,
    status: 'stable',
    tags: ['binaire', 'hexadécimal'],
    repo: 'conversions',
    component: lazy(() => import('./maths/bases/NumberBases.jsx')),
  },

  // --- Électronique ---
  {
    id: 'code-couleur',
    category: 'electronique',
    title: 'Code couleur des résistances',
    summary: 'Résistances à 4, 5 ou 6 anneaux : valeur, tolérance, coefficient et série normalisée E.',
    icon: CircuitBoard,
    status: 'stable',
    tags: ['résistance', 'anneaux', 'série E'],
    repo: 'convertisseur2',
    component: lazy(() => import('./electronics/resistor/ResistorColorCode.jsx')),
  },
  {
    id: 'loi-ohm',
    category: 'electronique',
    title: "Loi d'Ohm et puissance",
    summary: 'Saisissez deux grandeurs parmi U, I, R et P : les deux autres sont calculées.',
    icon: Zap,
    status: 'stable',
    tags: ['tension', 'courant', 'puissance'],
    repo: 'CalculatorPro',
    component: lazy(() => import('./electronics/ohm/OhmsLaw.jsx')),
  },
  {
    id: 'pont-diviseur',
    category: 'electronique',
    title: 'Pont diviseur de tension',
    summary: 'Tension de sortie avec ou sans charge, ou choix de R2 parmi les valeurs normalisées pour une tension visée.',
    icon: Split,
    status: 'stable',
    tags: ['diviseur', 'tension', 'résistance'],
    repo: 'Ganymede',
    component: lazy(() => import('./electronics/divider/VoltageDivider.jsx')),
  },
  {
    id: 'resistance-led',
    category: 'electronique',
    title: 'Résistance pour LED',
    summary: 'Résistance série d’une ou plusieurs LED : valeur normalisée, courant réel et puissance à dissiper.',
    icon: Lightbulb,
    status: 'stable',
    tags: ['LED', 'résistance', 'courant'],
    repo: 'Ganymede',
    component: lazy(() => import('./electronics/led/LedResistor.jsx')),
  },
  {
    id: 'timer-555',
    category: 'electronique',
    title: 'Temporisateur 555',
    summary: 'NE555 en astable ou monostable : fréquence, rapport cyclique, durée d’impulsion, et calcul de R1/R2.',
    icon: Timer,
    status: 'stable',
    tags: ['555', 'oscillateur', 'astable', 'monostable'],
    repo: 'Ganymede',
    component: lazy(() => import('./electronics/timer555/Timer555.jsx')),
  },
]

export const toolPath = (tool) => `/${tool.category}/${tool.id}`

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id)

export const getTool = (categoryId, toolId) => TOOLS.find((t) => t.category === categoryId && t.id === toolId)

export const toolsOf = (categoryId) => TOOLS.filter((t) => t.category === categoryId)

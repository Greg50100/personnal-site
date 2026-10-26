import { lazy } from 'react'
import * as I from 'lucide-react'
import { lazyCalculator } from '../../kit/lazyCalculator'

/**
 * ESPACE « SCIENCES »
 * Rubriques et outils de l'espace. Ajouter un outil : une ligne dans TOOLS avec sa rubrique (voir src/registry.js).
 */

export const DOMAIN = { id: 'sciences', label: 'Sciences', icon: I.Atom, description: 'Mathématiques, physique, météo et chimie : traceur de courbes, équations, mécanique, air humide et confort thermique.' }

export const RUBRIQUES = [
  { id: 'maths', label: 'Mathématiques', icon: I.Sigma, description: 'Traceur de courbes, équations, matrices, arithmétique, complexes et bases numériques.' },
  { id: 'physique', label: 'Physique', icon: I.Atom, description: 'Mécanique, gaz parfaits, fluides et ondes.' },
  { id: 'meteo', label: 'Météo', icon: I.CloudSun, description: 'Air humide et diagramme psychrométrique, confort thermique, ressenti, pression et altitude.' },
  { id: 'chimie', label: 'Chimie', icon: I.FlaskConical, description: 'Masse molaire et composition des molécules.' },
]

const calc = lazyCalculator

export const TOOLS = [
  // --- Mathématiques ---
  { id: 'traceur', rubrique: 'maths', title: 'Traceur de courbes', summary: 'Tracez plusieurs fonctions f(x), déplacez-vous et zoomez, lisez les valeurs au survol.', icon: I.ChartLine, tags: ['graphique', 'fonction', 'courbe'], repo: 'Ganymede', wide: true, featured: true, component: lazy(() => import('./maths/grapher/FunctionGrapher.jsx')) },
  { id: 'second-degre', rubrique: 'maths', title: 'Équation du second degré', summary: 'Résout ax² + bx + c = 0 avec discriminant, racines réelles ou complexes et tracé de la parabole.', icon: I.SquareRadical, tags: ['équation', 'discriminant', 'parabole'], repo: 'Ganymede', component: lazy(() => import('./maths/quadratic/QuadraticSolver.jsx')) },
  { id: 'matrices', rubrique: 'maths', title: 'Calcul matriciel', summary: 'Somme, produit, déterminant, inverse, transposée et puissance de matrices jusqu’à 5×5.', icon: I.Grid3x3, tags: ['matrice', 'déterminant', 'inverse'], repo: 'Ganymede', component: lazy(() => import('./maths/matrices/Matrices.jsx')) },
  { id: 'pgcd-ppcm', rubrique: 'maths', title: 'PGCD, PPCM et facteurs premiers', summary: "Algorithme d'Euclide détaillé, PPCM et décomposition en facteurs premiers.", icon: I.Divide, tags: ['arithmétique', 'euclide'], repo: 'Ganymede', component: lazy(() => import('./maths/gcd/GcdLcm.jsx')) },
  { id: 'complexes', rubrique: 'maths', title: 'Nombres complexes', summary: 'Opérations sur deux complexes, formes algébrique et polaire, module et argument.', icon: I.Waves, tags: ['complexe', 'polaire'], component: lazy(() => import('./maths/complex/ComplexCalculator.jsx')) },
  { id: 'bases', rubrique: 'maths', title: 'Bases numériques', summary: 'Conversion instantanée entre binaire, octal, décimal, hexadécimal et toute base de 2 à 36.', icon: I.Binary, tags: ['binaire', 'hexadécimal'], repo: 'conversions', component: lazy(() => import('./maths/bases/NumberBases.jsx')) },

  // --- Physique ---
  { id: 'chute-libre', rubrique: 'physique', title: 'Chute libre', summary: "Durée de chute et vitesse d'impact sur Terre, la Lune, Mars ou Jupiter.", icon: I.ArrowDownToLine, tags: ['gravité', 'vitesse'], repo: 'Ganymede', component: calc(() => import('./physique/chute-libre.js')) },
  { id: 'projectile', rubrique: 'physique', title: "Mouvement d'un projectile", summary: 'Portée, hauteur maximale, durée de vol et trajectoire d’un tir parabolique.', icon: I.Rocket, tags: ['balistique', 'parabole'], repo: 'Ganymede', component: calc(() => import('./physique/projectile.js')) },
  { id: 'newton', rubrique: 'physique', title: 'Deuxième loi de Newton', summary: 'Force, masse ou accélération : F = m × a.', icon: I.Weight, tags: ['force', 'accélération'], repo: 'Ganymede', component: calc(() => import('./physique/newton.js')) },
  { id: 'gaz-parfaits', rubrique: 'physique', title: 'Loi des gaz parfaits', summary: 'Pression, volume, quantité de matière ou température : PV = nRT.', icon: I.Thermometer, tags: ['PV=nRT', 'gaz'], repo: 'Ganymede', component: calc(() => import('./physique/gaz-parfaits.js')) },
  { id: 'bernoulli', rubrique: 'physique', title: 'Équation de Bernoulli', summary: 'Pression, vitesse ou altitude d’un fluide entre deux points d’un écoulement.', icon: I.Droplets, tags: ['fluide', 'pression'], repo: 'Ganymede', component: calc(() => import('./physique/bernoulli.js')) },
  { id: 'onde', rubrique: 'physique', title: "Longueur d'onde et fréquence", summary: 'λ = c / f pour la lumière, le son ou un câble, période et énergie du photon.', icon: I.AudioWaveform, tags: ['onde', 'fréquence', 'photon'], repo: 'Ganymede', component: calc(() => import('./physique/onde.js')) },

  // --- Météo ---
  { id: 'air-humide', rubrique: 'meteo', title: 'Air humide (psychrométrie)', summary: 'Diagramme de l’air humide, point de rosée ou humidité relative, température humide, rapport de mélange, enthalpie et volume spécifique.', icon: I.Droplets, tags: ['point de rosée', 'humidité', 'psychrométrie', 'diagramme de Carrier', 'CVC', 'enthalpie'], wide: true, repo: 'convertisseur2', component: calc(() => import('./meteo/air-humide.js')) },
  { id: 'confort-thermique', rubrique: 'meteo', title: 'Confort thermique (Thermal Comfort)', summary: 'Les capteurs de l’intégration Home Assistant Thermal Comfort, avec ses formules et ses seuils exacts : humidex, point de rosée, gelée, Thom, Scharlau, Simmer, aération.', icon: I.Thermometer, tags: ['Home Assistant', 'Thermal Comfort', 'humidex', 'point de gelée', 'aération', 'indice de Thom'], wide: true, component: calc(() => import('./meteo/confort-thermique.js')) },
  { id: 'ressenti', rubrique: 'meteo', title: 'Ressenti, pression et altitude', summary: 'Indice de chaleur, humidex, refroidissement éolien, base des nuages, pression ramenée au niveau de la mer.', icon: I.ThermometerSun, tags: ['humidex', 'wind chill', 'indice de chaleur', 'baromètre', 'QNH'], component: calc(() => import('./meteo/ressenti.js')) },

  // --- Chimie ---
  { id: 'masse-molaire', rubrique: 'chimie', title: 'Masse molaire', summary: 'Masse molaire et composition massique d’une formule chimique (parenthèses et hydrates).', icon: I.Beaker, tags: ['mole', 'formule', 'g/mol'], repo: 'Ganymede', component: calc(() => import('./chimie/masse-molaire.js')) },
]

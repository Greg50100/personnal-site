import { lazy } from 'react'
import * as I from 'lucide-react'
import { lazyCalculator } from './kit/lazyCalculator'

/**
 * REGISTRE DES OUTILS
 * -------------------
 * C'est le seul fichier à modifier pour ajouter un outil au site :
 *   - outil simple « formulaire → résultats » : écrire une spec (voir src/tools/kit/Calculator.jsx)
 *     puis component: lazyCalculator(() => import('./rubrique/mon-outil.js'))
 *   - outil avec une interface sur mesure : écrire un composant React (export default)
 *     puis component: lazy(() => import('./rubrique/MonOutil.jsx'))
 * La route (#/<rubrique>/<id>), le menu, la recherche, le catalogue et l'accueil sont générés automatiquement.
 */

export const CATEGORIES = [
  { id: 'astronomie', label: 'Astronomie', icon: I.Telescope, description: 'Carte du ciel, éphémérides du Soleil, de la Lune et des planètes, éclipses, calendrier et satellites.' },
  { id: 'temps', label: 'Dates et temps', icon: I.Clock, description: 'Temps astronomique (jour julien, temps sidéral), fuseaux horaires, calculs de dates et fêtes.' },
  { id: 'utilitaires', label: 'Conversions et calcul', icon: I.ArrowLeftRight, description: "Convertisseur d'unités et de devises, calculatrice scientifique." },
  { id: 'electronique', label: 'Électronique', icon: I.Cpu, description: 'Loi d’Ohm, résistances, filtres, alimentations, câbles et composants actifs.' },
  { id: 'maths', label: 'Mathématiques', icon: I.Sigma, description: 'Traceur de courbes, équations, matrices, arithmétique, complexes et pourcentages.' },
  { id: 'physique', label: 'Physique', icon: I.Atom, description: 'Mécanique, gaz parfaits, fluides et ondes.' },
  { id: 'meteo', label: 'Météo', icon: I.CloudSun, description: 'Air humide et diagramme psychrométrique, confort thermique (formules de Thermal Comfort), ressenti, pression et altitude.' },
  { id: 'sante', label: 'Santé', icon: I.HeartPulse, description: 'IMC, besoins caloriques et masse grasse.' },
  { id: 'chimie', label: 'Chimie', icon: I.FlaskConical, description: 'Masse molaire et composition des molécules.' },
]

const calc = lazyCalculator

/**
 * status : 'stable' (terminé) | 'beta' (utilisable, à affiner) | 'dev' (en construction)
 * repo   : dépôt GitHub d'origine (facultatif) ; featured : mis en avant sur l'accueil
 * wide   : true pour donner toute la largeur de l'écran à l'outil
 */
export const TOOLS = [
  // --- Astronomie ---
  { id: 'ce-soir', category: 'astronomie', title: 'Ce soir dans le ciel', summary: 'Soleil, Lune, crépuscules et planètes visibles pour votre lieu, avec courbes de hauteur sur 24 h.', icon: I.MoonStar, tags: ['éphémérides', 'lever', 'coucher', 'planètes'], repo: 'Celeste_App', wide: true, featured: true, component: lazy(() => import('./astronomy/tonight/Tonight.jsx')) },
  { id: 'carte-du-ciel', category: 'astronomie', title: 'Carte du ciel', summary: 'Le ciel en temps réel au-dessus de votre tête : 5 000 étoiles, constellations, planètes et objets Messier.', icon: I.Map, tags: ['étoiles', 'constellations', 'planisphère'], wide: true, featured: true, component: lazy(() => import('./astronomy/sky-map/SkyMap.jsx')) },
  { id: 'calendrier', category: 'astronomie', title: 'Calendrier astronomique', summary: 'Phases de la Lune, saisons, éclipses, oppositions, conjonctions et élongations, mois par mois.', icon: I.CalendarDays, tags: ['phases', 'éclipses', 'conjonctions'], wide: true, component: lazy(() => import('./astronomy/calendar/AstroCalendar.jsx')) },
  { id: 'systeme-solaire', category: 'astronomie', title: 'Calculateur du système solaire', summary: 'Coordonnées héliocentriques, géocentriques, équatoriales ou horizontales, magnitudes et levers/couchers.', icon: I.Orbit, tags: ['planètes', 'coordonnées', 'magnitude'], repo: 'ha-meeus-astronomy', wide: true, component: lazy(() => import('./astronomy/solar-system/SolarSystem.jsx')) },
  { id: 'satellites', category: 'astronomie', title: "Passages de l'ISS et satellites", summary: 'Prévisions des passages visibles (orbites TLE de CelesTrak) et position en temps réel.', icon: I.Satellite, status: 'beta', tags: ['ISS', 'TLE', 'satellites'], wide: true, featured: true, component: lazy(() => import('./astronomy/satellites/SatellitePasses.jsx')) },

  { id: 'soleil', category: 'astronomie', title: 'Le Soleil', summary: 'Position, lever, coucher, crépuscules et durée du jour, équation du temps, saisons et éphémérides du mois.', icon: I.Sun, tags: ['lever', 'coucher', 'crépuscule', 'équinoxe', 'solstice'], wide: true, component: lazy(() => import('./astronomy/sun/SunPage.jsx')) },
  { id: 'lune', category: 'astronomie', title: 'La Lune', summary: 'Phase, distance, libration, lever et coucher, périgée et apogée, calendrier lunaire du mois.', icon: I.Moon, tags: ['phase', 'libration', 'périgée', 'pleine lune'], wide: true, component: lazy(() => import('./astronomy/moon/MoonPage.jsx')) },
  { id: 'planetes', category: 'astronomie', title: 'Résumé des planètes', summary: 'Magnitude, élongation, distance, diamètre et visibilité de chaque planète, avec une vue de dessus du système solaire.', icon: I.CircleDashed, tags: ['planètes', 'élongation', 'magnitude', 'orrery'], wide: true, component: lazy(() => import('./astronomy/planets/PlanetsPage.jsx')) },
  { id: 'eclipses', category: 'astronomie', title: 'Éclipses et passages', summary: 'Éclipses de Soleil et de Lune des années à venir, avec les horaires chez vous, et passages de Mercure et Vénus.', icon: I.Eclipse, tags: ['éclipse', 'totale', 'annulaire', 'transit'], wide: true, component: lazy(() => import('./astronomy/eclipses/Eclipses.jsx')) },
  { id: 'satellites-brillants', category: 'astronomie', title: 'Satellites brillants', summary: 'Tous les passages visibles à l’œil nu de la nuit : stations, télescopes et étages de fusée les plus lumineux.', icon: I.Sparkles, status: 'beta', tags: ['satellites', 'prévisions', 'TLE', 'magnitude'], wide: true, component: lazy(() => import('./astronomy/satellites/BrightSatellites.jsx')) },
  { id: 'ou-est-iss', category: 'astronomie', title: "Où est l'ISS ?", summary: 'Position en direct sur la carte du monde, trace au sol, zone de visibilité et prochain passage chez vous.', icon: I.SatelliteDish, tags: ['ISS', 'trace au sol', 'Tiangong', 'Hubble'], wide: true, component: lazy(() => import('./astronomy/satellites/SatelliteMap.jsx')) },
  { id: 'jour-nuit', category: 'astronomie', title: 'Jour et nuit sur la Terre', summary: 'Carte du monde éclairé, crépuscules, points subsolaire et sublunaire, et heure du Soleil dans les grandes villes.', icon: I.SunMoon, tags: ['terminateur', 'carte', 'crépuscule', 'monde'], wide: true, component: lazy(() => import('./astronomy/daynight/DayNight.jsx')) },

  // --- Conversions et calcul ---
  { id: 'convertisseur', category: 'utilitaires', title: "Convertisseur d'unités", summary: '75 grandeurs et plus de 600 unités : mécanique, électricité, thermique, chimie, informatique, rayonnements… et devises.', icon: I.ArrowLeftRight, tags: ['unités', 'conversion', 'devises', 'taux de change'], repo: 'convertisseur2', featured: true, component: lazy(() => import('./utilities/converter/UnitConverter.jsx')) },
  { id: 'calculatrice', category: 'utilitaires', title: 'Calculatrice scientifique', summary: 'Saisie libre ou clavier, trigonométrie en degrés ou radians, historique et réutilisation des résultats.', icon: I.Calculator, tags: ['calcul', 'trigonométrie'], featured: true, component: lazy(() => import('./utilities/calculator/ScientificCalculator.jsx')) },

  // --- Dates et temps ---
  { id: 'temps-astronomique', category: 'temps', title: 'Heure et temps astronomique', summary: 'UTC, TAI, TT, temps GPS, jour julien, temps sidéral local, temps solaire vrai et équation du temps, en direct.', icon: I.Clock3, featured: true, tags: ['jour julien', 'sidéral', 'UTC', 'GPS', 'ΔT'], wide: true, component: lazy(() => import('./astronomy/time/AstroTime.jsx')) },
  { id: 'fuseaux-horaires', category: 'temps', title: 'Fuseaux horaires', summary: 'Heure dans les villes du monde, conversion d’un horaire entre fuseaux et planificateur de réunion sur 24 h.', icon: I.Globe, tags: ['heure', 'décalage horaire', 'heure d’été', 'monde'], wide: true, component: lazy(() => import('./temps/TimeZones.jsx')) },
  { id: 'calcul-dates', category: 'temps', title: 'Calcul de dates', summary: 'Écart entre deux dates (jours, semaines, jours ouvrés) ou date obtenue en ajoutant une durée.', icon: I.CalendarRange, tags: ['date', 'durée', 'jours ouvrés'], repo: 'Ganymede', component: calc(() => import('./temps/calcul-dates.js')) },
  { id: 'paques', category: 'temps', title: 'Pâques et jours fériés', summary: 'Date de Pâques (catholique et orthodoxe), fêtes mobiles et jours fériés français de l’année.', icon: I.Egg, tags: ['Pâques', 'fériés', 'Pentecôte'], repo: 'Ganymede', component: calc(() => import('./temps/paques.js')) },

  // --- Électronique ---
  { id: 'loi-ohm', category: 'electronique', title: "Loi d'Ohm et puissance", summary: 'Saisissez deux grandeurs parmi U, I, R et P : les deux autres sont calculées.', icon: I.Zap, tags: ['tension', 'courant', 'puissance'], repo: 'Ganymede', featured: true, component: lazy(() => import('./electronics/ohm/OhmsLaw.jsx')) },
  { id: 'code-couleur', category: 'electronique', title: 'Code couleur des résistances', summary: 'Résistances à 4, 5 ou 6 anneaux : valeur, tolérance, coefficient et série normalisée E.', icon: I.CircuitBoard, tags: ['résistance', 'anneaux', 'série E'], repo: 'Ganymede', component: lazy(() => import('./electronics/resistor/ResistorColorCode.jsx')) },
  { id: 'code-cms', category: 'electronique', title: 'Code des résistances CMS', summary: 'Décodage des marquages 3 et 4 chiffres, notation R et code EIA-96.', icon: I.Microchip, tags: ['CMS', 'SMD', 'EIA-96'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/code-cms.js')) },
  { id: 'code-condensateur', category: 'electronique', title: 'Code des condensateurs', summary: 'Valeur et tolérance d’un condensateur à partir de son marquage (104K, 4n7…).', icon: I.Hash, tags: ['condensateur', 'marquage', 'pF'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/code-condensateur.js')) },
  { id: 'valeurs-normalisees', category: 'electronique', title: 'Valeurs normalisées (séries E)', summary: 'Valeur la plus proche dans les séries E3 à E192 et liste de la décade.', icon: I.TableProperties, tags: ['E12', 'E24', 'E96'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/valeurs-normalisees.js')) },
  { id: 'serie-parallele', category: 'electronique', title: 'Associations série et parallèle', summary: 'Résistance, capacité ou inductance équivalente d’une liste de composants.', icon: I.Merge, tags: ['série', 'parallèle', 'équivalent'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/serie-parallele.js')) },
  { id: 'pont-diviseur', category: 'electronique', title: 'Pont diviseur de tension', summary: 'Tension de sortie avec ou sans charge, ou choix de R2 parmi les valeurs normalisées.', icon: I.Split, tags: ['diviseur', 'tension'], repo: 'Ganymede', component: lazy(() => import('./electronics/divider/VoltageDivider.jsx')) },
  { id: 'resistance-led', category: 'electronique', title: 'Résistance pour LED', summary: 'Résistance série d’une ou plusieurs LED : valeur normalisée, courant réel et puissance.', icon: I.Lightbulb, tags: ['LED', 'résistance'], repo: 'Ganymede', component: lazy(() => import('./electronics/led/LedResistor.jsx')) },
  { id: 'tolerance', category: 'electronique', title: 'Tolérance des composants', summary: 'Valeurs minimale et maximale d’un composant selon sa tolérance.', icon: I.Ratio, tags: ['tolérance', 'min', 'max'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/tolerance.js')) },
  { id: 'puissance', category: 'electronique', title: 'Puissance électrique', summary: 'Puissances active, apparente et réactive en continu, monophasé ou triphasé.', icon: I.PlugZap, tags: ['watt', 'cos phi', 'triphasé'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/puissance.js')) },
  { id: 'valeur-efficace', category: 'electronique', title: 'Valeur efficace (RMS)', summary: 'Valeurs efficace, crête et moyenne d’un signal sinusoïdal, carré, triangulaire ou en dents de scie.', icon: I.Activity, tags: ['RMS', 'crête', 'signal'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/valeur-efficace.js')) },
  { id: 'reactance', category: 'electronique', title: 'Réactance', summary: 'Réactance d’un condensateur ou d’une inductance à une fréquence donnée.', icon: I.Waves, tags: ['réactance', 'Xc', 'Xl'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/reactance.js')) },
  { id: 'impedance', category: 'electronique', title: 'Impédance RLC', summary: 'Module et phase de l’impédance d’un circuit RLC série ou parallèle, avec courbe en fréquence.', icon: I.Spline, tags: ['impédance', 'RLC', 'phase'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/impedance.js')) },
  { id: 'resonance', category: 'electronique', title: 'Circuit résonant LC', summary: 'Fréquence de résonance, facteur de qualité et bande passante d’un circuit RLC.', icon: I.Radio, tags: ['résonance', 'Q', 'bande passante'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/resonance.js')) },
  { id: 'filtre-passif', category: 'electronique', title: 'Filtres passifs', summary: 'Fréquence de coupure des filtres RC, RL et LC passe-bas ou passe-haut, avec diagramme de Bode.', icon: I.ChartSpline, tags: ['filtre', 'coupure', 'Bode'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/filtre-passif.js')) },
  { id: 'constante-de-temps', category: 'electronique', title: 'Constante de temps RC / RL', summary: 'Temps de charge à 63 %, 95 %, 99 %, énergie stockée et courbe de charge.', icon: I.Hourglass, tags: ['tau', 'charge', 'condensateur'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/constante-de-temps.js')) },
  { id: 'timer-555', category: 'electronique', title: 'Temporisateur 555', summary: 'NE555 astable ou monostable : fréquence, rapport cyclique, impulsion, calcul de R1 et R2.', icon: I.Timer, tags: ['555', 'oscillateur'], repo: 'Ganymede', component: lazy(() => import('./electronics/timer555/Timer555.jsx')) },
  { id: 'ampli-op', category: 'electronique', title: 'Amplificateur opérationnel', summary: 'Gain et tension de sortie des montages inverseur, non inverseur, différentiel et suiveur.', icon: I.Triangle, tags: ['AOP', 'gain', 'ampli'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/ampli-op.js')) },
  { id: 'polarisation-bjt', category: 'electronique', title: 'Polarisation d’un transistor', summary: 'Point de fonctionnement d’un transistor NPN polarisé par pont diviseur.', icon: I.Shapes, tags: ['BJT', 'transistor', 'Vce'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/polarisation-bjt.js')) },
  { id: 'zener', category: 'electronique', title: 'Régulateur à diode Zener', summary: 'Résistance série, courants et puissances d’un régulateur Zener.', icon: I.ZapOff, tags: ['Zener', 'régulation'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/zener.js')) },
  { id: 'transformateur', category: 'electronique', title: 'Transformateur', summary: 'Tension et courant secondaires, rapport de transformation et des impédances.', icon: I.Repeat, tags: ['spires', 'rapport'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/transformateur.js')) },
  { id: 'pont-wheatstone', category: 'electronique', title: 'Pont de Wheatstone', summary: 'Résistance inconnue d’un pont à l’équilibre.', icon: I.Scale, tags: ['pont', 'mesure'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/wheatstone.js')) },
  { id: 'triangle-etoile', category: 'electronique', title: 'Conversion triangle-étoile', summary: 'Transformation de Kennelly entre montages en triangle (Δ) et en étoile (Y).', icon: I.Triangle, tags: ['delta', 'étoile', 'Kennelly'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/triangle-etoile.js')) },
  { id: 'chute-de-tension', category: 'electronique', title: 'Chute de tension d’un câble', summary: 'Chute de tension, tension en bout de ligne et pertes selon la section et la longueur.', icon: I.Cable, tags: ['câble', 'section', 'cuivre'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/chute-de-tension.js')) },
  { id: 'section-cable', category: 'electronique', title: 'Section de câble', summary: 'Section minimale pour une chute de tension donnée, section normalisée et équivalent AWG.', icon: I.Plug, tags: ['AWG', 'mm²', 'câble'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/section-cable.js')) },
  { id: 'bobine', category: 'electronique', title: 'Inductance d’une bobine à air', summary: 'Inductance d’une bobine monocouche (formule de Wheeler) et longueur de fil.', icon: I.Infinity, tags: ['inductance', 'bobine', 'Wheeler'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/bobine.js')) },
  { id: 'autonomie-batterie', category: 'electronique', title: 'Autonomie d’une batterie', summary: 'Durée de fonctionnement selon la capacité et la consommation.', icon: I.BatteryCharging, tags: ['batterie', 'mAh'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/autonomie-batterie.js')) },
  { id: 'cout-energie', category: 'electronique', title: "Coût de l'énergie", summary: 'Consommation et coût d’un appareil par jour, par mois et par an.', icon: I.Euro, tags: ['kWh', 'facture', 'électricité'], repo: 'Ganymede', component: calc(() => import('./electronics/calc/cout-energie.js')) },

  // --- Mathématiques ---
  { id: 'traceur', category: 'maths', title: 'Traceur de courbes', summary: 'Tracez plusieurs fonctions f(x), déplacez-vous et zoomez, lisez les valeurs au survol.', icon: I.ChartLine, tags: ['graphique', 'fonction', 'courbe'], repo: 'Ganymede', wide: true, featured: true, component: lazy(() => import('./maths/grapher/FunctionGrapher.jsx')) },
  { id: 'second-degre', category: 'maths', title: 'Équation du second degré', summary: 'Résout ax² + bx + c = 0 avec discriminant, racines réelles ou complexes et tracé de la parabole.', icon: I.SquareRadical, tags: ['équation', 'discriminant', 'parabole'], repo: 'Ganymede', component: lazy(() => import('./maths/quadratic/QuadraticSolver.jsx')) },
  { id: 'matrices', category: 'maths', title: 'Calcul matriciel', summary: 'Somme, produit, déterminant, inverse, transposée et puissance de matrices jusqu’à 5×5.', icon: I.Grid3x3, tags: ['matrice', 'déterminant', 'inverse'], repo: 'Ganymede', component: lazy(() => import('./maths/matrices/Matrices.jsx')) },
  { id: 'pourcentages', category: 'maths', title: 'Pourcentages', summary: 'Pourcentage d’une valeur, taux d’évolution, hausse ou baisse et valeur initiale.', icon: I.Percent, tags: ['pourcentage', 'évolution', 'remise'], repo: 'Ganymede', component: calc(() => import('./maths/pourcentages.js')) },
  { id: 'pgcd-ppcm', category: 'maths', title: 'PGCD, PPCM et facteurs premiers', summary: "Algorithme d'Euclide détaillé, PPCM et décomposition en facteurs premiers.", icon: I.Divide, tags: ['arithmétique', 'euclide'], repo: 'Ganymede', component: lazy(() => import('./maths/gcd/GcdLcm.jsx')) },
  { id: 'complexes', category: 'maths', title: 'Nombres complexes', summary: 'Opérations sur deux complexes, formes algébrique et polaire, module et argument.', icon: I.Waves, tags: ['complexe', 'polaire'], component: lazy(() => import('./maths/complex/ComplexCalculator.jsx')) },
  { id: 'bases', category: 'maths', title: 'Bases numériques', summary: 'Conversion instantanée entre binaire, octal, décimal, hexadécimal et toute base de 2 à 36.', icon: I.Binary, tags: ['binaire', 'hexadécimal'], repo: 'conversions', component: lazy(() => import('./maths/bases/NumberBases.jsx')) },

  // --- Physique ---
  { id: 'chute-libre', category: 'physique', title: 'Chute libre', summary: "Durée de chute et vitesse d'impact sur Terre, la Lune, Mars ou Jupiter.", icon: I.ArrowDownToLine, tags: ['gravité', 'vitesse'], repo: 'Ganymede', component: calc(() => import('./physique/chute-libre.js')) },
  { id: 'projectile', category: 'physique', title: "Mouvement d'un projectile", summary: 'Portée, hauteur maximale, durée de vol et trajectoire d’un tir parabolique.', icon: I.Rocket, tags: ['balistique', 'parabole'], repo: 'Ganymede', component: calc(() => import('./physique/projectile.js')) },
  { id: 'newton', category: 'physique', title: 'Deuxième loi de Newton', summary: 'Force, masse ou accélération : F = m × a.', icon: I.Weight, tags: ['force', 'accélération'], repo: 'Ganymede', component: calc(() => import('./physique/newton.js')) },
  { id: 'gaz-parfaits', category: 'physique', title: 'Loi des gaz parfaits', summary: 'Pression, volume, quantité de matière ou température : PV = nRT.', icon: I.Thermometer, tags: ['PV=nRT', 'gaz'], repo: 'Ganymede', component: calc(() => import('./physique/gaz-parfaits.js')) },
  { id: 'bernoulli', category: 'physique', title: 'Équation de Bernoulli', summary: 'Pression, vitesse ou altitude d’un fluide entre deux points d’un écoulement.', icon: I.Droplets, tags: ['fluide', 'pression'], repo: 'Ganymede', component: calc(() => import('./physique/bernoulli.js')) },
  { id: 'onde', category: 'physique', title: "Longueur d'onde et fréquence", summary: 'λ = c / f pour la lumière, le son ou un câble, période et énergie du photon.', icon: I.AudioWaveform, tags: ['onde', 'fréquence', 'photon'], repo: 'Ganymede', component: calc(() => import('./physique/onde.js')) },

  // --- Météo ---
  { id: 'air-humide', category: 'meteo', title: 'Air humide (psychrométrie)', summary: 'Diagramme de l’air humide, point de rosée ou humidité relative, température humide, rapport de mélange, enthalpie et volume spécifique.', icon: I.Droplets, tags: ['point de rosée', 'humidité', 'psychrométrie', 'diagramme de Carrier', 'CVC', 'enthalpie'], wide: true, repo: 'convertisseur2', component: calc(() => import('./meteo/air-humide.js')) },
  { id: 'confort-thermique', category: 'meteo', title: 'Confort thermique (Thermal Comfort)', summary: 'Les capteurs de l’intégration Home Assistant Thermal Comfort, avec ses formules et ses seuils exacts : humidex, point de rosée, gelée, Thom, Scharlau, Simmer, aération.', icon: I.Thermometer, tags: ['Home Assistant', 'Thermal Comfort', 'humidex', 'point de gelée', 'aération', 'indice de Thom'], wide: true, component: calc(() => import('./meteo/confort-thermique.js')) },
  { id: 'ressenti', category: 'meteo', title: 'Ressenti, pression et altitude', summary: 'Indice de chaleur, humidex, refroidissement éolien, base des nuages, pression ramenée au niveau de la mer.', icon: I.ThermometerSun, tags: ['humidex', 'wind chill', 'indice de chaleur', 'baromètre', 'QNH'], component: calc(() => import('./meteo/ressenti.js')) },

  // --- Santé ---
  { id: 'imc', category: 'sante', title: 'Indice de masse corporelle', summary: 'IMC, interprétation selon l’OMS et plage de poids de référence.', icon: I.PersonStanding, tags: ['IMC', 'poids'], repo: 'Ganymede', component: calc(() => import('./sante/imc.js')) },
  { id: 'metabolisme', category: 'sante', title: 'Métabolisme et besoins caloriques', summary: 'Métabolisme de base (Mifflin-St Jeor, Harris-Benedict) et besoins selon l’activité.', icon: I.Flame, tags: ['calories', 'BMR'], repo: 'Ganymede', component: calc(() => import('./sante/metabolisme.js')) },
  { id: 'masse-grasse', category: 'sante', title: 'Masse grasse', summary: 'Pourcentage de masse grasse par la méthode des mensurations de l’US Navy.', icon: I.Dumbbell, tags: ['graisse', 'composition corporelle'], repo: 'Ganymede', component: calc(() => import('./sante/masse-grasse.js')) },

  // --- Chimie ---
  { id: 'masse-molaire', category: 'chimie', title: 'Masse molaire', summary: 'Masse molaire et composition massique d’une formule chimique (parenthèses et hydrates).', icon: I.Beaker, tags: ['mole', 'formule', 'g/mol'], repo: 'Ganymede', component: calc(() => import('./chimie/masse-molaire.js')) },
]

export const toolPath = (tool) => `/${tool.category}/${tool.id}`

export const getCategory = (id) => CATEGORIES.find((c) => c.id === id)

export const getTool = (categoryId, toolId) => TOOLS.find((t) => t.category === categoryId && t.id === toolId)

export const toolsOf = (categoryId) => TOOLS.filter((t) => t.category === categoryId)

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

/** Recherche plein texte (titre, tags, résumé, rubrique), classée par pertinence. */
export function searchTools(query) {
  const words = normalize(query.trim()).split(/\s+/).filter(Boolean)
  if (!words.length) return TOOLS.filter((t) => t.featured).concat(TOOLS.filter((t) => !t.featured))
  return TOOLS.map((t) => {
    const title = normalize(t.title)
    const tags = normalize((t.tags ?? []).join(' '))
    const rest = normalize(`${t.summary} ${getCategory(t.category)?.label ?? ''}`)
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

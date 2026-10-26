import { lazy } from 'react'
import * as I from 'lucide-react'

/**
 * ESPACE « ASTRONOMIE »
 * Rubriques et outils de l'espace. Ajouter un outil : une ligne dans TOOLS avec sa rubrique (voir src/registry.js).
 */

export const DOMAIN = { id: 'astronomie', label: 'Astronomie', icon: I.Telescope, description: 'Carte du ciel, éphémérides du Soleil, de la Lune et des planètes, éclipses, calendrier et satellites, calculés pour votre lieu.' }

export const RUBRIQUES = [
  { id: 'ciel', label: 'Ciel et observation', icon: I.Map, description: 'Ce qui est visible ce soir, carte du ciel, calendrier, éclipses, jour et nuit, temps astronomique.' },
  { id: 'astres', label: 'Soleil, Lune et planètes', icon: I.Sun, description: 'Positions, levers et couchers, phases et visibilité des astres du système solaire.' },
  { id: 'satellites-iss', label: 'Satellites', icon: I.Satellite, description: 'Passages visibles de l’ISS et des satellites brillants, position en direct.' },
]

export const TOOLS = [
  // --- Ciel et observation ---
  { id: 'ce-soir', rubrique: 'ciel', title: 'Ce soir dans le ciel', summary: 'Soleil, Lune, crépuscules et planètes visibles pour votre lieu, avec courbes de hauteur sur 24 h.', icon: I.MoonStar, tags: ['éphémérides', 'lever', 'coucher', 'planètes'], repo: 'Celeste_App', wide: true, featured: true, component: lazy(() => import('./tonight/Tonight.jsx')) },
  { id: 'carte-du-ciel', rubrique: 'ciel', title: 'Carte du ciel', summary: 'Le ciel en temps réel au-dessus de votre tête : 5 000 étoiles, constellations, planètes et objets Messier.', icon: I.Map, tags: ['étoiles', 'constellations', 'planisphère'], wide: true, featured: true, component: lazy(() => import('./sky-map/SkyMap.jsx')) },
  { id: 'calendrier', rubrique: 'ciel', title: 'Calendrier astronomique', summary: 'Phases de la Lune, saisons, éclipses, oppositions, conjonctions et élongations, mois par mois.', icon: I.CalendarDays, tags: ['phases', 'éclipses', 'conjonctions'], wide: true, component: lazy(() => import('./calendar/AstroCalendar.jsx')) },
  { id: 'eclipses', rubrique: 'ciel', title: 'Éclipses et passages', summary: 'Éclipses de Soleil et de Lune des années à venir, avec les horaires chez vous, et passages de Mercure et Vénus.', icon: I.Eclipse, tags: ['éclipse', 'totale', 'annulaire', 'transit'], wide: true, component: lazy(() => import('./eclipses/Eclipses.jsx')) },
  { id: 'jour-nuit', rubrique: 'ciel', title: 'Jour et nuit sur la Terre', summary: 'Carte du monde éclairé, crépuscules, points subsolaire et sublunaire, et heure du Soleil dans les grandes villes.', icon: I.SunMoon, tags: ['terminateur', 'carte', 'crépuscule', 'monde'], wide: true, component: lazy(() => import('./daynight/DayNight.jsx')) },
  { id: 'temps-astronomique', rubrique: 'ciel', title: 'Heure et temps astronomique', summary: 'UTC, TAI, TT, temps GPS, jour julien, temps sidéral local, temps solaire vrai et équation du temps, en direct.', icon: I.Clock3, featured: true, tags: ['jour julien', 'sidéral', 'UTC', 'GPS', 'ΔT'], wide: true, component: lazy(() => import('./time/AstroTime.jsx')) },

  // --- Soleil, Lune et planètes ---
  { id: 'systeme-solaire', rubrique: 'astres', title: 'Calculateur du système solaire', summary: 'Coordonnées héliocentriques, géocentriques, équatoriales ou horizontales, magnitudes et levers/couchers.', icon: I.Orbit, tags: ['planètes', 'coordonnées', 'magnitude'], repo: 'ha-meeus-astronomy', wide: true, component: lazy(() => import('./solar-system/SolarSystem.jsx')) },
  { id: 'soleil', rubrique: 'astres', title: 'Le Soleil', summary: 'Position, lever, coucher, crépuscules et durée du jour, équation du temps, saisons et éphémérides du mois.', icon: I.Sun, tags: ['lever', 'coucher', 'crépuscule', 'équinoxe', 'solstice'], wide: true, component: lazy(() => import('./sun/SunPage.jsx')) },
  { id: 'lune', rubrique: 'astres', title: 'La Lune', summary: 'Phase, distance, libration, lever et coucher, périgée et apogée, calendrier lunaire du mois.', icon: I.Moon, tags: ['phase', 'libration', 'périgée', 'pleine lune'], wide: true, component: lazy(() => import('./moon/MoonPage.jsx')) },
  { id: 'planetes', rubrique: 'astres', title: 'Résumé des planètes', summary: 'Magnitude, élongation, distance, diamètre et visibilité de chaque planète, avec une vue de dessus du système solaire.', icon: I.CircleDashed, tags: ['planètes', 'élongation', 'magnitude', 'orrery'], wide: true, component: lazy(() => import('./planets/PlanetsPage.jsx')) },

  // --- Satellites ---
  { id: 'satellites', rubrique: 'satellites-iss', title: "Passages de l'ISS et satellites", summary: 'Prévisions des passages visibles (orbites TLE de CelesTrak) et position en temps réel.', icon: I.Satellite, status: 'beta', tags: ['ISS', 'TLE', 'satellites'], wide: true, featured: true, component: lazy(() => import('./satellites/SatellitePasses.jsx')) },
  { id: 'satellites-brillants', rubrique: 'satellites-iss', title: 'Satellites brillants', summary: 'Tous les passages visibles à l’œil nu de la nuit : stations, télescopes et étages de fusée les plus lumineux.', icon: I.Sparkles, status: 'beta', tags: ['satellites', 'prévisions', 'TLE', 'magnitude'], wide: true, component: lazy(() => import('./satellites/BrightSatellites.jsx')) },
  { id: 'ou-est-iss', rubrique: 'satellites-iss', title: "Où est l'ISS ?", summary: 'Position en direct sur la carte du monde, trace au sol, zone de visibilité et prochain passage chez vous.', icon: I.SatelliteDish, tags: ['ISS', 'trace au sol', 'Tiangong', 'Hubble'], wide: true, component: lazy(() => import('./satellites/SatelliteMap.jsx')) },
]

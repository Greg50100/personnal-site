import { lazy } from 'react'
import * as I from 'lucide-react'
import { lazyCalculator } from '../../kit/lazyCalculator'

/**
 * ESPACE « PRATIQUE »
 * Rubriques et outils de l'espace. Ajouter un outil : une ligne dans TOOLS avec sa rubrique (voir src/registry.js).
 */

export const DOMAIN = { id: 'pratique', label: 'Pratique', icon: I.Wrench, description: 'Convertisseur d’unités et de devises, calculatrice, pourcentages, dates, fuseaux horaires et santé.' }

export const RUBRIQUES = [
  { id: 'conversions', label: 'Conversions et calcul', icon: I.ArrowLeftRight, description: 'Convertisseur d’unités et de devises, calculatrice scientifique, pourcentages.' },
  { id: 'dates', label: 'Dates et heures', icon: I.CalendarDays, description: 'Fuseaux horaires, calcul de dates, Pâques et jours fériés.' },
  { id: 'sante', label: 'Santé', icon: I.HeartPulse, description: 'IMC, besoins caloriques et masse grasse.' },
]

const calc = lazyCalculator

export const TOOLS = [
  // --- Conversions et calcul ---
  { id: 'convertisseur', rubrique: 'conversions', title: "Convertisseur d'unités", summary: '75 grandeurs et plus de 600 unités : mécanique, électricité, thermique, chimie, informatique, rayonnements… et devises.', icon: I.ArrowLeftRight, tags: ['unités', 'conversion', 'devises', 'taux de change'], repo: 'convertisseur2', featured: true, component: lazy(() => import('./converter/UnitConverter.jsx')) },
  { id: 'calculatrice', rubrique: 'conversions', title: 'Calculatrice scientifique', summary: 'Saisie libre ou clavier, trigonométrie en degrés ou radians, historique et réutilisation des résultats.', icon: I.Calculator, tags: ['calcul', 'trigonométrie'], featured: true, component: lazy(() => import('./calculator/ScientificCalculator.jsx')) },
  { id: 'pourcentages', rubrique: 'conversions', title: 'Pourcentages', summary: 'Pourcentage d’une valeur, taux d’évolution, hausse ou baisse et valeur initiale.', icon: I.Percent, tags: ['pourcentage', 'évolution', 'remise'], repo: 'Ganymede', component: calc(() => import('./pourcentages.js')) },

  // --- Dates et heures ---
  { id: 'fuseaux-horaires', rubrique: 'dates', title: 'Fuseaux horaires', summary: 'Heure dans les villes du monde, conversion d’un horaire entre fuseaux et planificateur de réunion sur 24 h.', icon: I.Globe, tags: ['heure', 'décalage horaire', 'heure d’été', 'monde'], wide: true, component: lazy(() => import('./dates/TimeZones.jsx')) },
  { id: 'calcul-dates', rubrique: 'dates', title: 'Calcul de dates', summary: 'Écart entre deux dates (jours, semaines, jours ouvrés) ou date obtenue en ajoutant une durée.', icon: I.CalendarRange, tags: ['date', 'durée', 'jours ouvrés'], repo: 'Ganymede', component: calc(() => import('./dates/calcul-dates.js')) },
  { id: 'paques', rubrique: 'dates', title: 'Pâques et jours fériés', summary: 'Date de Pâques (catholique et orthodoxe), fêtes mobiles et jours fériés français de l’année.', icon: I.Egg, tags: ['Pâques', 'fériés', 'Pentecôte'], repo: 'Ganymede', component: calc(() => import('./dates/paques.js')) },

  // --- Santé ---
  { id: 'imc', rubrique: 'sante', title: 'Indice de masse corporelle', summary: 'IMC, interprétation selon l’OMS et plage de poids de référence.', icon: I.PersonStanding, tags: ['IMC', 'poids'], repo: 'Ganymede', component: calc(() => import('./sante/imc.js')) },
  { id: 'metabolisme', rubrique: 'sante', title: 'Métabolisme et besoins caloriques', summary: 'Métabolisme de base (Mifflin-St Jeor, Harris-Benedict) et besoins selon l’activité.', icon: I.Flame, tags: ['calories', 'BMR'], repo: 'Ganymede', component: calc(() => import('./sante/metabolisme.js')) },
  { id: 'masse-grasse', rubrique: 'sante', title: 'Masse grasse', summary: 'Pourcentage de masse grasse par la méthode des mensurations de l’US Navy.', icon: I.Dumbbell, tags: ['graisse', 'composition corporelle'], repo: 'Ganymede', component: calc(() => import('./sante/masse-grasse.js')) },
]

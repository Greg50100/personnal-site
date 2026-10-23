import { createContext, useContext } from 'react'

/** Lieux prédéfinis proposés dans le sélecteur (latitude Nord +, longitude Est +). */
export const PRESET_LOCATIONS = [
  { name: 'Cherbourg-en-Cotentin', lat: 49.6337, lon: -1.6222, elevation: 10 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, elevation: 35 },
  { name: 'Caen', lat: 49.1829, lon: -0.3707, elevation: 20 },
  { name: 'Rennes', lat: 48.1173, lon: -1.6778, elevation: 40 },
  { name: 'Brest', lat: 48.3904, lon: -4.4861, elevation: 50 },
  { name: 'Nantes', lat: 47.2184, lon: -1.5536, elevation: 20 },
  { name: 'Lille', lat: 50.6292, lon: 3.0573, elevation: 25 },
  { name: 'Strasbourg', lat: 48.5734, lon: 7.7521, elevation: 140 },
  { name: 'Lyon', lat: 45.764, lon: 4.8357, elevation: 170 },
  { name: 'Bordeaux', lat: 44.8378, lon: -0.5792, elevation: 15 },
  { name: 'Toulouse', lat: 43.6047, lon: 1.4442, elevation: 150 },
  { name: 'Marseille', lat: 43.2965, lon: 5.3698, elevation: 20 },
  { name: 'Nice', lat: 43.7102, lon: 7.262, elevation: 10 },
  { name: 'Pic du Midi (observatoire)', lat: 42.9364, lon: 0.1425, elevation: 2877 },
]

export const DEFAULT_LOCATION = PRESET_LOCATIONS[0]

export const LocationContext = createContext({
  location: DEFAULT_LOCATION,
  setLocation: () => {},
})

/** Lieu d'observation partagé par tous les outils d'astronomie. */
export const useObserverLocation = () => useContext(LocationContext)

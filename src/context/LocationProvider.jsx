import { useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { DEFAULT_LOCATION, LocationContext } from './location'

const isValid = (loc) =>
  loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lon) && Math.abs(loc.lat) <= 90 && Math.abs(loc.lon) <= 180

export function LocationProvider({ children }) {
  const [stored, setStored] = useLocalStorage('observer-location', DEFAULT_LOCATION)
  const location = useMemo(() => (isValid(stored) ? { elevation: 0, ...stored } : DEFAULT_LOCATION), [stored])
  const value = useMemo(() => ({ location, setLocation: setStored }), [location, setStored])

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

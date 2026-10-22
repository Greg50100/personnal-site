import { useCallback, useEffect, useState } from 'react'

/**
 * Horloge partagée par les outils d'astronomie : temps réel (mis à jour périodiquement)
 * ou date figée choisie par l'utilisateur.
 */
export function useAstroClock({ live: initialLive = true, intervalMs = 10_000 } = {}) {
  const [live, setLive] = useState(initialLive)
  const [date, setDateState] = useState(() => new Date())

  useEffect(() => {
    if (!live) return undefined
    const tick = () => setDateState(new Date())
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [live, intervalMs])

  const setDate = useCallback((next) => {
    setLive(false)
    setDateState((prev) => (typeof next === 'function' ? next(prev) : next))
  }, [])

  const goLive = useCallback(() => {
    setDateState(new Date())
    setLive(true)
  }, [])

  return { date, live, setDate, goLive, setLive }
}

import { useEffect, useState } from 'react'

/** Date courante rafraîchie toutes les `intervalMs` millisecondes (désactivable). */
export function useNow(intervalMs = 1000, enabled = true) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!enabled) return undefined
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, enabled])

  return now
}

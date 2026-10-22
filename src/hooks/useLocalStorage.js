import { useCallback, useState } from 'react'

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** État React persisté dans le localStorage (silencieux si le stockage est indisponible). */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => read(key, initialValue))

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        try {
          localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          // stockage plein ou bloqué : on garde l'état en mémoire
        }
        return resolved
      })
    },
    [key],
  )

  return [value, update]
}

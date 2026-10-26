import { useEffect, useState } from 'react'

/** Éléments orbitaux CelesTrak au format TLE (requête « CATNR=25544 » ou « GROUP=visual »). */
const url = (query) => `https://celestrak.org/NORAD/elements/gp.php?${query}&FORMAT=TLE`

export function readTleCache(key) {
  try {
    return JSON.parse(localStorage.getItem(`tle-${key}`))
  } catch {
    return null
  }
}

function writeTleCache(key, text) {
  try {
    localStorage.setItem(`tle-${key}`, JSON.stringify({ text, at: Date.now() }))
  } catch {
    // stockage plein ou bloqué : la donnée reste en mémoire
  }
}

/**
 * Télécharge (puis garde en cache local) les TLE d'une requête CelesTrak.
 * `validate(text)` rejette une réponse illisible. `reload()` force un nouveau téléchargement.
 */
export function useCelestrak(key, query, { enabled = true, maxAgeHours = 6, validate = () => true } = {}) {
  const [fetched, setFetched] = useState({})
  const [errors, setErrors] = useState({})
  const [reloads, setReloads] = useState(0)

  useEffect(() => {
    if (!enabled) return undefined
    const cached = readTleCache(key)
    if (!reloads && cached && Date.now() - cached.at < maxAgeHours * 3_600_000) return undefined
    let cancelled = false
    fetch(url(query))
      .then((r) => {
        if (!r.ok) throw new Error(`CelesTrak a répondu ${r.status}`)
        return r.text()
      })
      .then((text) => {
        if (!validate(text)) throw new Error('Réponse de CelesTrak illisible')
        writeTleCache(key, text)
        if (!cancelled) {
          setFetched((f) => ({ ...f, [key]: { text, at: Date.now() } }))
          setErrors((e) => ({ ...e, [key]: null }))
        }
      })
      .catch((err) => !cancelled && setErrors((e) => ({ ...e, [key]: err.message || 'Réseau indisponible' })))
    return () => {
      cancelled = true
    }
    // `validate` est une fonction de lecture sans état : inutile de relancer la requête si elle change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, query, enabled, reloads, maxAgeHours])

  const data = fetched[key] ?? (enabled ? readTleCache(key) : null)
  return { text: data?.text ?? null, at: data?.at ?? null, error: enabled ? errors[key] : null, reload: () => setReloads((r) => r + 1) }
}

/** Fuseaux horaires : heure murale, décalages et conversion, à partir des données IANA du navigateur (Intl). */

/** Villes proposées (fuseaux IANA) avec un nom français. */
export const CITIES = [
  ['UTC', 'UTC (temps universel)'],
  ['Europe/Paris', 'Paris'],
  ['Europe/London', 'Londres'],
  ['Europe/Lisbon', 'Lisbonne'],
  ['Europe/Berlin', 'Berlin'],
  ['Europe/Athens', 'Athènes'],
  ['Europe/Moscow', 'Moscou'],
  ['Atlantic/Reykjavik', 'Reykjavik'],
  ['Africa/Casablanca', 'Casablanca'],
  ['Africa/Dakar', 'Dakar'],
  ['Africa/Abidjan', 'Abidjan'],
  ['Africa/Cairo', 'Le Caire'],
  ['Africa/Johannesburg', 'Johannesburg'],
  ['Asia/Dubai', 'Dubaï'],
  ['Asia/Kolkata', 'New Delhi'],
  ['Asia/Bangkok', 'Bangkok'],
  ['Asia/Shanghai', 'Pékin'],
  ['Asia/Singapore', 'Singapour'],
  ['Asia/Tokyo', 'Tokyo'],
  ['Australia/Perth', 'Perth'],
  ['Australia/Sydney', 'Sydney'],
  ['Pacific/Auckland', 'Auckland'],
  ['Pacific/Noumea', 'Nouméa'],
  ['Pacific/Tahiti', 'Papeete'],
  ['Pacific/Honolulu', 'Honolulu'],
  ['America/Anchorage', 'Anchorage'],
  ['America/Los_Angeles', 'Los Angeles'],
  ['America/Denver', 'Denver'],
  ['America/Chicago', 'Chicago'],
  ['America/Mexico_City', 'Mexico'],
  ['America/New_York', 'New York'],
  ['America/Toronto', 'Montréal / Toronto'],
  ['America/Martinique', 'Martinique'],
  ['America/Guadeloupe', 'Guadeloupe'],
  ['America/Cayenne', 'Cayenne'],
  ['America/Sao_Paulo', 'São Paulo'],
  ['America/Argentina/Buenos_Aires', 'Buenos Aires'],
  ['America/Miquelon', 'Saint-Pierre-et-Miquelon'],
  ['Indian/Reunion', 'La Réunion'],
  ['Indian/Mayotte', 'Mayotte'],
]
export const CITY_NAMES = Object.fromEntries(CITIES)
export const DEFAULT_ZONES = ['Europe/Paris', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Tokyo', 'Australia/Sydney', 'Indian/Reunion', 'UTC']

export const LOCAL = Intl.DateTimeFormat().resolvedOptions().timeZone
export const ALL_ZONES = (() => {
  try {
    return Intl.supportedValuesOf('timeZone')
  } catch {
    return CITIES.map(([z]) => z)
  }
})()

export const zoneName = (zone) => CITY_NAMES[zone] ?? zone.split('/').pop().replace(/_/g, ' ')

const partsCache = new Map()
function formatter(zone) {
  if (!partsCache.has(zone)) {
    partsCache.set(
      zone,
      new Intl.DateTimeFormat('en-US', { timeZone: zone, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' }),
    )
  }
  return partsCache.get(zone)
}

/** Heure murale (champs) dans un fuseau à un instant donné. */
export function wallTime(date, zone) {
  const p = Object.fromEntries(formatter(zone).formatToParts(date).map((x) => [x.type, x.value]))
  return { year: +p.year, month: +p.month, day: +p.day, hour: +p.hour % 24, minute: +p.minute, second: +p.second }
}

/** Décalage du fuseau par rapport à UTC (minutes) à un instant donné. */
export function zoneOffset(date, zone) {
  const w = wallTime(date, zone)
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
  return Math.round((asUtc - Math.floor(date.getTime() / 1000) * 1000) / 60_000)
}

/** Instant correspondant à une heure murale (« 2026-10-23T14:30 ») dans un fuseau. */
export function fromWallTime(text, zone) {
  const [d, t = '00:00'] = text.split('T')
  const [y, mo, da] = d.split('-').map(Number)
  const [h, mi] = t.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, da, h, mi)
  let off = zoneOffset(new Date(guess), zone)
  const second = zoneOffset(new Date(guess - off * 60_000), zone)
  if (second !== off) off = second
  return new Date(guess - off * 60_000)
}


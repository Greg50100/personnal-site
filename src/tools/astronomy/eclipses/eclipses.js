/**
 * Recherche des éclipses de Soleil et de Lune et des passages de Mercure et Vénus,
 * avec les circonstances locales pour l'observateur.
 */
import { Astronomy, bodyPosition } from '../lib/astro'

const MIN = 60_000

export const SOLAR_KIND = { partial: 'partielle', annular: 'annulaire', total: 'totale', hybrid: 'hybride' }
export const LUNAR_KIND = { penumbral: 'par la pénombre', partial: 'partielle', total: 'totale' }

/** Éclipses de Soleil entre deux dates, avec leur visibilité depuis `observer`. */
export function solarEclipses(start, end, observer) {
  const list = []
  let e = Astronomy.SearchGlobalSolarEclipse(start)
  while (e.peak.date < end) {
    const local = Astronomy.SearchLocalSolarEclipse(new Date(e.peak.date.getTime() - 86_400_000), observer)
    const sameEvent = Math.abs(local.peak.time.date - e.peak.date) < 86_400_000
    // Visible si le Soleil est levé à un moment de la phase partielle
    const contacts = sameEvent ? [local.partial_begin, local.total_begin, local.peak, local.total_end, local.partial_end].filter(Boolean) : []
    const visible = contacts.some((c) => c.altitude > 0)
    list.push({
      type: 'solar',
      kind: e.kind,
      peak: e.peak.date,
      center: e.latitude != null ? { lat: e.latitude, lon: e.longitude } : null,
      obscuration: e.obscuration,
      local: visible
        ? {
            kind: local.kind,
            obscuration: local.obscuration,
            begin: local.partial_begin,
            totalBegin: local.total_begin,
            peak: local.peak,
            totalEnd: local.total_end,
            end: local.partial_end,
          }
        : null,
    })
    e = Astronomy.NextGlobalSolarEclipse(e.peak)
  }
  return list
}

/** Éclipses de Lune entre deux dates : instants des contacts et hauteur de la Lune pour l'observateur. */
export function lunarEclipses(start, end, observer) {
  const list = []
  let e = Astronomy.SearchLunarEclipse(start)
  while (e.peak.date < end) {
    const peak = e.peak.date
    const at = (offsetMin) => {
      const t = new Date(peak.getTime() + offsetMin * MIN)
      return { time: t, altitude: bodyPosition('Moon', t, observer).alt }
    }
    const contacts = [
      { label: 'Entrée dans la pénombre', ...at(-e.sd_penum) },
      e.sd_partial > 0 && { label: 'Entrée dans l’ombre', ...at(-e.sd_partial) },
      e.sd_total > 0 && { label: 'Début de la totalité', ...at(-e.sd_total) },
      { label: 'Maximum', ...at(0) },
      e.sd_total > 0 && { label: 'Fin de la totalité', ...at(e.sd_total) },
      e.sd_partial > 0 && { label: 'Sortie de l’ombre', ...at(e.sd_partial) },
      { label: 'Sortie de la pénombre', ...at(e.sd_penum) },
    ].filter(Boolean)
    list.push({
      type: 'lunar',
      kind: e.kind,
      peak,
      obscuration: e.obscuration,
      durations: { penumbral: 2 * e.sd_penum, partial: 2 * e.sd_partial, total: 2 * e.sd_total },
      contacts,
      visible: contacts.some((c) => c.altitude > 0),
    })
    e = Astronomy.NextLunarEclipse(e.peak)
  }
  return list
}

/** Passages de Mercure et de Vénus devant le Soleil (vus du centre de la Terre). */
export function transits(start, count = 3) {
  const out = []
  for (const body of ['Mercury', 'Venus']) {
    let t = Astronomy.SearchTransit(body, start)
    for (let i = 0; i < (body === 'Venus' ? 1 : count); i++) {
      out.push({ body, start: t.start.date, peak: t.peak.date, finish: t.finish.date, separation: t.separation })
      t = Astronomy.NextTransit(body, t.finish)
    }
  }
  return out.sort((a, b) => a.peak - b.peak)
}

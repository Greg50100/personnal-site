import { describe, expect, test } from 'vitest'
import * as A from 'astronomy-engine'
import { findEvents } from './calendar/events'
import { bodyConstellation, makeJ2000ToHorizon, makeObserver, moonPhaseName, sunDay } from './lib/astro'

const cherbourg = makeObserver({ lat: 49.6337, lon: -1.6222, elevation: 10 })
const day = (d) => d.toISOString().slice(0, 10)
const find = (events, text) => events.find((e) => e.title.includes(text))

describe('calendrier astronomique', () => {
  const events = findEvents(new Date('2026-10-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'), cherbourg)

  test('phénomènes connus d’octobre 2026', () => {
    expect(day(find(events, 'Opposition de Saturne').time)).toBe('2026-10-04')
    expect(day(find(events, "Mercure à l'élongation maximale est").time)).toBe('2026-10-12')
    expect(day(find(events, 'Conjonction inférieure de Vénus').time)).toBe('2026-10-24')
    expect(day(find(events, 'Pleine lune').time)).toBe('2026-10-26')
    expect(day(find(events, 'Nouvelle lune').time)).toBe('2026-10-10')
  })

  test('rapprochement Lune–Jupiter très serré le 6 octobre', () => {
    const e = find(events, 'près de Jupiter')
    expect(day(e.time)).toBe('2026-10-06')
    expect(parseFloat(e.detail.replace(',', '.'))).toBeLessThan(1)
  })

  test('éclipses de 2026', () => {
    const year = findEvents(new Date('2026-01-01T00:00:00Z'), new Date('2027-01-01T00:00:00Z'), cherbourg).filter((e) => e.type === 'eclipse')
    const solar = year.find((e) => e.title === 'Éclipse totale de Soleil')
    expect(day(solar.time)).toBe('2026-08-12')
    expect(solar.detail).toMatch(/Visible chez vous/)
    expect(day(year.find((e) => e.title === 'Éclipse totale de Lune').time)).toBe('2026-03-03')
  })
})

describe('outils astronomiques', () => {
  test('matrice J2000 → horizon conforme au calcul de référence', () => {
    const date = new Date('2026-10-23T03:00:00Z')
    const ours = makeJ2000ToHorizon(date, cherbourg)(101.287, -16.716) // Sirius
    A.DefineStar(A.Body.Star1, 101.287 / 15, -16.716, 8.6)
    const eq = A.Equator(A.Body.Star1, date, cherbourg, true, true)
    const ref = A.Horizon(date, cherbourg, eq.ra, eq.dec, 'normal')
    expect(ours.alt).toBeCloseTo(ref.altitude, 1)
    expect(ours.az).toBeCloseTo(ref.azimuth, 1)
  })

  test('éphémérides du Soleil à Cherbourg', () => {
    const s = sunDay(cherbourg, new Date(2026, 9, 22))
    expect(s.sunrise.getUTCHours()).toBe(6)
    expect(s.sunset.getUTCHours()).toBe(17)
    expect(s.dayLength).toBeGreaterThan(10)
  })

  test('constellations et phases', () => {
    expect(bodyConstellation('Saturn', new Date('2026-10-22T20:00:00Z'), cherbourg).name).toBe('Baleine')
    expect(moonPhaseName(180)).toBe('Pleine lune')
    expect(moonPhaseName(45)).toBe('Premier croissant')
  })
})

describe('satellites', async () => {
  const { findPasses, parseTle, lookAt } = await import('./satellites/passes')
  // TLE historique de l'ISS (juin 2019) : les prévisions sont testées juste après son époque.
  const tle = parseTle(`ISS (ZARYA)
1 25544U 98067A   19156.50900463  .00003075  00000-0  59442-4 0  9992
2 25544  51.6433  59.2583 0008217  16.4489 347.6017 15.51174618173442`)
  const loc = { lat: 49.6337, lon: -1.6222, elevation: 10 }

  test('lecture du TLE', () => {
    expect(tle.name).toBe('ISS (ZARYA)')
    expect(tle.epoch.toISOString().slice(0, 10)).toBe('2019-06-05')
    expect(parseTle('n’importe quoi')).toBeNull()
  })

  test('position cohérente (orbite basse)', () => {
    const p = lookAt(tle.satrec, new Date('2019-06-05T12:00:00Z'), loc)
    expect(p.height).toBeGreaterThan(380)
    expect(p.height).toBeLessThan(440)
    expect(p.speed).toBeCloseTo(7.66, 1)
  })

  test('passages trouvés et ordonnés', () => {
    const passes = findPasses(tle.satrec, loc, new Date('2019-05-25T12:00:00Z'), { days: 3, stdMag: -1.8 })
    expect(passes.length).toBeGreaterThan(3)
    for (const p of passes) {
      expect(p.aos < p.max.t && p.max.t < p.los).toBe(true)
      expect(p.max.el).toBeGreaterThanOrEqual(10)
    }
    // Fin mai 2019 : passages du soir visibles, puis passages tardifs dans l'ombre de la Terre
    const visible = passes.filter((p) => p.visible)
    expect(visible.length).toBeGreaterThan(2)
    for (const p of visible) expect(p.magnitude).toBeLessThan(0)
    expect(passes.some((p) => !p.visible && p.sunAltAtMax < -18)).toBe(true)
  })
})

import { describe, expect, test } from 'vitest'
import { deltaT, gast, gmst, gpsTime, julianCalendarDate, julianDay, modifiedJulianDay, solarTime, taiMinusUtc } from './lib/time'
import { angularDistance, capPath, footprintRadius, nightPaths, splitTrack, subPoint } from './lib/geo'

describe('échelles de temps', () => {
  test('jour julien', () => {
    expect(julianDay(new Date('2000-01-01T12:00:00Z'))).toBe(2_451_545)
    expect(modifiedJulianDay(new Date('1858-11-17T00:00:00Z'))).toBeCloseTo(0, 9)
  })
  test('secondes intercalaires et ΔT', () => {
    expect(taiMinusUtc(new Date('2026-10-23T00:00:00Z'))).toBe(37)
    expect(taiMinusUtc(new Date('2016-12-31T23:59:59Z'))).toBe(36)
    expect(taiMinusUtc(new Date('1960-01-01T00:00:00Z'))).toBeNull()
    expect(deltaT(new Date('2026-10-23T00:00:00Z'))).toBeCloseTo(69.184, 6)
    expect(deltaT(new Date('1900-01-01T00:00:00Z'))).toBeCloseTo(-2.8, 0)
  })
  test('temps GPS', () => {
    expect(gpsTime(new Date('1980-01-06T00:00:00Z'))).toMatchObject({ week: 0, seconds: 0 })
    // 18 s d'écart entre GPS et UTC depuis 2017
    expect(gpsTime(new Date('2026-10-23T00:00:00Z')).total % 60).toBeCloseTo(18, 6)
  })
  test('temps sidéral (Meeus, exemple 12.a)', () => {
    const d = new Date('1987-04-10T00:00:00Z')
    expect(gmst(d) * 3600).toBeCloseTo((13 * 3600 + 10 * 60 + 46.3668), 1)
    expect(Math.abs(gast(d) - gmst(d)) * 3600).toBeLessThan(1.2)
  })
  test('équation du temps', () => {
    expect(solarTime(new Date('2026-11-03T12:00:00Z'), 0).equationOfTime).toBeCloseTo(16.4, 0)
    expect(solarTime(new Date('2026-02-11T12:00:00Z'), 0).equationOfTime).toBeCloseTo(-14.2, 0)
  })
  test('calendrier julien', () => {
    expect(julianCalendarDate(2_451_545)).toEqual({ year: 1999, month: 12, day: 19 })
  })
})

describe('géométrie terrestre', () => {
  test('point subsolaire à l’équinoxe de mars et au solstice de juin', () => {
    const eq = subPoint('Sun', new Date('2026-03-20T14:46:00Z'))
    expect(Math.abs(eq.lat)).toBeLessThan(0.05)
    expect(subPoint('Sun', new Date('2026-06-21T12:00:00Z')).lat).toBeCloseTo(23.44, 1)
    // À midi UTC, le Soleil est proche du méridien de Greenwich (à l'équation du temps près)
    expect(Math.abs(subPoint('Sun', new Date('2026-06-21T12:00:00Z')).lon)).toBeLessThan(1)
  })
  test('calottes', () => {
    expect(angularDistance({ lat: 0, lon: 0 }, { lat: 0, lon: 90 })).toBeCloseTo(90, 9)
    expect(capPath({ lat: 0, lon: 0 }, 10)).toMatch(/^M/)
    expect(capPath({ lat: 85, lon: 0 }, 20)).toContain(' 0.00') // contient le pôle Nord : touche le bord de la carte
    expect(nightPaths(new Date()).layers).toHaveLength(4)
    expect(footprintRadius(420)).toBeCloseTo(20.27, 1)
  })
  test('trace découpée à l’antiméridien', () => {
    expect(splitTrack([{ lon: 170 }, { lon: 179 }, { lon: -178 }, { lon: -170 }])).toHaveLength(2)
  })
})

describe('éclipses', async () => {
  const { lunarEclipses, solarEclipses, transits } = await import('./eclipses/eclipses')
  const { makeObserver } = await import('./lib/astro')
  const paris = makeObserver({ lat: 48.8566, lon: 2.3522, elevation: 35 })
  test('éclipse totale de Soleil du 12 août 2026, visible de Paris', () => {
    const list = solarEclipses(new Date('2026-01-01T00:00:00Z'), new Date('2027-01-01T00:00:00Z'), paris)
    const aug = list.find((e) => e.peak.toISOString().startsWith('2026-08-12'))
    expect(aug.kind).toBe('total')
    expect(aug.local.obscuration).toBeGreaterThan(0.9)
    expect(aug.local.kind).toBe('partial')
  })
  test('éclipse totale de Lune du 3 mars 2026', () => {
    const list = lunarEclipses(new Date('2026-01-01T00:00:00Z'), new Date('2027-01-01T00:00:00Z'), paris)
    const mar = list.find((e) => e.peak.toISOString().startsWith('2026-03-03'))
    expect(mar.kind).toBe('total')
    expect(mar.contacts).toHaveLength(7)
  })
  test('prochain passage de Mercure : 13 novembre 2032', () => {
    const t = transits(new Date('2026-01-01T00:00:00Z')).find((x) => x.body === 'Mercury')
    expect(t.peak.toISOString().slice(0, 10)).toBe('2032-11-13')
  })
})

describe('fuseaux horaires', async () => {
  const { fromWallTime, wallTime, zoneOffset } = await import('../temps/timezones')
  test('heure de Paris et changement d’heure', () => {
    expect(wallTime(new Date('2026-10-23T12:00:00Z'), 'Europe/Paris').hour).toBe(14)
    expect(zoneOffset(new Date('2026-01-15T12:00:00Z'), 'Europe/Paris')).toBe(60)
    expect(zoneOffset(new Date('2026-07-15T12:00:00Z'), 'Asia/Kolkata')).toBe(330)
    expect(fromWallTime('2026-03-29T03:30', 'Europe/Paris').toISOString()).toBe('2026-03-29T01:30:00.000Z')
    expect(fromWallTime('2026-10-23T09:00', 'America/New_York').toISOString()).toBe('2026-10-23T13:00:00.000Z')
  })
})

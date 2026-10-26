import { describe, expect, test } from 'vitest'
import { CONNECTORS, FAMILIES, KINDS } from './data/connectors'

const pinOf = (id, n) => CONNECTORS.find((c) => c.id === id).pins.find((p) => String(p.n) === String(n))

describe('connecteurs', () => {
  test('identifiants uniques, famille, nature des broches et sources', () => {
    const ids = CONNECTORS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    const families = new Set(FAMILIES.map((f) => f.id))
    for (const c of CONNECTORS) {
      expect(families.has(c.family), c.id).toBe(true)
      const numbers = c.pins.map((p) => String(p.n))
      expect(new Set(numbers).size, `${c.id} : broche en double`).toBe(numbers.length)
      for (const p of c.pins) expect(Object.keys(KINDS), `${c.id} ${p.n}`).toContain(p.kind)
      expect(c.sources.length, c.id).toBeGreaterThan(0)
      for (const s of c.sources) expect(s.url, c.id).toMatch(/^https:\/\//)
    }
  })

  test('chaque contact dessiné correspond à une broche, et inversement', () => {
    for (const c of CONNECTORS.filter((x) => x.view?.rows)) {
      const drawn = c.view.rows.flat().map(String).sort()
      const listed = c.pins.map((p) => String(p.n)).sort()
      expect(drawn, c.id).toEqual(listed)
    }
    for (const c of CONNECTORS.filter((x) => x.view?.shape === 'jack')) {
      expect(c.view.segments.slice().sort(), c.id).toEqual(c.pins.map((p) => p.n).sort())
    }
  })

  test('brochages de référence', () => {
    // USB-C : masses aux quatre coins, CC1 en A5, CC2 en B5
    for (const n of ['A1', 'A12', 'B1', 'B12']) expect(pinOf('usb-c', n).signal).toBe('GND')
    expect(pinOf('usb-c', 'A5').signal).toBe('CC1')
    expect(pinOf('usb-c', 'B5').signal).toBe('CC2')
    // RS-232 DE-9 côté PC : 2 RXD, 3 TXD, 5 masse
    expect([2, 3, 5].map((n) => pinOf('rs232', n).signal)).toEqual(['RXD', 'TXD', 'GND'])
    // RJ45 T568B : paire orange en 1-2, verte en 3-6
    expect([1, 2, 3, 6].map((n) => pinOf('rj45', n).color)).toEqual(['blanc-orange', 'orange', 'blanc-vert', 'vert'])
    // ATX : PS_ON# en 16 (vert), +5 VSB en 9 (violet)
    expect(pinOf('atx24', 16)).toMatchObject({ signal: 'PS_ON#', color: 'vert' })
    expect(pinOf('atx24', 9)).toMatchObject({ signal: '+5 VSB', color: 'violet' })
    // OBD-II : CAN en 6 et 14, batterie en 16
    expect(pinOf('obd2', 16).kind).toBe('pwr')
    expect([6, 14].map((n) => pinOf('obd2', n).signal)).toEqual(['CAN haut', 'CAN bas'])
    // XLR : broche 2 chaude
    expect(pinOf('xlr3', 2).signal).toBe('Point chaud')
  })
})

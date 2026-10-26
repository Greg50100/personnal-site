import { describe, expect, test } from 'vitest'
import { COMPONENTS, GROUPS, PACKAGES, PIN_KINDS } from './data/components'
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

describe('composants', () => {
  const part = (id) => COMPONENTS.find((c) => c.id === id)
  const order = (id) => part(id).pins.map((p) => p[1]).join(' ')

  test('broches numérotées de 1 à n selon le boîtier, natures connues, sources', () => {
    const ids = COMPONENTS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    const groups = new Set(GROUPS.map((g) => g.id))
    for (const c of COMPONENTS) {
      expect(groups.has(c.group), c.id).toBe(true)
      expect(PACKAGES[c.package], c.id).toBeDefined()
      expect(c.pins.map((p) => p[0]), c.id).toEqual(Array.from({ length: PACKAGES[c.package].pins }, (_, i) => i + 1))
      for (const p of c.pins) expect(Object.keys(PIN_KINDS), `${c.id} ${p[0]}`).toContain(p[3])
      if (c.tab) expect(c.pins.some((p) => p[0] === c.tab), c.id).toBe(true)
      for (const s of c.sources) expect(s.url, c.id).toMatch(/^https:\/\//)
    }
  })

  test('brochages qui piègent (recoupés avec KiCad)', () => {
    expect(order('bc547')).toBe('C B E')
    expect(order('2n2222a')).toBe('E B C')
    expect(order('2n2907a')).toBe('E B C')
    expect(order('2n7000')).toBe('S G D')
    expect(order('bs170')).toBe('D G S')
    expect(order('bd139')).toBe('E C B')
    expect(order('7805')).toBe('IN GND OUT')
    expect(order('7905')).toBe('GND IN OUT')
    expect(order('lm317')).toBe('ADJ OUT IN')
    expect(order('lm337')).toBe('ADJ IN OUT')
    expect(order('78l05')).toBe('OUT GND IN')
    expect(order('ds18b20')).toBe('GND DQ VDD')
    // Portes : sorties en 3, 6, 8, 11 (74HC00) contre 3, 4, 10, 11 (CD4011) et 1, 4, 10, 13 (74HC02)
    const outs = (id) => part(id).pins.filter((p) => p[3] === 'out').map((p) => p[0])
    expect(outs('74hc00')).toEqual([3, 6, 8, 11])
    expect(outs('4011')).toEqual([3, 4, 10, 11])
    expect(outs('74hc02')).toEqual([1, 4, 10, 13])
    // Alimentation du LM324 en 4 et 11
    expect(part('lm324').pins[3][1]).toBe('V+')
    expect(part('74hc595').pins[14][1]).toBe('QA')
  })
})

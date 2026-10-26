import { describe, expect, test } from 'vitest'
import { assignI2c, checkMontage, supplyFor } from './check'
import { BOARDS } from './data/boards'
import { MODULES, addressTable } from './data/modules'

const board = (id) => BOARDS.find((b) => b.id === id)
const mod = (id) => MODULES.find((m) => m.id === id)
const levels = (r) => r.findings.map((f) => f.level)
const titles = (r) => r.findings.map((f) => f.title).join(' | ')

describe('données', () => {
  test('identifiants uniques et champs nécessaires à la vérification', () => {
    expect(new Set(BOARDS.map((b) => b.id)).size).toBe(BOARDS.length)
    expect(new Set(MODULES.map((m) => m.id)).size).toBe(MODULES.length)
    for (const b of BOARDS) {
      expect([3.3, 5]).toContain(b.logic)
      for (const k of ['uartFree', 'adcWifi', 'i2cBuses']) expect(Number.isInteger(b[k]), `${b.id}.${k}`).toBe(true)
      expect(typeof b.i2s).toBe('boolean')
      for (const l of b.links) expect(l.url).toMatch(/^https:\/\//)
    }
    for (const m of MODULES) {
      expect(m.supply[0] <= m.supply[1], m.id).toBe(true)
      expect(['vcc', '3v3', 'none']).toContain(m.levels)
      expect(m.current.typ <= m.current.peak, m.id).toBe(true)
      for (const a of m.i2c ?? []) expect(a >= 0x08 && a <= 0x77, `${m.id} ${a}`).toBe(true)
    }
  })
  test('table des adresses I2C', () => {
    const t = new Map(addressTable())
    expect(t.get(0x76).map((m) => m.id)).toEqual(expect.arrayContaining(['bme280', 'bmp280', 'tca9548a']))
    expect(t.get(0x68).map((m) => m.id)).toEqual(expect.arrayContaining(['mpu6050', 'ds3231']))
  })
})

describe('vérification d’un montage', () => {
  test('alimentation : la tension de la carte en priorité', () => {
    expect(supplyFor(board('esp32'), mod('bme280'))).toBe(3.3)
    expect(supplyFor(board('esp32'), mod('mhz19'))).toBe(5)
    expect(supplyFor(board('uno-r3'), mod('sht4x'))).toBe(3.3)
    expect(supplyFor(board('uno-r3'), mod('ds18b20'))).toBe(5)
  })
  test('montage sans problème', () => {
    const r = checkMontage(board('esp32'), [mod('bme280'), mod('sht4x'), mod('ina219')])
    expect(levels(r)).toEqual(['ok'])
    expect(r.i2cMap.map((x) => x.address)).toEqual([0x40, 0x44, 0x76])
  })
  test('conflit d’adresses : second bus proposé sur ESP32, multiplexeur sinon', () => {
    const three = [mod('bme280'), mod('bme280'), mod('bmp280')]
    const esp32 = checkMontage(board('esp32'), three)
    expect(esp32.findings[0].level).toBe('error')
    expect(esp32.findings[0].detail).toMatch(/second bus/)
    expect(checkMontage(board('esp32-c3'), three).findings[0].detail).toMatch(/TCA9548A/)
  })
  test('attribution : les modules les moins souples d’abord, adresses annexes réservées', () => {
    const r = checkMontage(board('esp32'), [mod('ina219'), mod('htu21d')])
    expect(r.i2cMap).toEqual([
      { address: 0x40, name: 'HTU21D / SHT21 / Si7021', default: true },
      { address: 0x41, name: 'INA219', default: false },
    ])
    expect(titles(r)).toMatch(/INA219 : adresse 0x41/)
    const rtc = assignI2c([{ module: mod('mpu6050') }, { module: mod('ds3231') }])
    expect(rtc.conflicts).toEqual([])
    expect(rtc.assigned.map((a) => a.address)).toEqual([0x68, 0x69])
    expect(rtc.taken.has(0x57)).toBe(true)
  })
  test('niveaux logiques', () => {
    expect(checkMontage(board('esp8266'), [mod('hc-sr04')]).findings[0]).toMatchObject({ level: 'error', title: expect.stringMatching(/5 V/) })
    expect(checkMontage(board('pico-2'), [mod('hc-sr04')]).findings[0].level).toBe('warning')
    expect(levels(checkMontage(board('uno-r3'), [mod('hc-sr04')]))).not.toContain('error')
    expect(levels(checkMontage(board('uno-r3'), [mod('hc-sr04')]))).not.toContain('warning')
    expect(titles(checkMontage(board('uno-r3'), [mod('sht4x')]))).toMatch(/module en 3,3 V sur une carte 5 V/)
    expect(titles(checkMontage(board('uno-r3'), [mod('pms5003')]))).toMatch(/entrées en 3,3 V/)
    expect(titles(checkMontage(board('esp32'), [mod('ws2812b')]))).toMatch(/état haut de 3,3 V/)
    expect(titles(checkMontage(board('esp32'), [mod('relais')]))).toMatch(/commande en 3,3 V/)
  })
  test('liaisons série, entrées analogiques et I2S', () => {
    expect(titles(checkMontage(board('esp32'), [mod('mhz19'), mod('pms5003'), mod('ld2410')]))).toMatch(/3 liaisons série pour 2 libres/)
    expect(checkMontage(board('pi-4'), [mod('sol-capacitif')]).findings[0]).toMatchObject({ level: 'error', title: expect.stringMatching(/analogique/) })
    expect(titles(checkMontage(board('esp8266'), [mod('sol-capacitif'), mod('ldr')]))).toMatch(/2 entrées analogiques pour 1 disponible/)
    expect(titles(checkMontage(board('uno-r3'), [mod('inmp441')]))).toMatch(/I2S/)
    const voice = checkMontage(board('esp32-s3'), [mod('inmp441'), mod('max98357a')])
    expect(levels(voice)).not.toContain('error')
    expect(titles(voice)).toMatch(/Consommation élevée/) // ampli à pleine puissance
  })
  test('bilan de courant', () => {
    const r = checkMontage(board('uno-r3'), [mod('sht4x'), mod('vl53l0x'), mod('vl53l0x')])
    expect(titles(r)).toMatch(/Broche 3,3 V trop sollicitée/)
    expect(r.rail[3.3].peak).toBeCloseTo(80.5, 6)
    const big = checkMontage(board('esp32'), [mod('scd4x'), mod('senseair-s8'), mod('pms5003')])
    expect(titles(big)).toMatch(/Consommation élevée/)
    expect(titles(checkMontage(board('esp32'), [mod('servo')]))).toMatch(/Alimentation séparée/)
  })
})

describe('calculateurs', () => {
  test('résistances de tirage I2C (UM10204)', async () => {
    const { default: spec, rpMin, rpMax } = await import('./pull-up-i2c')
    expect(rpMin(3.3, 3e-3)).toBeCloseTo(966.7, 1)
    expect(rpMax(1000e-9, 100e-12)).toBeCloseTo(11802, 0)
    const sm = spec.compute({ vdd: 3.3, mode: 'sm', cb: 100e-12, rmod: 10e3, nmod: 2 })
    expect(sm.results[0].value).toBe(3300)
    expect(sm.notes.join(' ')).toMatch(/suffisent/)
    expect(spec.compute({ vdd: 3.3, mode: 'fm', cb: 100e-12, rmod: NaN, nmod: NaN }).results[0].value).toBe(1800)
    const tooBig = spec.compute({ vdd: 5, mode: 'fmp', cb: 800e-12, rmod: NaN, nmod: NaN })
    expect(tooBig.results[0].value).toBe('Aucune ne convient')
    expect(spec.compute({ vdd: 3.3, mode: 'fm', cb: 200e-12, rmod: 10e3, nmod: 1 }).notes.join(' ')).toMatch(/Ajouter en parallèle/)
  })
  test('autonomie en veille profonde', async () => {
    const { default: spec, averageCurrent } = await import('./autonomie-veille')
    expect(averageCurrent(80, 4, 0.02, 600)).toBeCloseTo(0.5532, 4)
    const out = spec.compute({ cap: 2500, usable: 80, ia: 80, ta: 4, is: 20, period: 10 })
    expect(out.results[1].value).toBeCloseTo(150.6, 1)
    expect(out.chart.series[0].points.length).toBeGreaterThan(5)
    expect(spec.compute({ cap: 2500, usable: 80, ia: 80, ta: 700, is: 20, period: 10 }).error).toBeTruthy()
  })
})

describe('brochages', async () => {
  const { PINOUTS, parsePin } = await import('./data/pinouts')
  const count = (p) => (p.layout === 'rows' ? [...p.top, ...p.bottom, ...(p.extra?.left ?? []), ...(p.extra?.right ?? [])] : [...p.left, ...p.right]).filter((s) => s !== 'gap').length
  test('une carte, un brochage, avec le bon nombre de broches', () => {
    for (const b of BOARDS) expect(PINOUTS[b.id], b.id).toBeTruthy()
    expect(count(PINOUTS.esp32)).toBe(38)
    expect(count(PINOUTS['esp32-s3'])).toBe(44)
    expect(count(PINOUTS['esp32-c3'])).toBe(30)
    expect(count(PINOUTS['esp32-c6'])).toBe(32)
    expect(count(PINOUTS.esp8266)).toBe(16)
    expect(count(PINOUTS.nano)).toBe(30)
    expect(count(PINOUTS.pico)).toBe(40)
    expect(count(PINOUTS['pi-4'])).toBe(40)
    expect(count(PINOUTS['mega-2560'])).toBe(26 + 24 + 36)
  })
  test('étiquettes connues et notes rattachées à une broche existante', () => {
    const known = new Set(['pwr', 'gnd', 'nc', 'ctl', 'gpio', 'in', 'adc', 'adc2', 'dac', 'i2c', 'spi', 'uart', 'pwm', 'i2s', 'onewire', 'usb', 'usbser', 'boot', 'flash', 'psram', 'led', 'wake', 'int', 'id'])
    for (const [id, p] of Object.entries(PINOUTS)) {
      const lists = p.layout === 'rows' ? [p.top, p.bottom, p.extra?.left ?? [], p.extra?.right ?? []] : [p.left, p.right]
      const pins = lists.flat().map(parsePin).filter((x) => !x.gap)
      for (const pin of pins) for (const t of pin.tags) expect(known.has(t), `${id} ${pin.name} ${t}`).toBe(true)
      const names = new Set(pins.map((x) => x.name))
      for (const n of Object.keys(p.notes ?? {})) expect(names.has(n), `${id} note ${n}`).toBe(true)
      expect(p.source?.url, id).toMatch(/^https:\/\//)
    }
  })
  test('broches à éviter de l’ESP32 conformes à la documentation Espressif', () => {
    const pins = [...PINOUTS.esp32.left, ...PINOUTS.esp32.right].map(parsePin)
    const flash = pins.filter((p) => p.tags.has('flash')).map((p) => Number(p.values.gpio)).sort((a, b) => a - b)
    expect(flash).toEqual([6, 7, 8, 9, 10, 11])
    const boot = pins.filter((p) => p.tags.has('boot')).map((p) => Number(p.values.gpio)).sort((a, b) => a - b)
    expect(boot).toEqual([0, 2, 5, 12, 15])
    expect(pins.filter((p) => p.tags.has('in')).map((p) => Number(p.values.gpio)).sort((a, b) => a - b)).toEqual([34, 35, 36, 39])
  })
})

import { hex } from './data/modules'

/**
 * VÉRIFICATION D'UN MONTAGE
 * -------------------------
 * À partir d'une carte et d'une liste de modules (un module peut figurer plusieurs fois), détermine :
 *  - la tension d'alimentation de chaque module et le niveau de ses signaux ;
 *  - les adresses I2C (attribution sans conflit si les modules le permettent) ;
 *  - l'usage des liaisons série, des entrées analogiques et de l'I2S ;
 *  - le bilan de courant sur les rails 3,3 V et 5 V.
 * Chaque constat : { level: 'error' | 'warning' | 'info' | 'ok', title, detail }.
 */

/** Montage partagé par les outils de la rubrique (stocké dans le navigateur). */
export const MONTAGE_KEY = 'materiel-montage'
export const DEFAULT_MONTAGE = { board: 'esp32', modules: ['bme280', 'ld2410', 'ws2812b'] }

const fits = (m, v) => m.supply[0] <= v + 0.05 && m.supply[1] >= v - 0.05

/** Tension d'alimentation choisie pour un module sur cette carte : celle de la logique de la carte si possible. */
export function supplyFor(board, m) {
  const order = board.logic === 5 ? [5, 3.3] : [3.3, 5]
  return order.find((v) => fits(m, v)) ?? null
}

/** Niveau (V) des signaux envoyés par le module, ou null s'il n'en envoie pas. */
export function signalLevel(m, supply) {
  if (m.levels === 'vcc') return supply
  if (m.levels === '3v3') return 3.3
  return null
}

/**
 * Attribue une adresse I2C à chaque instance : les modules qui ont le moins de choix d'abord.
 * Retourne { assigned: [{ index, address }], conflicts: [index…] }.
 */
export function assignI2c(instances) {
  const taken = new Map() // adresse -> index de l'instance
  const assigned = []
  const conflicts = []
  // Adresses fixes supplémentaires (EEPROM d'un module d'horloge…) réservées d'abord
  instances.forEach(({ module }, index) => module.i2cExtra?.forEach((a) => taken.set(a, index)))
  const order = instances
    .map((inst, index) => ({ inst, index }))
    .filter(({ inst }) => inst.module.i2c?.length)
    .sort((a, b) => a.inst.module.i2c.length - b.inst.module.i2c.length || a.index - b.index)
  for (const { inst, index } of order) {
    const address = inst.module.i2c.find((a) => !taken.has(a))
    if (address == null) conflicts.push(index)
    else {
      taken.set(address, index)
      assigned.push({ index, address })
    }
  }
  assigned.sort((a, b) => a.address - b.address)
  return { assigned, conflicts, taken }
}

const names = (list) => [...new Set(list.map((i) => i.module.name))].join(', ')

export function checkMontage(board, modules) {
  const findings = []
  const add = (level, title, detail) => findings.push({ level, title, detail })
  const instances = modules.map((module, index) => ({ module, index }))
  const active = instances.filter((i) => i.module.bus !== 'power')

  // ── Alimentation et niveaux ─────────────────────────────────────────────────
  const rows = []
  const rail = { 3.3: { typ: 0, peak: 0 }, 5: { typ: 0, peak: 0 } }
  const externals = []
  for (const inst of active) {
    const m = inst.module
    const v = supplyFor(board, m)
    const level = v == null ? null : signalLevel(m, v)
    rows.push({ name: m.name, supply: v, level, external: Boolean(m.external) })
    if (v == null) {
      add('error', `${m.name} : alimentation hors de portée`, `Il demande ${m.supply[0]} à ${m.supply[1]} V : prévoir une alimentation séparée, masse commune avec la carte.`)
      continue
    }
    if (m.external) externals.push(inst)
    else {
      rail[v].typ += m.current.typ
      rail[v].peak += m.current.peak
    }
    // Signal 5 V vers une carte 3,3 V
    if (board.logic === 3.3 && level != null && level > 3.6 && board.tolerant5v !== true) {
      add(
        board.tolerant5v === 'partiel' ? 'warning' : 'error',
        `${m.name} : signaux en 5 V sur une carte 3,3 V`,
        'Les entrées de la carte ne supportent pas 5 V : pont diviseur (par exemple 1 kΩ et 2 kΩ) sur les signaux vers la carte, ou adaptateur de niveau.',
      )
    }
    // État haut insuffisant (WS2812B)
    if (m.minHigh && board.logic < m.minHigh * v) {
      add('warning', `${m.name} : état haut de 3,3 V à la limite`, `Le module attend au moins ${(m.minHigh * v).toFixed(1).replace('.', ',')} V sur sa ligne de données : un adaptateur 74AHCT125 rend la liaison fiable.`)
    }
    if (m.drive5v && board.logic === 3.3) {
      add('warning', `${m.name} : commande en 3,3 V`, 'Beaucoup de modules relais à optocoupleur ne se coupent pas avec un état haut de 3,3 V : module « déclenchement 3,3 V » ou transistor de commande.')
    }
    // Carte 5 V vers un module en 3,3 V
    if (board.logic === 5 && v === 3.3 && !m.in5v && ['i2c', 'spi', 'uart', 'onewire'].includes(m.bus)) {
      add('warning', `${m.name} : module en 3,3 V sur une carte 5 V`, 'Les sorties 5 V de la carte doivent passer par un adaptateur de niveau (BSS138 pour l’I2C), sauf si le module en intègre un. L’alimenter sur la broche 3,3 V.')
    } else if (board.logic === 5 && m.levels === '3v3' && !m.in5v && ['uart', 'spi'].includes(m.bus)) {
      add('warning', `${m.name} : entrées en 3,3 V`, 'Mettre un pont diviseur sur les signaux qui partent de la carte (TX, MOSI, SCK) vers le module.')
    }
  }

  // ── I2C ─────────────────────────────────────────────────────────────────────
  const i2cInst = active.filter((i) => i.module.i2c?.length || i.module.i2cExtra?.length)
  const { assigned, conflicts } = assignI2c(i2cInst)
  const i2cMap = assigned.map(({ index, address }) => ({ address, name: i2cInst[index].module.name, default: address === i2cInst[index].module.i2c[0] }))
  for (const inst of i2cInst) inst.module.i2cExtra?.forEach((a) => i2cMap.push({ address: a, name: `${inst.module.name} (adresse annexe)`, default: true }))
  i2cMap.sort((a, b) => a.address - b.address)
  if (conflicts.length) {
    const who = names(conflicts.map((i) => i2cInst[i]))
    add(
      'error',
      'Conflit d’adresses I2C',
      `Plus de place pour ${who} à ses adresses possibles. ${board.i2cBuses >= 2 ? 'La carte a deux bus I2C : en mettre un sur le second bus, ou ' : 'Solution : '}un multiplexeur TCA9548A.`,
    )
  }
  for (const { address, name, default: isDefault } of i2cMap) {
    if (!isDefault) add('info', `${name} : adresse ${hex(address)}`, 'Changer son adresse (broche ou cavalier ADDR / SDO / A0) pour éviter un conflit.')
  }
  if (i2cInst.length >= 4) {
    add('info', 'Résistances de tirage I2C', `${i2cInst.length} modules I2C : leurs résistances de tirage s’ajoutent en parallèle. Vérifier la valeur équivalente avec le calculateur de pull-up.`)
  }

  // ── Liaisons série ───────────────────────────────────────────────────────────
  const uartInst = active.filter((i) => i.module.bus === 'uart')
  if (uartInst.length > board.uartFree) {
    add('warning', `${uartInst.length} liaisons série pour ${board.uartFree} libre${board.uartFree > 1 ? 's' : ''}`, board.uartNote ?? 'Utiliser une liaison série logicielle (débit limité) ou une carte avec plus d’UART (ESP32, Mega).')
  } else if (uartInst.length && board.uartNote) add('info', 'Liaisons série', board.uartNote)

  // ── Entrées analogiques ─────────────────────────────────────────────────────
  const adcInst = active.filter((i) => i.module.bus === 'analog')
  if (adcInst.length && board.adcWifi === 0) {
    add('error', 'Pas d’entrée analogique sur cette carte', `${names(adcInst)} : ajouter un convertisseur ADS1115 (I2C).`)
  } else if (adcInst.length > board.adcWifi) {
    add('warning', `${adcInst.length} entrées analogiques pour ${board.adcWifi} disponible${board.adcWifi > 1 ? 's' : ''}`, 'Ajouter un ADS1115 (4 voies en I2C).')
  }

  // ── Audio I2S ────────────────────────────────────────────────────────────────
  const i2sInst = active.filter((i) => i.module.bus === 'i2s')
  if (i2sInst.length && !board.i2s) add('error', 'Pas d’audio I2S simple sur cette carte', `${names(i2sInst)} : choisir un ESP32 (S3 pour la voix) ou un Raspberry Pi.`)

  // ── 1-Wire, SPI ──────────────────────────────────────────────────────────────
  if (active.some((i) => i.module.bus === 'onewire')) add('info', 'Bus 1-Wire', 'Une seule broche pour tous les capteurs 1-Wire, avec une résistance de 4,7 kΩ vers l’alimentation.')
  const spiCount = active.filter((i) => i.module.bus === 'spi').length
  if (spiCount > 1) add('info', `${spiCount} modules SPI`, 'Ils partagent SCK, MOSI et MISO ; chacun a sa propre broche CS.')

  // ── Bilan de courant ─────────────────────────────────────────────────────────
  if (board.rail33 != null && rail[3.3].peak > board.rail33) {
    add('warning', 'Broche 3,3 V trop sollicitée', `Jusqu’à ${Math.round(rail[3.3].peak)} mA demandés pour ${board.rail33} mA documentés : alimenter certains modules par un régulateur séparé.`)
  }
  if (rail[5].peak + rail[3.3].peak > 500) {
    add('warning', 'Consommation élevée', `Pointes d’environ ${Math.round(rail[5].peak + rail[3.3].peak)} mA pour les modules : un port USB 2.0 ne fournit que 500 mA. Prévoir une alimentation dédiée.`)
  }
  if (externals.length) add('info', 'Alimentation séparée', `${names(externals)} : alimentation dédiée, masse commune avec la carte.`)

  // ── ESPHome ──────────────────────────────────────────────────────────────────
  if (!board.esphome && active.some((i) => i.module.esphome)) {
    add('info', 'Sans ESPHome', 'Cette carte ne fonctionne pas avec ESPHome : utiliser les bibliothèques Arduino ou Python des modules.')
  }

  if (active.length && !findings.some((f) => f.level === 'error' || f.level === 'warning')) {
    add('ok', 'Aucun problème détecté', 'Les tensions, les niveaux et les adresses sont compatibles.')
  }

  const rank = { error: 0, warning: 1, info: 2, ok: 3 }
  findings.sort((a, b) => rank[a.level] - rank[b.level])

  return {
    findings,
    rows,
    i2cMap,
    uart: { used: uartInst.length, free: board.uartFree },
    adc: { used: adcInst.length, available: board.adcWifi },
    rail,
  }
}

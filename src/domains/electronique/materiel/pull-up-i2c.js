import { closestInSeries } from '../calculs/eseries'
import { formatSI } from '../../../lib/si'

/**
 * Résistances de tirage d'un bus I2C (NXP UM10204, § 7.1) :
 *   Rp(min) = (VDD − VOL(max)) / IOL        le transistor doit pouvoir tirer la ligne à 0,4 V
 *   Rp(max) = tr / (0,8473 × Cb)            la ligne doit monter de 30 % à 70 % de VDD en moins de tr
 */
export const MODES = {
  sm: { label: 'Standard (100 kHz)', tr: 1000e-9, iol: 3e-3, cbMax: 400e-12 },
  fm: { label: 'Rapide (400 kHz)', tr: 300e-9, iol: 3e-3, cbMax: 400e-12 },
  fmp: { label: 'Rapide+ (1 MHz)', tr: 120e-9, iol: 20e-3, cbMax: 550e-12 },
}
export const VOL_MAX = 0.4

export const rpMin = (vdd, iol) => (vdd - VOL_MAX) / iol
export const rpMax = (tr, cb) => tr / (0.8473 * cb)
export const riseTime = (r, cb) => 0.8473 * r * cb

const ohms = (r) => formatSI(r, 'Ω', 3)

export default {
  inputs: [
    { id: 'vdd', label: 'Tension du bus', unit: 'V', value: '3.3', presets: [{ label: '3,3 V', value: '3.3' }, { label: '5 V', value: '5' }] },
    { id: 'mode', label: 'Vitesse', type: 'choice', value: 'sm', options: Object.entries(MODES).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'cb', label: 'Capacité du bus', unit: 'F', value: '100p', hint: 'Estimation : environ 10 pF par module et 50 à 100 pF par mètre de câble' },
    { id: 'rmod', label: 'Résistances déjà sur les modules', unit: 'Ω', value: '10k', optional: true, hint: 'Valeur sur chaque module (souvent 4,7 ou 10 kΩ), vide s’il n’y en a pas' },
    { id: 'nmod', label: 'Nombre de modules qui en ont', type: 'number', value: '2', optional: true },
  ],
  compute(v) {
    const mode = MODES[v.mode]
    if (!(v.vdd > VOL_MAX)) return { error: 'La tension du bus doit dépasser 0,4 V.' }
    if (!(v.cb > 0)) return { error: 'La capacité du bus doit être positive.' }
    const min = rpMin(v.vdd, mode.iol)
    const max = rpMax(mode.tr, v.cb)
    const results = [
      { label: 'Résistance minimale', value: min, unit: 'Ω', digits: 3, hint: `Courant de ${formatSI(mode.iol, 'A', 2)} au niveau bas` },
      { label: 'Résistance maximale', value: max, unit: 'Ω', digits: 3, hint: `Temps de montée ≤ ${formatSI(mode.tr, 's', 3)}` },
    ]
    const notes = []
    if (v.cb > mode.cbMax) notes.push(`La capacité dépasse les ${formatSI(mode.cbMax, 'F', 3)} admis par la norme dans ce mode : raccourcir le bus ou ajouter un tampon (PCA9515, P82B715).`)
    if (min > max) {
      results.unshift({ label: 'Valeur conseillée', value: 'Aucune ne convient', format: 'text', main: true })
      notes.push('Aucune résistance ne respecte les deux limites : réduire la capacité (câble plus court, moins de modules), baisser la vitesse, ou utiliser un tampon I2C.')
      return { results, notes }
    }
    // Valeur E12 la plus proche de la moyenne géométrique des deux limites, ramenée dans la plage
    let r = closestInSeries(Math.sqrt(min * max), 'E12')
    if (r < min || r > max) r = Math.sqrt(min * max)
    results.unshift({ label: 'Valeur conseillée (E12)', value: r, unit: 'Ω', digits: 3, main: true, hint: `Plage admise : ${ohms(min)} à ${ohms(max)}` })
    results.push({ label: 'Temps de montée obtenu', value: riseTime(r, v.cb), unit: 's', digits: 3 })
    results.push({ label: 'Courant au niveau bas', value: (v.vdd - VOL_MAX) / r, unit: 'A', digits: 3 })
    if (v.rmod > 0) {
      const n = Number.isFinite(v.nmod) && v.nmod >= 1 ? Math.round(v.nmod) : 1
      const req = v.rmod / n
      const ok = req >= min && req <= max
      results.push({ label: `Équivalent des ${n} module${n > 1 ? 's' : ''}`, value: req, unit: 'Ω', digits: 3, hint: ok ? 'Dans la plage : pas de résistance à ajouter' : req < min ? 'Trop faible : retirer des résistances sur certains modules' : 'Trop forte : ajouter une résistance en parallèle' })
      if (ok) notes.push('Les résistances déjà présentes sur les modules suffisent.')
      else if (req > max) notes.push(`Ajouter en parallèle environ ${ohms(1 / (1 / r - 1 / req))} sur SDA et sur SCL pour obtenir ${ohms(r)}.`)
    }
    return { results, notes }
  },
  formulas: [
    { f: 'Rp(min) = (VDD − VOL(max)) / IOL', ref: ['um10204', 'slva689'] },
    { f: 'Rp(max) = tr / (0,8473 × Cb)', ref: ['um10204', 'slva689'] },
    { f: 'VOL(max) = 0,4 V ; IOL = 3 mA (20 mA en mode rapide+)', ref: 'um10204' },
    { f: 'tr ≤ 1 000 ns (100 kHz), 300 ns (400 kHz), 120 ns (1 MHz) ; Cb ≤ 400 pF (550 pF en mode rapide+)', ref: 'um10204' },
  ],
  notes: [
    { text: 'Le facteur 0,8473 = ln(0,7 / 0,3) vient de la charge du condensateur du bus entre 30 % et 70 % de VDD.', ref: 'um10204' },
    'Les résistances de tirage de plusieurs modules s’ajoutent en parallèle : avec quatre modules à 10 kΩ, le bus voit 2,5 kΩ.',
    'Un Raspberry Pi a déjà 1,8 kΩ sur GPIO2 et GPIO3.',
  ],
  references: [
    {
      id: 'um10204',
      label: 'NXP, UM10204 « I²C-bus specification and user manual » (rév. 7, 2021)',
      detail: '§ 7.1 (dimensionnement des résistances de tirage) et caractéristiques électriques des modes',
      url: 'https://www.nxp.com/docs/en/user-guide/UM10204.pdf',
    },
    {
      id: 'slva689',
      label: 'Texas Instruments, SLVA689 « I2C Bus Pullup Resistor Calculation »',
      url: 'https://www.ti.com/lit/an/slva689/slva689.pdf',
    },
  ],
}

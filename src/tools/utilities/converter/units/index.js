/**
 * DÉFINITION DES GRANDEURS ET UNITÉS
 * ----------------------------------
 * Chaque unité indique son facteur vers l'unité de base de la grandeur (SI le plus souvent) :
 *   valeur_en_base = valeur × factor
 * Pour les conversions non linéaires (température, consommation, dB…), fournir toBase / fromBase.
 * Ajouter une grandeur = ajouter un objet dans l'un des fichiers ci-dessous (ou en créer un).
 */
import common from './common'
import mechanics from './mechanics'
import physics from './physics'
import other from './other'

/**
 * Identifiants d'unités normalisés en minuscules ASCII (kWh → kwh, µF → uf).
 * « M » (méga) devient « meg » pour ne pas se confondre avec « m » (milli) : MW → megw, mW → mw.
 */
const normalizeId = (id) => id.replace(/^M(?=.)/, 'meg').replace('µ', 'u').toLowerCase()

export const QUANTITIES = [...common, ...mechanics, ...physics, ...other].map((q) => ({
  ...q,
  defaults: q.defaults.map(normalizeId),
  units: q.units.map((unit) => ({ ...unit, id: normalizeId(unit.id) })),
}))

export const FAMILIES = [...new Set(QUANTITIES.map((q) => q.family))]

export const getQuantity = (id) => QUANTITIES.find((q) => q.id === id) ?? QUANTITIES[0]
export const getUnit = (quantity, unitId) => quantity.units.find((u) => u.id === unitId) ?? quantity.units[0]

const toBase = (unit, value) => (unit.toBase ? unit.toBase(value) : value * unit.factor)
const fromBase = (unit, base) => (unit.fromBase ? unit.fromBase(base) : base / unit.factor)

/** Convertit `value` de l'unité `from` vers l'unité `to` d'une grandeur (objet). */
export const convertWith = (quantity, value, from, to) => fromBase(getUnit(quantity, to), toBase(getUnit(quantity, from), value))

/** Convertit `value` de l'unité `from` vers l'unité `to` d'une même grandeur (identifiants). */
export const convert = (quantityId, value, from, to) => convertWith(getQuantity(quantityId), value, from, to)

export const isLinear = (unit) => !unit.toBase

/** Nombre total d'unités (pour l'affichage). */
export const UNIT_COUNT = QUANTITIES.reduce((n, q) => n + q.units.length, 0)

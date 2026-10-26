/** Outils de construction des listes d'unités. */

export const PREFIXES = {
  Q: { name: 'quetta', f: 1e30 },
  R: { name: 'ronna', f: 1e27 },
  Y: { name: 'yotta', f: 1e24 },
  Z: { name: 'zetta', f: 1e21 },
  E: { name: 'exa', f: 1e18 },
  P: { name: 'péta', f: 1e15 },
  T: { name: 'téra', f: 1e12 },
  G: { name: 'giga', f: 1e9 },
  M: { name: 'méga', f: 1e6 },
  k: { name: 'kilo', f: 1e3 },
  h: { name: 'hecto', f: 1e2 },
  da: { name: 'déca', f: 1e1 },
  '': { name: '', f: 1 },
  d: { name: 'déci', f: 1e-1 },
  c: { name: 'centi', f: 1e-2 },
  m: { name: 'milli', f: 1e-3 },
  µ: { name: 'micro', f: 1e-6 },
  n: { name: 'nano', f: 1e-9 },
  p: { name: 'pico', f: 1e-12 },
  f: { name: 'femto', f: 1e-15 },
  a: { name: 'atto', f: 1e-18 },
}

/** Unité simple : facteur vers l'unité de base de la grandeur. */
export const u = (id, label, symbol, factor, extra = {}) => ({ id, label, symbol, factor, ...extra })

/**
 * Déclinaisons préfixées d'une unité SI : si('V', 'volt', 'M k  m µ') → MV, kV, V, mV, µV.
 * La chaîne liste les préfixes séparés par des espaces ('_' ou chaîne vide = sans préfixe).
 * `scale` multiplie le facteur (pour une unité dont la base n'est pas l'unité SI).
 */
export function si(symbol, label, prefixList, scale = 1, power = 1) {
  return prefixList
    .split(' ')
    .map((p) => (p === '_' ? '' : p))
    .map((p) => {
      const pre = PREFIXES[p]
      return u(`${p}${symbol}`, `${pre.name}${label}`, `${p}${symbol}`, pre.f ** power * scale)
    })
}

/** Unité affine (température…) : valeur_base = valeur × a + b. */
export const affine = (id, label, symbol, a, b) => ({ id, label, symbol, toBase: (v) => v * a + b, fromBase: (x) => (x - b) / a })

/** Unité inversement proportionnelle : valeur_base = k / valeur (consommation, allure…). */
export const inverse = (id, label, symbol, k) => ({ id, label, symbol, toBase: (v) => k / v, fromBase: (x) => k / x })

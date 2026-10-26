import { formatSI } from '../../../../lib/si'

const TOLERANCE = { B: '±0,1 pF', C: '±0,25 pF', D: '±0,5 pF', F: '±1 %', G: '±2 %', J: '±5 %', K: '±10 %', M: '±20 %', Z: '+80 / −20 %' }

/** Décode un marquage de condensateur : « 104K », « 47 », « 4n7 », « 2u2 », « 0.1 ». Résultat en farads. */
export function decodeCapacitor(code) {
  const s = code.trim().replace(/\s/g, '').replace(',', '.').toUpperCase().replace('Μ', 'U')
  if (!s) return null
  let m = /^(\d)(\d)(\d)([A-Z])?$/.exec(s)
  if (m) {
    const pf = (Number(m[1]) * 10 + Number(m[2])) * 10 ** (m[3] === '9' ? -1 : m[3] === '8' ? -2 : Number(m[3]))
    return { farads: pf * 1e-12, tolerance: m[4] ? TOLERANCE[m[4]] : '±20 % (par défaut)', method: 'Code à 3 chiffres (pF)' }
  }
  m = /^(\d+)?([PNU])(\d+)?([A-Z])?$/.exec(s)
  if (m && (m[1] || m[3])) {
    const f = { P: 1e-12, N: 1e-9, U: 1e-6 }[m[2]]
    return { farads: Number(`${m[1] ?? 0}.${m[3] ?? 0}`) * f, tolerance: m[4] ? TOLERANCE[m[4]] : null, method: 'Notation à lettre décimale' }
  }
  m = /^(\d{1,2})([A-Z])?$/.exec(s)
  if (m) return { farads: Number(m[1]) * 1e-12, tolerance: m[2] ? TOLERANCE[m[2]] : null, method: 'Valeur directe en pF' }
  m = /^(0?\.\d+)([A-Z])?$/.exec(s)
  if (m) return { farads: Number(m[1]) * 1e-6, tolerance: m[2] ? TOLERANCE[m[2]] : null, method: 'Valeur décimale en µF' }
  return null
}

export default {
  inputs: [{ id: 'code', label: 'Marquage du condensateur', type: 'text', value: '104K', placeholder: 'ex. 104K, 47, 4n7, 2u2, 0.1' }],
  compute(v) {
    const d = decodeCapacitor(v.code)
    if (!d) return v.code.trim() ? { error: 'Marquage non reconnu.' } : null
    return {
      results: [
        { label: 'Capacité', value: d.farads, unit: 'F', digits: 4, main: true },
        { label: 'En picofarads', value: `${formatSI(d.farads * 1e12, '', 6).trim()} pF`, format: 'text' },
        { label: 'En nanofarads', value: `${formatSI(d.farads * 1e9, '', 6).trim()} nF`, format: 'text' },
        { label: 'En microfarads', value: `${formatSI(d.farads * 1e6, '', 6).trim()} µF`, format: 'text' },
        { label: 'Tolérance', value: d.tolerance ?? 'non indiquée', format: 'text' },
        { label: 'Lecture', value: d.method, format: 'text' },
      ],
    }
  },
  formulas: ['C (pF) = AB × 10ᶜ pour le code « ABC »'],
  notes: ['Exemples : 104 = 10 × 10⁴ pF = 100 nF ; 4n7 = 4,7 nF. La lettre finale indique la tolérance (J = 5 %, K = 10 %, M = 20 %).'],
}

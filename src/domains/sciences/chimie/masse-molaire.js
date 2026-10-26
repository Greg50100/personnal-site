import { ELEMENTS } from './elements'

/**
 * Compte les atomes d'une formule chimique : parenthèses, crochets, hydrates (CuSO4·5H2O ou CuSO4*5H2O).
 * Renvoie { counts } ou lève une Error en français.
 */
export function parseFormula(formula) {
  const parts = formula.replace(/\s/g, '').split(/[·*•.]/).filter(Boolean)
  if (!parts.length) throw new Error('Formule vide')
  const total = {}
  for (const part of parts) {
    const m = /^(\d+)(.*)$/.exec(part)
    const factor = m ? Number(m[1]) : 1
    const counts = parseGroup(m ? m[2] : part)
    for (const [el, n] of Object.entries(counts)) total[el] = (total[el] ?? 0) + n * factor
  }
  return total
}

function parseGroup(s) {
  const stack = [{}]
  let i = 0
  const readNumber = () => {
    const m = /^\d+/.exec(s.slice(i))
    if (!m) return 1
    i += m[0].length
    return Number(m[0])
  }
  while (i < s.length) {
    const ch = s[i]
    if (ch === '(' || ch === '[') {
      stack.push({})
      i++
    } else if (ch === ')' || ch === ']') {
      if (stack.length < 2) throw new Error('Parenthèse fermante en trop')
      i++
      const n = readNumber()
      const group = stack.pop()
      const top = stack[stack.length - 1]
      for (const [el, c] of Object.entries(group)) top[el] = (top[el] ?? 0) + c * n
    } else {
      const m = /^[A-Z][a-z]?/.exec(s.slice(i))
      if (!m) throw new Error(`Caractère inattendu « ${ch} »`)
      if (!(m[0] in ELEMENTS)) throw new Error(`Élément inconnu « ${m[0]} »`)
      i += m[0].length
      const n = readNumber()
      const top = stack[stack.length - 1]
      top[m[0]] = (top[m[0]] ?? 0) + n
    }
  }
  if (stack.length !== 1) throw new Error('Parenthèse non fermée')
  return stack[0]
}

export function molarMass(formula) {
  const counts = parseFormula(formula)
  return Object.entries(counts).reduce((sum, [el, n]) => sum + ELEMENTS[el][0] * n, 0)
}

export default {
  inputs: [
    { id: 'formula', label: 'Formule chimique', type: 'text', value: 'C6H12O6', placeholder: 'ex. H2O, Ca(OH)2, CuSO4·5H2O', presets: ['H2O', 'NaCl', 'CO2', 'C6H12O6', 'H2SO4', 'Ca(OH)2', 'CuSO4·5H2O'].map((f) => ({ label: f, value: f })) },
    { id: 'mass', label: 'Masse de produit (facultatif)', unit: 'g', value: '', optional: true },
  ],
  compute(v) {
    if (!v.formula.trim()) return null
    let counts
    try {
      counts = parseFormula(v.formula)
    } catch (err) {
      return { error: err.message }
    }
    const M = Object.entries(counts).reduce((s, [el, n]) => s + ELEMENTS[el][0] * n, 0)
    const results = [{ label: 'Masse molaire', value: M, unit: 'g/mol', format: 'num', digits: 3, main: true }]
    if (Number.isFinite(v.mass) && v.mass > 0) {
      results.push({ label: 'Quantité de matière', value: v.mass / M, unit: 'mol' })
      results.push({ label: 'Nombre de molécules', value: (v.mass / M) * 6.02214076e23, format: 'auto', digits: 5 })
    }
    return {
      results,
      table: {
        title: 'Composition',
        columns: ['Élément', 'Atomes', 'Masse (g/mol)', 'Fraction massique'],
        rows: Object.entries(counts).map(([el, n]) => [
          `${el} — ${ELEMENTS[el][1]}`,
          String(n),
          (ELEMENTS[el][0] * n).toFixed(3).replace('.', ','),
          `${((ELEMENTS[el][0] * n * 100) / M).toFixed(2).replace('.', ',')} %`,
        ]),
      },
    }
  },
  formulas: ['M = Σ nᵢ × Mᵢ', 'n = m / M'],
  notes: ['Respectez les majuscules : « Co » est le cobalt, « CO » le monoxyde de carbone.'],
}

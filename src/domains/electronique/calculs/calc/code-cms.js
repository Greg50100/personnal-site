import { E_SERIES } from '../eseries'

const EIA96_MULT = { Z: 0.001, Y: 0.01, R: 0.01, X: 0.1, S: 0.1, A: 1, B: 10, H: 10, C: 100, D: 1e3, E: 1e4, F: 1e5 }

/** Décode le marquage d'une résistance CMS : « 103 », « 4R7 », « 1002 », « 01C » (EIA-96), « R22 ». */
export function decodeSmd(code) {
  const s = code.trim().toUpperCase()
  if (!s) return null
  if (/^\d*R\d*$/.test(s) && s !== 'R') return { ohms: Number(s.replace('R', '.')), system: 'Notation « R » (virgule)' }
  if (/^\d*M\d+$/.test(s)) return { ohms: Number(s.replace('M', '.')) * 1e-3, system: 'Notation « M » (milliohms)' }
  let m = /^(\d{2})(\d)$/.exec(s)
  if (m) return { ohms: Number(m[1]) * 10 ** Number(m[2]), system: 'Code à 3 chiffres (±5 %)' }
  m = /^(\d{3})(\d)$/.exec(s)
  if (m) return { ohms: Number(m[1]) * 10 ** Number(m[2]), system: 'Code à 4 chiffres (±1 %)' }
  m = /^(\d{2})([A-Z])$/.exec(s)
  if (m) {
    const idx = Number(m[1])
    if (idx < 1 || idx > 96 || !(m[2] in EIA96_MULT)) return null
    return { ohms: E_SERIES.E96[idx - 1] * EIA96_MULT[m[2]], system: 'Code EIA-96 (±1 %)' }
  }
  return null
}

export default {
  inputs: [{ id: 'code', label: 'Marquage CMS', type: 'text', value: '103', placeholder: 'ex. 103, 4R7, 1002, 01C' }],
  compute(v) {
    const d = decodeSmd(v.code)
    if (!d) return v.code.trim() ? { error: 'Marquage non reconnu.' } : null
    return {
      results: [
        { label: 'Résistance', value: d.ohms, unit: 'Ω', digits: 4, main: true },
        { label: 'Système de marquage', value: d.system, format: 'text' },
      ],
    }
  },
  formulas: ['« ABC » : AB × 10ᶜ Ω', '« ABCD » : ABC × 10ᴰ Ω', 'EIA-96 « 01C » : valeur n°01 de la série E96 × 100'],
  notes: ['« 000 » ou « 0 » désigne un strap de 0 Ω. Lettres EIA-96 : Z ×0,001, Y/R ×0,01, X/S ×0,1, A ×1, B/H ×10, C ×100, D ×1 000, E ×10⁴, F ×10⁵.'],
}

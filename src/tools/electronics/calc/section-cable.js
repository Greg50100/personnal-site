import { MATERIALS, SECTIONS, awgLabel, awgToMm2, mm2ToAwg } from './cables'

export default {
  inputs: [
    { id: 'u', label: 'Tension de la source', unit: 'V', value: '12' },
    { id: 'i', label: 'Courant', unit: 'A', value: '10' },
    { id: 'len', label: 'Longueur du câble (aller simple)', unit: 'm', value: '10' },
    { id: 'max', label: 'Chute de tension maximale', type: 'number', unit: '%', value: '3', presets: [1, 3, 5].map((p) => ({ label: `${p} %`, value: String(p) })) },
    { id: 'mat', label: 'Matériau', type: 'choice', value: 'cu', options: Object.entries(MATERIALS).map(([value, m]) => ({ value, label: m.label })) },
  ],
  compute(v) {
    if (!(v.max > 0)) return { error: 'La chute maximale doit être positive.' }
    const maxDrop = (v.u * v.max) / 100
    const sMin = (MATERIALS[v.mat].rho * 2 * v.len * v.i) / maxDrop / 1e-6
    const standard = SECTIONS.find((s) => s >= sMin)
    const awg = mm2ToAwg(sMin)
    return {
      results: [
        { label: 'Section minimale calculée', value: sMin, unit: 'mm²', format: 'num', digits: 2 },
        { label: 'Section normalisée conseillée', value: standard ? `${String(standard).replace('.', ',')} mm²` : '> 300 mm²', format: 'text', main: true },
        { label: 'Équivalent AWG', value: awg !== null ? `${awgLabel(awg)} (${awgToMm2(awg).toFixed(2).replace('.', ',')} mm²)` : 'hors table', format: 'text' },
        { label: 'Diamètre du conducteur', value: 2 * Math.sqrt(sMin / Math.PI), unit: 'mm', format: 'num', digits: 2 },
      ],
      notes: ['Vérifiez aussi le courant admissible (échauffement), qui dépend du mode de pose et peut imposer une section plus grande.'],
    }
  },
  formulas: ['S = ρ × 2L × I / ΔU_max'],
}

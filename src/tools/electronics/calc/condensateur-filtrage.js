import { RedresseurSchema } from '../schemas.jsx'

/**
 * CONDENSATEUR DE FILTRAGE (alimentation redressée)
 * Ondulation crête à crête : ΔV ≈ I / (f_ondulation × C), f_ondulation = 2 f en double alternance, f en simple alternance.
 * Tension crête : Vc = Veff × √2 − chute des diodes conductrices (deux dans un pont).
 */

const STANDARD_VOLTAGES = [6.3, 10, 16, 25, 35, 50, 63, 100, 160, 200, 250, 400, 450]

export const peakVoltage = (vrms, vd, diodes) => vrms * Math.SQRT2 - diodes * vd
export const rippleC = (i, f, dv) => i / (f * dv)

export default {
  schematic: RedresseurSchema,
  inputs: [
    {
      id: 'type',
      label: 'Redressement',
      type: 'choice',
      value: 'bridge',
      options: [
        { value: 'bridge', label: 'Pont de diodes' },
        { value: 'center', label: 'Point milieu' },
        { value: 'half', label: 'Simple alternance' },
      ],
    },
    { id: 'vrms', label: 'Tension alternative (efficace)', unit: 'V', value: '12' },
    { id: 'f', label: 'Fréquence du secteur', type: 'number', unit: 'Hz', value: '50' },
    { id: 'vd', label: 'Chute par diode', unit: 'V', value: '0.7', presets: [{ label: 'Silicium : 0,7', value: '0.7' }, { label: 'Schottky : 0,4', value: '0.4' }] },
    { id: 'i', label: 'Courant de charge', unit: 'A', value: '0.5' },
    {
      id: 'mode',
      label: 'Calculer',
      type: 'choice',
      value: 'c',
      options: [
        { value: 'c', label: 'Le condensateur' },
        { value: 'ripple', label: 'L’ondulation' },
      ],
    },
    { id: 'dv', label: 'Ondulation admise (crête à crête)', unit: 'V', value: '1', show: (v) => v.mode === 'c' },
    { id: 'c', label: 'Condensateur', unit: 'F', value: '2200µ', show: (v) => v.mode === 'ripple' },
  ],
  compute(v) {
    const diodes = v.type === 'bridge' ? 2 : 1
    const fr = v.type === 'half' ? v.f : 2 * v.f
    const vp = peakVoltage(v.vrms, v.vd, diodes)
    if (!(vp > 0) || !(v.i > 0)) return null
    const c = v.mode === 'c' ? rippleC(v.i, fr, v.dv) : v.c
    const dv = v.mode === 'c' ? v.dv : v.i / (fr * v.c)
    if (dv >= vp) return { error: 'L’ondulation dépasse la tension crête : condensateur trop petit.' }
    const rating = STANDARD_VOLTAGES.find((u) => u >= vp * 1.25) ?? '> 450'
    return {
      results: [
        v.mode === 'c' ? { label: 'Capacité minimale', value: c * 1e6, unit: 'µF', format: 'num', digits: 0, main: true } : { label: 'Ondulation crête à crête', value: dv, unit: 'V', main: true },
        { label: 'Tension crête', value: vp, unit: 'V' },
        { label: 'Tension minimale', value: vp - dv, unit: 'V', hint: 'à comparer à l’entrée minimale du régulateur' },
        { label: 'Tension moyenne', value: vp - dv / 2, unit: 'V' },
        { label: 'Fréquence d’ondulation', value: fr, unit: 'Hz', format: 'num', digits: 0 },
        { label: 'Tension de service conseillée', value: typeof rating === 'number' ? `${String(rating).replace('.', ',')} V` : `${rating} V`, format: 'text', hint: 'au moins 1,25 × la tension crête' },
      ],
    }
  },
  formulas: [
    { f: 'Vcrête = Veff × √2 − n × Vd (n = 2 pour un pont)', ref: 'horowitz' },
    { f: 'ΔV ≈ I / (f_ondulation × C)', ref: 'horowitz' },
    'f_ondulation = 2 × f (double alternance), f (simple alternance)',
  ],
  notes: [
    'Approximation d’une décharge à courant constant pendant toute la période : elle surestime un peu l’ondulation, donc la capacité.',
    'Un transformateur à vide donne 10 à 20 % de plus que sa tension nominale, et le secteur varie de ±10 % : en tenir compte pour la tension de service.',
    'Le courant d’ondulation fait chauffer le condensateur : choisir un modèle « faible ESR » donné pour ce courant.',
  ],
  references: [
    { id: 'horowitz', label: 'P. Horowitz, W. Hill, The Art of Electronics, 3e éd., Cambridge University Press, 2015', detail: '§ 9.5, unregulated power supplies' },
    { id: 'wiki', label: 'Rectifier (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Rectifier' },
  ],
}

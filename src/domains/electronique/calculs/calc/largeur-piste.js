import { PisteSchema } from '../schemas.jsx'

/**
 * LARGEUR DE PISTE (IPC-2221)
 * I = k × ΔT^0,44 × A^0,725, avec A en mil² (millièmes de pouce au carré), k = 0,048 en couche externe,
 * 0,024 en couche interne. Épaisseur du cuivre : 1 oz/ft² = 34,8 µm = 1,378 mil.
 */

export const K_EXTERNAL = 0.048
export const K_INTERNAL = 0.024
const MIL = 0.0254 // mm
const OZ_MIL = 1.378
const RHO_20 = 1.724e-8 // Ω·m, cuivre recuit
const ALPHA = 0.00393

/** Section (mil²) nécessaire pour un courant I et un échauffement ΔT. */
export const areaMil2 = (i, dT, k) => (i / (k * dT ** 0.44)) ** (1 / 0.725)

/** Largeur (mm) de piste pour un courant, un échauffement, une épaisseur (oz) et une couche. */
export function traceWidth(i, dT, oz, internal) {
  const area = areaMil2(i, dT, internal ? K_INTERNAL : K_EXTERNAL)
  return (area / (oz * OZ_MIL)) * MIL
}

export default {
  schematic: PisteSchema,
  inputs: [
    { id: 'i', label: 'Courant', unit: 'A', value: '2' },
    { id: 'dt', label: 'Échauffement admis', type: 'number', unit: '°C', value: '10', presets: [{ label: '10 °C', value: '10' }, { label: '20 °C', value: '20' }, { label: '30 °C', value: '30' }] },
    {
      id: 'oz',
      label: 'Épaisseur de cuivre',
      type: 'choice',
      value: '1',
      options: [
        { value: '0.5', label: '0,5 oz (17,5 µm)' },
        { value: '1', label: '1 oz (35 µm)' },
        { value: '2', label: '2 oz (70 µm)' },
      ],
    },
    {
      id: 'layer',
      label: 'Couche',
      type: 'choice',
      value: 'ext',
      options: [
        { value: 'ext', label: 'Externe' },
        { value: 'int', label: 'Interne' },
      ],
    },
    { id: 'len', label: 'Longueur de la piste', type: 'number', unit: 'mm', value: '50' },
    { id: 'ta', label: 'Température ambiante', type: 'number', unit: '°C', value: '25' },
  ],
  compute(v) {
    const oz = Number(v.oz)
    const internal = v.layer === 'int'
    if (!(v.i > 0) || !(v.dt > 0)) return null
    const k = internal ? K_INTERNAL : K_EXTERNAL
    const area = areaMil2(v.i, v.dt, k)
    const wMil = area / (oz * OZ_MIL)
    const wMm = wMil * MIL
    const tM = oz * OZ_MIL * MIL * 1e-3
    const sectionM2 = wMm * 1e-3 * tM
    const t = v.ta + v.dt
    const r = (RHO_20 * (1 + ALPHA * (t - 20)) * (v.len / 1000)) / sectionM2
    const currents = Array.from({ length: 41 }, (_, n) => (v.i * 2 * n) / 40).filter((x) => x > 0)
    return {
      results: [
        { label: 'Largeur minimale', value: wMm, unit: 'mm', format: 'num', digits: 2, main: true },
        { label: 'Largeur en mil', value: wMil, unit: 'mil', format: 'num', digits: 1 },
        { label: 'Section de cuivre', value: sectionM2 * 1e6, unit: 'mm²', format: 'num', digits: 4 },
        { label: 'Résistance de la piste', value: r, unit: 'Ω', hint: `à ${t} °C` },
        { label: 'Chute de tension', value: r * v.i, unit: 'V' },
        { label: 'Puissance perdue', value: r * v.i ** 2, unit: 'W' },
      ],
      chart: {
        title: 'Largeur selon le courant',
        x: { label: 'Courant (A)' },
        y: { label: 'Largeur (mm)', min: 0 },
        series: [
          { name: 'Couche externe', points: currents.map((c) => [c, traceWidth(c, v.dt, oz, false)]) },
          { name: 'Couche interne', color: '#60a5fa', points: currents.map((c) => [c, traceWidth(c, v.dt, oz, true)]) },
        ],
        markers: [{ x: v.i, y: wMm, label: `${v.i} A` }],
      },
      notes: wMil > 400 || v.i > 35 ? ['Hors du domaine des abaques IPC-2221 (35 A, 400 mil) : préférer IPC-2152 ou plusieurs couches.'] : [],
    }
  },
  formulas: [
    { f: 'I = k × ΔT^0,44 × A^0,725 (A en mil²)', ref: 'ipc2221' },
    'k = 0,048 (couche externe), 0,024 (couche interne)',
    'largeur = A / (épaisseur en mil) ; 1 oz = 1,378 mil = 35 µm',
    { f: 'R = ρ × L / (w × t), ρ = 1,724 × 10⁻⁸ Ω·m × (1 + 0,003 93 (T − 20))', ref: 'resistivity' },
  ],
  notes: [
    'Une couche interne dissipe moins bien : il lui faut une piste environ 2,5 fois plus large.',
    { text: 'La norme IPC-2152 (2009), fondée sur de nouvelles mesures, donne des largeurs souvent plus faibles en couche externe.', ref: 'ipc2152' },
  ],
  references: [
    { id: 'ipc2221', label: 'IPC-2221, Generic Standard on Printed Board Design', detail: '§ 6.2, conductor sizing', url: 'https://www.ipc.org/' },
    { id: 'ipc2152', label: 'IPC-2152, Standard for Determining Current Carrying Capacity in Printed Board Design', url: 'https://www.ipc.org/' },
    { id: 'resistivity', label: 'Electrical resistivity and conductivity (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Electrical_resistivity_and_conductivity' },
  ],
}

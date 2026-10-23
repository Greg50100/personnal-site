const NAMES = { r1: 'R1', r2: 'R2', r3: 'R3', rx: 'Rx' }

export default {
  inputs: [
    { id: 'unknown', label: 'Résistance inconnue', type: 'choice', value: 'rx', options: Object.entries(NAMES).map(([value, label]) => ({ value, label })) },
    { id: 'r1', label: 'R1', unit: 'Ω', value: '1k', show: (v) => v.unknown !== 'r1' },
    { id: 'r2', label: 'R2', unit: 'Ω', value: '2k', show: (v) => v.unknown !== 'r2' },
    { id: 'r3', label: 'R3', unit: 'Ω', value: '1k5', show: (v) => v.unknown !== 'r3' },
    { id: 'rx', label: 'Rx', unit: 'Ω', value: '3k', show: (v) => v.unknown !== 'rx' },
  ],
  compute(v) {
    // Équilibre : R1 / R2 = R3 / Rx
    const value = { rx: (v.r2 * v.r3) / v.r1, r3: (v.r1 * v.rx) / v.r2, r2: (v.r1 * v.rx) / v.r3, r1: (v.r2 * v.r3) / v.rx }[v.unknown]
    return { results: [{ label: `${NAMES[v.unknown]} à l'équilibre`, value, unit: 'Ω', main: true }] }
  },
  formulas: ['Pont équilibré : R1 / R2 = R3 / Rx', 'Rx = R2 × R3 / R1'],
  notes: ["À l'équilibre, aucun courant ne traverse le galvanomètre placé entre les deux points milieux."],
}

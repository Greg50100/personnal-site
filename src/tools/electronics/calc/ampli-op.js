const CONFIGS = {
  inv: { label: 'Inverseur', gain: (v) => -v.rf / v.r1, formula: 'G = −Rf / R1' },
  noninv: { label: 'Non inverseur', gain: (v) => 1 + v.rf / v.r1, formula: 'G = 1 + Rf / R1' },
  diff: { label: 'Différentiel', gain: (v) => v.rf / v.r1, formula: 'Vout = (Rf / R1) × (V2 − V1)' },
  follower: { label: 'Suiveur', gain: () => 1, formula: 'G = 1' },
}

export default {
  inputs: [
    { id: 'config', label: 'Montage', type: 'choice', value: 'inv', options: Object.entries(CONFIGS).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'r1', label: 'R1 (entrée)', unit: 'Ω', value: '10k', show: (v) => v.config !== 'follower' },
    { id: 'rf', label: 'Rf (contre-réaction)', unit: 'Ω', value: '47k', show: (v) => v.config !== 'follower' },
    { id: 'vin', label: (v) => (v?.config === 'diff' ? 'V1' : 'Tension d’entrée'), unit: 'V', value: '0.5' },
    { id: 'vin2', label: 'V2', unit: 'V', value: '1', show: (v) => v.config === 'diff' },
    { id: 'vcc', label: 'Alimentation ± (saturation)', unit: 'V', value: '15', optional: true },
  ],
  compute(v) {
    const c = CONFIGS[v.config]
    const g = c.gain(v)
    let vout = v.config === 'diff' ? g * (v.vin2 - v.vin) : g * v.vin
    const saturated = Number.isFinite(v.vcc) && Math.abs(vout) > v.vcc
    if (saturated) vout = Math.sign(vout) * v.vcc
    return {
      results: [
        { label: 'Tension de sortie', value: vout, unit: 'V', main: true, hint: saturated ? 'sortie saturée par l’alimentation' : undefined },
        { label: 'Gain en tension', value: g, format: 'auto', digits: 5 },
        { label: 'Gain en dB', value: 20 * Math.log10(Math.abs(g)), unit: 'dB', format: 'num', digits: 2 },
        ...(v.config === 'inv' ? [{ label: "Impédance d'entrée", value: v.r1, unit: 'Ω' }] : []),
      ],
    }
  },
  formulas: Object.values(CONFIGS).map((c) => `${c.label} : ${c.formula}`),
  notes: ["Calcul pour un amplificateur opérationnel idéal (gain infini, courant d'entrée nul)."],
}

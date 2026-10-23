const H = 6.62607015e-34
const EV = 1.602176634e-19

const MEDIA = [
  { label: 'Vide (lumière)', value: '299792458' },
  { label: 'Air (son, 20 °C)', value: '343' },
  { label: 'Eau (son)', value: '1480' },
  { label: 'Câble coaxial (×0,66)', value: '197863022' },
]

export default {
  inputs: [
    {
      id: 'from',
      label: 'Valeur connue',
      type: 'choice',
      value: 'f',
      options: [
        { value: 'f', label: 'Fréquence' },
        { value: 'l', label: "Longueur d'onde" },
      ],
    },
    { id: 'f', label: 'Fréquence f', unit: 'Hz', value: '100M', show: (v) => v.from === 'f' },
    { id: 'l', label: "Longueur d'onde λ", unit: 'm', value: '500n', show: (v) => v.from === 'l' },
    { id: 'c', label: 'Célérité de l’onde', unit: 'm/s', value: '299792458', presets: MEDIA },
  ],
  compute(v) {
    const f = v.from === 'f' ? v.f : v.c / v.l
    const l = v.from === 'l' ? v.l : v.c / v.f
    const em = Math.abs(v.c - 299792458) < 1
    return {
      results: [
        { label: v.from === 'f' ? "Longueur d'onde λ" : 'Fréquence f', value: v.from === 'f' ? l : f, unit: v.from === 'f' ? 'm' : 'Hz', digits: 5, main: true },
        { label: 'Période T', value: 1 / f, unit: 's' },
        { label: 'Nombre d’onde 1/λ', value: 1 / l, unit: 'm⁻¹' },
        ...(em
          ? [
              { label: 'Énergie du photon', value: (H * f) / EV, unit: 'eV' },
              { label: 'Domaine', value: spectrum(l), format: 'text' },
            ]
          : []),
        { label: 'Quart d’onde (antenne)', value: l / 4, unit: 'm' },
      ],
    }
  },
  formulas: ['λ = c / f', 'T = 1 / f', 'E = h f'],
}

function spectrum(l) {
  if (l < 1e-11) return 'Rayons gamma'
  if (l < 1e-8) return 'Rayons X'
  if (l < 380e-9) return 'Ultraviolet'
  if (l < 450e-9) return 'Visible (violet)'
  if (l < 495e-9) return 'Visible (bleu)'
  if (l < 570e-9) return 'Visible (vert)'
  if (l < 590e-9) return 'Visible (jaune)'
  if (l < 620e-9) return 'Visible (orange)'
  if (l < 750e-9) return 'Visible (rouge)'
  if (l < 1e-3) return 'Infrarouge'
  if (l < 1) return 'Micro-ondes'
  return 'Ondes radio'
}

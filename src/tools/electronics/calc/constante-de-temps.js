export default {
  inputs: [
    {
      id: 'type',
      label: 'Circuit',
      type: 'choice',
      value: 'rc',
      options: [
        { value: 'rc', label: 'RC' },
        { value: 'rl', label: 'RL' },
      ],
    },
    { id: 'r', label: 'Résistance R', unit: 'Ω', value: '10k' },
    { id: 'c', label: 'Capacité C', unit: 'F', value: '100µ', show: (v) => v.type === 'rc' },
    { id: 'l', label: 'Inductance L', unit: 'H', value: '100m', show: (v) => v.type === 'rl' },
    { id: 'u', label: "Tension d'alimentation", unit: 'V', value: '12' },
  ],
  compute(v) {
    const rc = v.type === 'rc'
    const tau = rc ? v.r * v.c : v.l / v.r
    const energy = rc ? 0.5 * v.c * v.u * v.u : 0.5 * v.l * (v.u / v.r) ** 2
    const points = Array.from({ length: 101 }, (_, i) => (i / 100) * 5 * tau)
    return {
      results: [
        { label: 'Constante de temps τ', value: tau, unit: 's', main: true },
        { label: 'Temps à 63 % (1τ)', value: tau, unit: 's' },
        { label: 'Temps à 95 % (3τ)', value: 3 * tau, unit: 's' },
        { label: 'Temps à 99 % (5τ)', value: 5 * tau, unit: 's' },
        { label: rc ? 'Énergie stockée (C chargé)' : 'Énergie stockée (régime établi)', value: energy, unit: 'J' },
        { label: rc ? 'Courant initial' : 'Courant final', value: v.u / v.r, unit: 'A' },
      ],
      chart: {
        title: rc ? 'Charge du condensateur' : "Établissement du courant dans l'inductance",
        x: { label: 'Temps (s)' },
        y: { label: '% de la valeur finale', min: 0, max: 100 },
        series: [
          { name: rc ? 'Tension aux bornes de C' : 'Courant', points: points.map((t) => [t, 100 * (1 - Math.exp(-t / tau))]) },
          { name: rc ? 'Courant de charge' : 'Tension aux bornes de L', color: '#60a5fa', points: points.map((t) => [t, 100 * Math.exp(-t / tau)]) },
        ],
        markers: [{ x: tau, y: 63.2, label: 'τ (63 %)' }],
      },
    }
  },
  formulas: ['RC : τ = R × C', 'RL : τ = L / R', 'u(t) = U × (1 − e^(−t/τ))', 'E = ½ C U² ou ½ L I²'],
}

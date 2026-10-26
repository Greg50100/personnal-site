import { GRAVITY_PRESETS } from './gravite'

export default {
  inputs: [
    { id: 'h', label: 'Hauteur de chute', unit: 'm', value: '100' },
    { id: 'v0', label: 'Vitesse initiale vers le bas', unit: 'm/s', value: '0' },
    { id: 'g', label: 'Pesanteur g', unit: 'm/s²', value: '9.80665', presets: GRAVITY_PRESETS },
  ],
  compute(v) {
    if (!(v.h > 0 && v.g > 0)) return { error: 'La hauteur et g doivent être positifs.' }
    const t = (-v.v0 + Math.sqrt(v.v0 * v.v0 + 2 * v.g * v.h)) / v.g
    const vf = v.v0 + v.g * t
    const ts = Array.from({ length: 61 }, (_, i) => (i / 60) * t)
    return {
      results: [
        { label: 'Durée de la chute', value: t, unit: 's', main: true },
        { label: "Vitesse à l'impact", value: vf, unit: 'm/s', format: 'num', digits: 2, main: true },
        { label: "Vitesse à l'impact (km/h)", value: vf * 3.6, unit: 'km/h', format: 'num', digits: 1 },
      ],
      chart: {
        title: 'Hauteur au cours de la chute',
        x: { label: 'Temps (s)' },
        y: { label: 'Hauteur (m)', min: 0 },
        series: [{ name: 'Hauteur', points: ts.map((tt) => [tt, v.h - v.v0 * tt - 0.5 * v.g * tt * tt]) }],
      },
    }
  },
  formulas: ['h = v₀t + ½ g t²', 'v = v₀ + g t = √(v₀² + 2gh)'],
  notes: ['Sans frottement de l’air : en réalité, un parachutiste atteint une vitesse limite d’environ 200 km/h.'],
}

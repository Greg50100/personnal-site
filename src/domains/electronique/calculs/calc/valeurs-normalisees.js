import { formatSI } from '../../../../lib/si'
import { SERIES_NAMES, SERIES_TOLERANCE, closestInSeries, nearestInSeries, seriesOf } from '../eseries'

export default {
  inputs: [
    { id: 'value', label: 'Valeur souhaitée', unit: 'Ω', value: '4k' },
    { id: 'series', label: 'Série', type: 'choice', value: 'E24', options: SERIES_NAMES.map((s) => ({ value: s, label: `${s} (±${String(SERIES_TOLERANCE[s]).replace('.', ',')} %)` })) },
  ],
  compute(v) {
    if (!(v.value > 0)) return { error: 'La valeur doit être positive.' }
    const near = nearestInSeries(v.value, v.series)
    const best = closestInSeries(v.value, v.series)
    const err = (x) => `${x >= v.value ? '+' : '−'}${Math.abs((x / v.value - 1) * 100).toFixed(2).replace('.', ',')} %`
    return {
      results: [
        { label: `Valeur ${v.series} la plus proche`, value: best, unit: 'Ω', digits: 4, main: true, hint: `écart ${err(best)}` },
        { label: 'Valeur inférieure', value: near[0], unit: 'Ω', digits: 4, hint: err(near[0]) },
        { label: 'Valeur supérieure', value: near[near.length - 1], unit: 'Ω', digits: 4, hint: err(near[near.length - 1]) },
        { label: 'Plus petite série contenant la valeur', value: seriesOf(v.value) ?? 'aucune', format: 'text' },
      ],
      table: {
        title: `Toutes les valeurs ${v.series} de la décade`,
        columns: ['n°', 'Valeur'],
        rows: nearestInSeries(10 ** Math.floor(Math.log10(v.value)), v.series)
          .slice(0, 1)
          .flatMap((start) => {
            const out = []
            let x = start
            for (let i = 0; i < 200 && x < start * 10 * (1 - 1e-9); i++) {
              out.push([String(i + 1), formatSI(x, 'Ω', 4)])
              x = nearestInSeries(x * 1.0001, v.series).pop()
            }
            return out
          }),
      },
    }
  },
  notes: ['Les séries E (CEI 60063) répartissent les valeurs de façon géométrique : chaque série correspond à une tolérance (E12 ±10 %, E24 ±5 %, E96 ±1 %…). Fonctionne aussi pour les condensateurs et les inductances.'],
}

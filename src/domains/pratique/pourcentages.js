import { smartNumber } from '../../lib/format'

const MODES = {
  of: { label: 'x % de y', a: 'Pourcentage x (%)', b: 'Valeur y', run: (a, b) => ({ value: (a / 100) * b, text: `${smartNumber(a)} % de ${smartNumber(b)}` }) },
  ratio: { label: 'x est quel % de y', a: 'Valeur x', b: 'Valeur totale y', run: (a, b) => ({ value: (a / b) * 100, unit: '%', text: `${smartNumber(a)} sur ${smartNumber(b)}` }) },
  change: { label: 'Évolution de x à y', a: 'Valeur de départ x', b: "Valeur d'arrivée y", run: (a, b) => ({ value: ((b - a) / Math.abs(a)) * 100, unit: '%', text: 'taux d’évolution', coef: b / a }) },
  apply: { label: 'y après une évolution de x %', a: 'Évolution x (%), négative pour une baisse', b: 'Valeur initiale y', run: (a, b) => ({ value: b * (1 + a / 100), text: `${smartNumber(b)} ${a >= 0 ? '+' : '−'} ${smartNumber(Math.abs(a))} %` }) },
  reverse: { label: 'Valeur avant une évolution de x %', a: 'Évolution x (%)', b: 'Valeur finale y', run: (a, b) => ({ value: b / (1 + a / 100), text: 'valeur initiale' }) },
}

export default {
  inputs: [
    { id: 'mode', label: 'Calcul', type: 'choice', value: 'of', options: Object.entries(MODES).map(([value, m]) => ({ value, label: m.label })) },
    { id: 'a', label: (v) => MODES[v?.mode ?? 'of'].a, type: 'number', value: '20' },
    { id: 'b', label: (v) => MODES[v?.mode ?? 'of'].b, type: 'number', value: '50' },
  ],
  compute(v) {
    const m = MODES[v.mode]
    if ((v.mode === 'ratio' && v.b === 0) || (v.mode === 'change' && v.a === 0) || (v.mode === 'reverse' && v.a === -100)) return { error: 'Division par zéro.' }
    const r = m.run(v.a, v.b)
    const results = [{ label: r.text, value: r.value, unit: r.unit, format: 'auto', digits: 8, main: true }]
    if (r.coef !== undefined) results.push({ label: 'Coefficient multiplicateur', value: r.coef, format: 'auto', digits: 6 })
    if (v.mode === 'change') results.push({ label: 'Écart absolu', value: v.b - v.a, format: 'auto', digits: 8 })
    return { results }
  },
  formulas: ['x % de y = x/100 × y', 'Taux d’évolution = (y − x) / x × 100', 'Coefficient = 1 + taux/100'],
  notes: ['Une hausse de 20 % suivie d’une baisse de 20 % ne ramène pas à la valeur de départ : 1,2 × 0,8 = 0,96.'],
}

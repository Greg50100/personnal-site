import { DAY, addYMD, businessDays, dayOfYear, fmtLong, isoWeek, parseISODate, ymdDiff } from './dates'

const plural = (n, word) => `${n} ${word}${Math.abs(n) > 1 && !word.endsWith('s') ? 's' : ''}`

export default {
  inputs: [
    {
      id: 'mode',
      label: 'Calcul',
      type: 'choice',
      value: 'diff',
      options: [
        { value: 'diff', label: 'Écart entre deux dates' },
        { value: 'add', label: 'Ajouter / retirer une durée' },
      ],
    },
    { id: 'start', label: 'Date de départ', type: 'date', value: 'today' },
    { id: 'end', label: "Date d'arrivée", type: 'date', value: '2027-01-01', show: (v) => v.mode === 'diff' },
    { id: 'y', label: 'Années', type: 'number', value: '0', show: (v) => v.mode === 'add' },
    { id: 'm', label: 'Mois', type: 'number', value: '0', show: (v) => v.mode === 'add' },
    { id: 'd', label: 'Jours (négatif pour retirer)', type: 'number', value: '100', show: (v) => v.mode === 'add' },
  ],
  compute(v) {
    const a = parseISODate(v.start)
    if (!a) return { error: 'Date de départ invalide.' }
    if (v.mode === 'add') {
      if (![v.y, v.m, v.d].every(Number.isInteger)) return { error: 'Les durées doivent être des nombres entiers.' }
      const r = addYMD(a, { y: v.y, m: v.m, d: v.d })
      return {
        results: [
          { label: 'Date obtenue', value: fmtLong(r), format: 'text', main: true },
          { label: 'Jour de l’année', value: String(dayOfYear(r)), format: 'text' },
          { label: 'Semaine ISO', value: String(isoWeek(r)), format: 'text' },
          { label: 'Écart total', value: plural(Math.round((r - a) / DAY), 'jour'), format: 'text' },
        ],
      }
    }
    const b = parseISODate(v.end)
    if (!b) return { error: "Date d'arrivée invalide." }
    const [from, to] = a <= b ? [a, b] : [b, a]
    const days = Math.round((to - from) / DAY)
    const { y, m, d } = ymdDiff(from, to)
    return {
      results: [
        { label: 'Écart', value: plural(days, 'jour'), format: 'text', main: true, hint: a > b ? 'la date d’arrivée précède la date de départ' : undefined },
        { label: 'Soit', value: [y && plural(y, 'an'), m && `${m} mois`, (d || (!y && !m)) && plural(d, 'jour')].filter(Boolean).join(', '), format: 'text' },
        { label: 'En semaines', value: `${Math.floor(days / 7)} sem. et ${plural(days % 7, 'jour')}`, format: 'text' },
        { label: 'Jours ouvrés (lun.–ven.)', value: String(businessDays(from, to)), format: 'text' },
        { label: 'En heures', value: (days * 24).toLocaleString('fr-FR'), format: 'text' },
        { label: 'Départ', value: fmtLong(a), format: 'text' },
        { label: 'Arrivée', value: fmtLong(b), format: 'text' },
      ],
    }
  },
  notes: ['Les jours ouvrés ne tiennent pas compte des jours fériés (voir l’outil « Pâques et jours fériés »).'],
}

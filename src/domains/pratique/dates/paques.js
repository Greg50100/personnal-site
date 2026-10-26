import { DAY, easter, fmtLong, orthodoxEaster } from './dates'

/** Fêtes mobiles (décalage en jours par rapport à Pâques). */
const MOVABLE = [
  [-47, 'Mardi gras'],
  [-46, 'Mercredi des Cendres'],
  [-7, 'Dimanche des Rameaux'],
  [-2, 'Vendredi saint'],
  [0, 'Pâques'],
  [1, 'Lundi de Pâques', true],
  [39, 'Ascension', true],
  [49, 'Pentecôte'],
  [50, 'Lundi de Pentecôte', true],
]

/** Jours fériés légaux en France métropolitaine. */
export function frenchHolidays(year) {
  const e = easter(year).getTime()
  const fixed = [
    [0, 1, "Jour de l'an"],
    [4, 1, 'Fête du Travail'],
    [4, 8, 'Victoire 1945'],
    [6, 14, 'Fête nationale'],
    [7, 15, 'Assomption'],
    [10, 1, 'Toussaint'],
    [10, 11, 'Armistice 1918'],
    [11, 25, 'Noël'],
  ].map(([m, d, name]) => ({ date: new Date(Date.UTC(year, m, d)), name }))
  const movable = MOVABLE.filter((x) => x[2]).map(([off, name]) => ({ date: new Date(e + off * DAY), name }))
  return [...fixed, ...movable].sort((a, b) => a.date - b.date)
}

export default {
  inputs: [{ id: 'year', label: 'Année', type: 'number', value: String(new Date().getFullYear()) }],
  compute(v) {
    if (!Number.isInteger(v.year) || v.year < 1583 || v.year > 9999) return { error: 'Année grégorienne entre 1583 et 9999.' }
    const e = easter(v.year)
    return {
      results: [
        { label: 'Pâques (catholiques et protestants)', value: fmtLong(e), format: 'text', main: true },
        { label: 'Pâques orthodoxe', value: fmtLong(orthodoxEaster(v.year)), format: 'text' },
      ],
      table: {
        title: `Fêtes mobiles et jours fériés en France en ${v.year}`,
        columns: ['Date', 'Fête'],
        rows: [
          ...MOVABLE.map(([off, name, ferie]) => ({ date: new Date(e.getTime() + off * DAY), name: `${name}${ferie ? ' (férié)' : ''}` })),
          ...frenchHolidays(v.year).filter((h) => !MOVABLE.some((m) => m[1] === h.name)).map((h) => ({ ...h, name: `${h.name} (férié)` })),
        ]
          .sort((a, b) => a.date - b.date)
          .map((x) => [fmtLong(x.date), x.name]),
      },
    }
  },
  notes: ['Pâques est le dimanche qui suit la première pleine lune ecclésiastique du printemps (au plus tôt le 22 mars, au plus tard le 25 avril). En Alsace-Moselle s’ajoutent le Vendredi saint et le 26 décembre.'],
}

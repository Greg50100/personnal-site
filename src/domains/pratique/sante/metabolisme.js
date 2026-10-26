const ACTIVITY = [
  { value: '1.2', label: 'Sédentaire' },
  { value: '1.375', label: 'Activité légère (1 à 3 séances/semaine)' },
  { value: '1.55', label: 'Activité modérée (3 à 5 séances/semaine)' },
  { value: '1.725', label: 'Activité intense (6 à 7 séances/semaine)' },
  { value: '1.9', label: 'Très intense (travail physique + sport)' },
]

/** Métabolisme de base (kcal/jour). */
export function bmr({ sex, w, h, age, formula }) {
  if (formula === 'hb') {
    // Harris-Benedict révisée (Roza et Shizgal, 1984)
    return sex === 'm' ? 88.362 + 13.397 * w + 4.799 * h - 5.677 * age : 447.593 + 9.247 * w + 3.098 * h - 4.33 * age
  }
  // Mifflin-St Jeor (1990)
  return 10 * w + 6.25 * h - 5 * age + (sex === 'm' ? 5 : -161)
}

export default {
  inputs: [
    {
      id: 'sex',
      label: 'Sexe',
      type: 'choice',
      value: 'm',
      options: [
        { value: 'm', label: 'Homme' },
        { value: 'f', label: 'Femme' },
      ],
    },
    { id: 'age', label: 'Âge', type: 'number', unit: 'ans', value: '30' },
    { id: 'w', label: 'Poids', type: 'number', unit: 'kg', value: '70' },
    { id: 'h', label: 'Taille', type: 'number', unit: 'cm', value: '175' },
    { id: 'activity', label: "Niveau d'activité", type: 'choice', value: '1.55', options: ACTIVITY },
    {
      id: 'formula',
      label: 'Formule',
      type: 'choice',
      value: 'msj',
      options: [
        { value: 'msj', label: 'Mifflin-St Jeor' },
        { value: 'hb', label: 'Harris-Benedict' },
      ],
    },
  ],
  compute(v) {
    const base = bmr(v)
    const total = base * Number(v.activity)
    const kcal = (x) => `${Math.round(x).toLocaleString('fr-FR')} kcal/j`
    return {
      results: [
        { label: 'Métabolisme de base', value: kcal(base), format: 'text', main: true },
        { label: 'Besoins quotidiens estimés', value: kcal(total), format: 'text', main: true },
        { label: 'Pour perdre ~0,5 kg/semaine', value: kcal(total - 500), format: 'text' },
        { label: 'Pour prendre ~0,5 kg/semaine', value: kcal(total + 500), format: 'text' },
      ],
    }
  },
  formulas: ['Mifflin-St Jeor : 10P + 6,25T − 5A + 5 (H) / − 161 (F)', 'Besoins = métabolisme × facteur d’activité'],
  notes: ['Estimations moyennes : les besoins réels varient de ±10 % selon les personnes.'],
}

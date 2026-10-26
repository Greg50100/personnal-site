const CATEGORIES = [
  { max: 16.5, label: 'Dénutrition' },
  { max: 18.5, label: 'Maigreur' },
  { max: 25, label: 'Corpulence normale' },
  { max: 30, label: 'Surpoids' },
  { max: 35, label: 'Obésité modérée' },
  { max: 40, label: 'Obésité sévère' },
  { max: Infinity, label: 'Obésité morbide' },
]

export const bmiCategory = (bmi) => CATEGORIES.find((c) => bmi < c.max).label

export default {
  inputs: [
    { id: 'w', label: 'Poids', type: 'number', unit: 'kg', value: '70' },
    { id: 'h', label: 'Taille', type: 'number', unit: 'cm', value: '175' },
  ],
  compute(v) {
    if (!(v.w > 0 && v.h > 0)) return { error: 'Le poids et la taille doivent être positifs.' }
    const m = v.h / 100
    const bmi = v.w / (m * m)
    return {
      results: [
        { label: 'Indice de masse corporelle', value: bmi, format: 'num', digits: 1, main: true, hint: bmiCategory(bmi) },
        { label: 'Poids « normal » pour cette taille', value: `${(18.5 * m * m).toFixed(1).replace('.', ',')} à ${(25 * m * m).toFixed(1).replace('.', ',')} kg`, format: 'text' },
      ],
      table: {
        title: "Classification de l'OMS (adultes)",
        columns: ['IMC', 'Interprétation'],
        rows: [
          ['< 18,5', 'Insuffisance pondérale'],
          ['18,5 – 25', 'Corpulence normale'],
          ['25 – 30', 'Surpoids'],
          ['30 – 35', 'Obésité modérée'],
          ['35 – 40', 'Obésité sévère'],
          ['≥ 40', 'Obésité morbide'],
        ],
      },
    }
  },
  formulas: ['IMC = poids (kg) / taille² (m²)'],
  notes: ["Indicateur statistique pour les adultes de 18 à 65 ans : il ne distingue pas masse musculaire et masse grasse et ne remplace pas l'avis d'un professionnel de santé."],
}

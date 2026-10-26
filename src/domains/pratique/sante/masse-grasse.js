/** Pourcentage de masse grasse, méthode de l'US Navy (mesures en cm). */
export function bodyFat({ sex, h, neck, waist, hip }) {
  if (sex === 'm') return 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450
  return 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(h)) - 450
}

const RANGES = {
  m: [
    [6, 'Graisse essentielle'],
    [14, 'Athlète'],
    [18, 'Forme'],
    [25, 'Moyenne'],
    [Infinity, 'Élevée'],
  ],
  f: [
    [14, 'Graisse essentielle'],
    [21, 'Athlète'],
    [25, 'Forme'],
    [32, 'Moyenne'],
    [Infinity, 'Élevée'],
  ],
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
    { id: 'h', label: 'Taille', type: 'number', unit: 'cm', value: '178' },
    { id: 'w', label: 'Poids', type: 'number', unit: 'kg', value: '75' },
    { id: 'neck', label: 'Tour de cou', type: 'number', unit: 'cm', value: '38' },
    { id: 'waist', label: 'Tour de taille (au nombril)', type: 'number', unit: 'cm', value: '85' },
    { id: 'hip', label: 'Tour de hanches', type: 'number', unit: 'cm', value: '95', show: (v) => v.sex === 'f' },
  ],
  compute(v) {
    const bf = bodyFat(v)
    if (!Number.isFinite(bf) || bf <= 0 || bf > 70) return { error: 'Mesures incohérentes : vérifiez les tours de cou, de taille et de hanches.' }
    const label = RANGES[v.sex].find(([max]) => bf < max)[1]
    return {
      results: [
        { label: 'Masse grasse', value: bf / 100, format: 'percent', main: true, hint: label },
        { label: 'Masse grasse (kg)', value: (v.w * bf) / 100, unit: 'kg', format: 'num', digits: 1 },
        { label: 'Masse maigre (kg)', value: v.w * (1 - bf / 100), unit: 'kg', format: 'num', digits: 1 },
      ],
    }
  },
  formulas: ['US Navy (cm) : 495 / (1,0324 − 0,19077 log(taille − cou) + 0,15456 log(T)) − 450'],
  notes: ['Méthode par mensurations, précise à ±3 % environ par rapport aux mesures de référence.'],
}

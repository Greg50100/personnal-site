import { DataTable, Notes, RefSection, Sources } from './ui'

/**
 * PILES ET ACCUMULATEURS
 * Formats (désignations IEC 60086, dimensions) et chimies (tensions de fonctionnement). Les capacités sont
 * des ordres de grandeur à faible courant : elles chutent fortement sous forte charge et par le froid.
 */

const FORMATS = [
  ['AAA', 'LR03 / HR03 / FR03', 'Micro', '10,5 × 44,5', '1,5 V', '≈ 1 200 mAh (alcaline), 800 à 1 100 (NiMH)'],
  ['AA', 'LR6 / HR6 / FR6', 'Mignon', '14,5 × 50,5', '1,5 V', '≈ 2 700 mAh (alcaline), 1 900 à 2 800 (NiMH)'],
  ['C', 'LR14 / HR14', 'Baby', '26,2 × 50', '1,5 V', '≈ 8 000 mAh (alcaline)'],
  ['D', 'LR20 / HR20', 'Mono', '34,2 × 61,5', '1,5 V', '12 000 à 18 000 mAh (alcaline)'],
  ['AAAA', 'LR61', 'Mini', '8,3 × 42,5', '1,5 V', '≈ 600 mAh'],
  ['N', 'LR1', 'Lady', '12 × 30,2', '1,5 V', '≈ 1 000 mAh'],
  ['9 V', '6LR61 / 6HR61', 'PP3', '48,5 × 26,5 × 17,5', '9 V (8,4 V en NiMH)', '≈ 550 mAh (alcaline), 200 à 300 (NiMH)'],
  ['4,5 V', '3LR12', 'Pile plate', '67 × 62 × 22', '4,5 V', '≈ 6 000 mAh'],
  ['A23', '8LR932', 'MN21, 23A', '10,3 × 28,5', '12 V', '≈ 55 mAh'],
  ['A27', '8LR732', 'MN27', '8 × 28,2', '12 V', '≈ 20 mAh'],
  ['CR2032', 'CR2032', 'Bouton lithium', '20 × 3,2', '3 V', '≈ 225 mAh'],
  ['CR2025', 'CR2025', 'Bouton lithium', '20 × 2,5', '3 V', '≈ 160 mAh'],
  ['CR2016', 'CR2016', 'Bouton lithium', '20 × 1,6', '3 V', '≈ 90 mAh'],
  ['CR2450', 'CR2450', 'Bouton lithium', '24,5 × 5', '3 V', '≈ 600 mAh'],
  ['CR1220', 'CR1220', 'Bouton lithium', '12,5 × 2', '3 V', '≈ 40 mAh'],
  ['LR44', 'LR44 / SR44', 'AG13, 357', '11,6 × 5,4', '1,5 V (1,55 V en oxyde d’argent)', '110 à 200 mAh'],
  ['LR41', 'LR41 / SR41', 'AG3, 392', '7,9 × 3,6', '1,5 V (1,55 V)', '25 à 45 mAh'],
  ['CR123A', 'CR17345', '123', '17 × 34,5', '3 V', '≈ 1 500 mAh'],
  ['CR2', 'CR15H270', '—', '15,6 × 27', '3 V', '≈ 850 mAh'],
  ['14500', '—', 'Li-ion taille AA', '14 × 50', '3,6 à 3,7 V', '600 à 1 000 mAh'],
  ['18650', '—', 'Li-ion', '18 × 65', '3,6 à 3,7 V', '1 800 à 3 500 mAh'],
  ['21700', '—', 'Li-ion', '21 × 70', '3,6 à 3,7 V', '3 000 à 5 000 mAh'],
  ['26650', '—', 'Li-ion ou LiFePO4', '26 × 65', '3,6 V (3,2 V en LiFePO4)', '3 000 à 5 500 mAh'],
]

const CHEMISTRIES = [
  ['Alcaline (Zn-MnO₂)', 'non', '1,5 V', '1,6 V', '0,9 à 1,0 V', 'La pile courante ; tension qui baisse régulièrement.'],
  ['Lithium (Li-FeS₂, FR6)', 'non', '1,5 V', '1,8 V', '0,9 V', 'Légère, tient le froid ; remplace une alcaline en AA et AAA.'],
  ['Lithium (Li-MnO₂, CR)', 'non', '3,0 V', '3,3 V', '2,0 V', 'Piles bouton CR ; très faible autodécharge, idéale pour capteurs et horloges.'],
  ['Oxyde d’argent (SR)', 'non', '1,55 V', '1,6 V', '1,2 V', 'Tension très stable : montres, instruments.'],
  ['Zinc-air', 'non', '1,4 V', '1,45 V', '0,9 V', 'Aides auditives ; s’active à l’air en retirant l’opercule.'],
  ['NiMH', 'oui', '1,2 V', '1,4 à 1,45 V', '1,0 V', 'Remplace une alcaline dans la plupart des appareils. Version LSD (faible autodécharge) : environ 15 % perdus la première année.'],
  ['NiCd', 'oui', '1,2 V', '1,4 V', '1,0 V', 'Effet mémoire, cadmium toxique : interdite à la vente pour la plupart des usages dans l’UE.'],
  ['Li-ion (NMC, NCA)', 'oui', '3,6 à 3,7 V', '4,2 V', '2,5 à 3,0 V', 'Charge à courant puis tension constants (CC/CV) ; protection obligatoire contre la surcharge et la décharge profonde.'],
  ['LiPo', 'oui', '3,7 V', '4,2 V', '3,0 V', 'Li-ion en sachet souple ; gonfle s’il est maltraité.'],
  ['LiFePO4', 'oui', '3,2 à 3,3 V', '3,6 à 3,65 V', '2,5 V', 'Plus sûre, 2 000 cycles et plus ; 4 éléments remplacent une batterie au plomb de 12 V.'],
  ['Plomb-acide (12 V)', 'oui', '2,0 V par élément', '12,7 V au repos', '10,5 V', 'Floating 13,5 à 13,8 V ; charge 14,4 à 14,7 V. Ne pas la laisser déchargée.'],
]

const SOURCES = [
  { label: 'Battery sizes (Wikipedia)', url: 'https://en.wikipedia.org/wiki/List_of_battery_sizes' },
  { label: 'Battery chemistries (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Comparison_of_commercial_battery_types' },
  { label: 'Battery University', url: 'https://batteryuniversity.com/' },
]

export default function Batteries() {
  return (
    <div className="space-y-6">
      <RefSection id="formats" title="Formats" intro="Désignation IEC : L = alcaline, H = NiMH, F = lithium Li-FeS₂, C = lithium 3 V, S = oxyde d’argent ; R = cylindrique ou bouton.">
        <DataTable
          searchable
          placeholder="Format (AA, CR2032, 18650…)"
          columns={[{ label: 'Format' }, { label: 'IEC', mono: true }, { label: 'Autres noms' }, { label: 'Dimensions (mm)' }, { label: 'Tension' }, { label: 'Capacité (ordre de grandeur)', wrap: true }]}
          rows={FORMATS}
        />
      </RefSection>
      <RefSection id="chimies" title="Chimies et tensions" intro="Tension nominale, tension pleine charge (ou neuve) et tension de fin de décharge.">
        <DataTable
          columns={[{ label: 'Chimie' }, { label: 'Rechargeable' }, { label: 'Nominale' }, { label: 'Pleine' }, { label: 'Fin de décharge' }, { label: 'À savoir', wrap: true }]}
          rows={CHEMISTRIES}
        />
        <Notes
          items={[
            'Une cellule 14500 a la taille d’une pile AA mais 3,7 V : elle détruit un appareil prévu pour 1,5 V.',
            'Les capacités indiquées valent à faible courant ; un appareil gourmand (moteur, flash) en tire beaucoup moins d’une alcaline.',
            'Autonomie d’un montage : voir les outils Autonomie de batterie et Autonomie en veille profonde.',
          ]}
        />
      </RefSection>
      <Sources links={SOURCES} />
    </div>
  )
}

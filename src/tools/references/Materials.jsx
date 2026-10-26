import { DataTable, Notes, RefSection, Sources } from './ui'

/**
 * MATÉRIAUX
 * Résistivité à 20 °C et coefficient de température des conducteurs ; permittivité relative des isolants.
 * Valeurs usuelles (elles varient avec la pureté, l'alliage, la fréquence et la température).
 */

const CONDUCTORS = [
  ['Argent', '1,59 × 10⁻⁸', '0,0038', 'Le meilleur conducteur.'],
  ['Cuivre', '1,68 × 10⁻⁸', '0,0039', 'Câbles, pistes de circuit imprimé.'],
  ['Cuivre recuit (étalon IACS)', '1,724 × 10⁻⁸', '0,00393', 'Référence des tableaux de fils.'],
  ['Or', '2,44 × 10⁻⁸', '0,0034', 'Contacts (ne s’oxyde pas).'],
  ['Aluminium', '2,65 × 10⁻⁸', '0,0039', 'Lignes aériennes, dissipateurs.'],
  ['Tungstène', '5,60 × 10⁻⁸', '0,0045', 'Filaments de lampes.'],
  ['Zinc', '5,90 × 10⁻⁸', '0,0037', ''],
  ['Nickel', '6,99 × 10⁻⁸', '0,006', 'Bandes de soudure des accus.'],
  ['Laiton', '≈ 7 × 10⁻⁸', '0,0015', 'Bornes, connecteurs.'],
  ['Fer', '9,7 × 10⁻⁸', '0,005', ''],
  ['Platine', '1,06 × 10⁻⁷', '0,00392', 'Sondes Pt100 (α normalisé : 0,00385).'],
  ['Étain', '1,09 × 10⁻⁷', '0,0045', 'Soudure.'],
  ['Plomb', '2,2 × 10⁻⁷', '0,0039', ''],
  ['Manganine', '4,82 × 10⁻⁷', '0,000002', 'Shunts de mesure (α presque nul).'],
  ['Constantan', '4,9 × 10⁻⁷', '0,000008', 'Résistances de précision, thermocouples.'],
  ['Acier inoxydable', '6,9 × 10⁻⁷', '0,00094', ''],
  ['Mercure', '9,8 × 10⁻⁷', '0,0009', ''],
  ['Nichrome', '1,10 × 10⁻⁶', '0,0004', 'Fils chauffants, résistances bobinées.'],
  ['Graphite', '2,5 à 5 × 10⁻⁶', 'négatif', 'Balais, électrodes.'],
]

const DIELECTRICS = [
  ['Vide', '1', 'Référence (ε₀ = 8,854 × 10⁻¹² F/m).'],
  ['Air sec', '1,0006', 'Rigidité diélectrique ≈ 3 kV/mm.'],
  ['PTFE (Téflon)', '2,1', 'Câbles et circuits hautes fréquences.'],
  ['Polyéthylène', '2,25', 'Isolant des câbles coaxiaux.'],
  ['Polypropylène', '2,2 à 2,4', 'Condensateurs à film (audio, puissance).'],
  ['Polystyrène', '2,4 à 2,7', 'Condensateurs de précision.'],
  ['Kapton (polyimide)', '3,4', 'Circuits souples, ruban isolant.'],
  ['Papier', '3,5', 'Anciens condensateurs.'],
  ['Quartz fondu', '3,8', ''],
  ['Verre', '3,7 à 10', ''],
  ['FR-4 (époxy-verre)', '4,2 à 4,8', 'Circuits imprimés courants (≈ 4,4 à 1 MHz).'],
  ['Mica', '3 à 6', 'Isolants de transistors de puissance.'],
  ['Alumine', '9,3 à 11,5', 'Substrats céramiques.'],
  ['Silicium', '11,7', ''],
  ['Eau (20 °C)', '80', ''],
  ['Titanate de baryum', '1 200 à 10 000', 'Condensateurs céramiques de forte valeur (X7R, Y5V).'],
]

const SOURCES = [
  { label: 'Electrical resistivity and conductivity (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Electrical_resistivity_and_conductivity' },
  { label: 'Relative permittivity (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Relative_permittivity' },
]

export default function Materials() {
  return (
    <div className="space-y-6">
      <RefSection id="conducteurs" title="Résistivité des conducteurs" intro="R = ρ × L / S ; à une autre température : R(T) = R₂₀ × (1 + α × (T − 20 °C)).">
        <DataTable
          searchable
          placeholder="Matériau"
          columns={[{ label: 'Matériau' }, { label: 'ρ à 20 °C (Ω·m)', mono: true }, { label: 'α (/K)', mono: true }, { label: 'Usage', wrap: true }]}
          rows={CONDUCTORS}
        />
        <Notes items={['Un fil de cuivre de 1 mm² et 1 m fait 0,017 Ω ; il gagne environ 0,4 % par degré.', 'Pour obtenir ρ en Ω·mm²/m, multiplier la valeur en Ω·m par 10⁶ (cuivre : 0,0168).']} />
      </RefSection>
      <RefSection id="isolants" title="Permittivité relative des isolants" intro="C = ε₀ × εr × S / d : à géométrie égale, la capacité est proportionnelle à εr.">
        <DataTable columns={[{ label: 'Matériau' }, { label: 'εr', mono: true }, { label: 'Usage', wrap: true }]} rows={DIELECTRICS} />
      </RefSection>
      <Sources links={SOURCES} />
    </div>
  )
}

import { DataTable, Notes, RefSection, Sources, Swatch } from './ui'

/** Fusibles enfichables automobiles (ISO 8820-3, formats standard et mini) : couleur selon le calibre. */
const BLADE = [
  ['1 A', ['#111827'], 'noir'],
  ['2 A', ['#9ca3af'], 'gris'],
  ['3 A', ['#7c3aed'], 'violet'],
  ['4 A', ['#f472b6'], 'rose'],
  ['5 A', ['#d2b48c'], 'beige (havane)'],
  ['7,5 A', ['#8b5a2b'], 'marron'],
  ['10 A', ['#dc2626'], 'rouge'],
  ['15 A', ['#2563eb'], 'bleu'],
  ['20 A', ['#facc15'], 'jaune'],
  ['25 A', ['#f5f5f4'], 'transparent ou blanc'],
  ['30 A', ['#16a34a'], 'vert'],
  ['35 A', ['#14b8a6'], 'bleu-vert'],
  ['40 A', ['#f97316'], 'orange'],
]

const SPEED = [
  ['FF', 'Très rapide', 'Protection des semi-conducteurs.'],
  ['F', 'Rapide', 'Circuits électroniques sans pointe de courant à l’allumage.'],
  ['M', 'Semi-temporisé', 'Usage intermédiaire.'],
  ['T', 'Temporisé', 'Transformateurs, moteurs, alimentations à fort appel de courant.'],
  ['TT', 'Très temporisé', 'Forts courants d’appel.'],
]

const BREAKING = [
  ['L', 'Faible pouvoir de coupure', 'Tube de verre ; 35 A ou 10 × In.'],
  ['E', 'Pouvoir de coupure renforcé', '150 A.'],
  ['H', 'Haut pouvoir de coupure', 'Céramique remplie de sable ; 1 500 A. Obligatoire sur le secteur en amont d’une alimentation.'],
]

const FORMATS = [
  ['5 × 20 mm', 'Électronique en Europe (IEC 60127)', 'verre ou céramique'],
  ['6,3 × 32 mm', 'Électronique en Amérique du Nord (« 3AG »)', 'verre ou céramique'],
  ['Enfichable mini (ATM)', 'Automobile, 10,9 × 16,3 mm', 'calibres de 1 à 40 A'],
  ['Enfichable standard (ATO, ATC)', 'Automobile, 19,1 × 18,5 mm', 'calibres de 1 à 40 A'],
  ['Enfichable maxi', 'Automobile, forte intensité', '20 à 100 A, couleurs différentes'],
  ['10 × 38 mm (gG)', 'Tableaux électriques domestiques et industriels', 'protection des lignes'],
  ['CMS (0603, 1206…)', 'Cartes électroniques', 'non remplaçables'],
  ['Réarmable (PTC, « polyfuse »)', 'Ports USB, cartes de développement', 'se rétablit après refroidissement'],
]

const SOURCES = [
  { label: 'Fuse (electrical) (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Fuse_(electrical)' },
  { label: 'Automotive fuse (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Fuse_(automotive)' },
]

export default function Fuses() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <RefSection id="auto" title="Fusibles automobiles : couleurs" intro="Formats enfichables standard et mini ; le calibre est aussi gravé sur le dessus.">
          <DataTable columns={[{ label: 'Calibre' }, { label: 'Couleur' }]} rows={BLADE.map(([a, c, name]) => [a, <Swatch key={a} colors={c} label={name} />])} />
        </RefSection>
        <div className="min-w-0 space-y-6">
          <RefSection id="vitesse" title="Fusibles 5 × 20 mm : rapidité" intro="Lettre placée avant le calibre dans le marquage.">
            <DataTable columns={[{ label: 'Code', mono: true }, { label: 'Courbe' }, { label: 'Usage', wrap: true }]} rows={SPEED} />
          </RefSection>
          <RefSection id="coupure" title="Pouvoir de coupure" intro="Lettre placée après le calibre.">
            <DataTable columns={[{ label: 'Code', mono: true }, { label: 'Signification' }, { label: 'Détail', wrap: true }]} rows={BREAKING} />
            <Notes items={['Exemple : « T2AL250V » = temporisé, 2 A, faible pouvoir de coupure, 250 V au plus.', 'Remplacer un fusible par le même calibre, la même rapidité et le même pouvoir de coupure.']} />
          </RefSection>
        </div>
      </div>
      <RefSection id="formats" title="Formats courants">
        <DataTable columns={[{ label: 'Format' }, { label: 'Usage', wrap: true }, { label: 'Remarque' }]} rows={FORMATS} />
      </RefSection>
      <Sources links={SOURCES} />
    </div>
  )
}

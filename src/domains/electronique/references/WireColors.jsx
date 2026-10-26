import { DataTable, Notes, RefSection, Sources, Swatch } from './ui'

/** Codes couleur des conducteurs : secteur, thermocouples, câbles multiconducteurs. */

const C = {
  marron: '#8b5a2b',
  noir: '#111827',
  gris: '#9ca3af',
  bleu: '#60a5fa',
  vert: '#16a34a',
  jaune: '#facc15',
  rouge: '#dc2626',
  blanc: '#f5f5f4',
  orange: '#f97316',
  violet: '#7c3aed',
  rose: '#f472b6',
}
const sw = (key, label, second) => <Swatch key={label} colors={second ? [C[key], C[second]] : [C[key]]} label={label} />

const MAINS = [
  ['Phase (monophasé)', sw('marron', 'marron'), 'toute couleur sauf bleu et vert-jaune (souvent rouge, marron ou noir)', sw('noir', 'noir (ou rouge)')],
  ['Phases L1, L2, L3', <span key="l">{sw('marron', 'marron')} · {sw('noir', 'noir')} · {sw('gris', 'gris')}</span>, 'idem', 'noir, rouge, bleu'],
  ['Neutre', sw('bleu', 'bleu'), sw('bleu', 'bleu clair'), sw('blanc', 'blanc ou gris')],
  ['Terre (PE)', sw('vert', 'vert-jaune', 'jaune'), sw('vert', 'vert-jaune', 'jaune'), sw('vert', 'vert ou nu')],
]

const THERMOCOUPLES = [
  ['K', 'Chromel / Alumel', '−200 à 1 250 °C', sw('vert', 'vert'), sw('jaune', 'jaune'), 'Le plus courant.'],
  ['J', 'Fer / Constantan', '−40 à 750 °C', sw('noir', 'noir'), sw('noir', 'noir'), ''],
  ['T', 'Cuivre / Constantan', '−200 à 350 °C', sw('marron', 'marron'), sw('bleu', 'bleu'), 'Basses températures.'],
  ['E', 'Chromel / Constantan', '−200 à 900 °C', sw('violet', 'violet'), sw('violet', 'violet'), 'Plus forte tension.'],
  ['N', 'Nicrosil / Nisil', '−200 à 1 300 °C', sw('rose', 'rose'), sw('orange', 'orange'), 'Plus stable que le K.'],
  ['R, S', 'Platine-rhodium / Platine', '0 à 1 600 °C', sw('orange', 'orange'), sw('vert', 'vert'), 'Fours, laboratoire.'],
]

const DIN47100 = [
  [1, 'blanc', 'blanc'],
  [2, 'marron', 'marron'],
  [3, 'vert', 'vert'],
  [4, 'jaune', 'jaune'],
  [5, 'gris', 'gris'],
  [6, 'rose', 'rose'],
  [7, 'bleu', 'bleu'],
  [8, 'rouge', 'rouge'],
  [9, 'noir', 'noir'],
  [10, 'violet', 'violet'],
  [11, 'gris', 'gris-rose', 'rose'],
  [12, 'rouge', 'rouge-bleu', 'bleu'],
]

const SOURCES = [
  { label: 'Electrical wiring colour codes (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Electrical_wiring' },
  { label: 'Thermocouple (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Thermocouple' },
  { label: 'DIN 47100 (Wikipedia, en allemand)', url: 'https://de.wikipedia.org/wiki/DIN_47100' },
]

export default function WireColors() {
  return (
    <div className="space-y-6">
      <RefSection id="secteur" title="Installations électriques" intro="Europe : couleurs harmonisées (IEC 60445, NF C 15-100 en France) ; États-Unis : NEC.">
        <DataTable columns={[{ label: 'Conducteur' }, { label: 'Europe (IEC 60445)' }, { label: 'France (NF C 15-100)', wrap: true }, { label: 'États-Unis' }]} rows={MAINS} />
        <Notes
          items={[
            'Le vert-jaune est réservé à la terre ; le bleu au neutre (ou, à défaut de neutre, à une phase repérée).',
            'Dans les anciennes installations, les couleurs peuvent être quelconques : toujours vérifier au testeur, hors tension.',
            'En courant continu basse tension, l’usage est rouge pour le +, noir pour le −.',
          ]}
        />
      </RefSection>
      <RefSection id="thermocouples" title="Thermocouples" intro="Gaine et fil + de la couleur du type, fil − blanc (IEC 60584-3) ; en norme américaine (ANSI), le fil − est rouge.">
        <DataTable
          columns={[{ label: 'Type' }, { label: 'Couple' }, { label: 'Plage' }, { label: 'IEC (gaine et +)' }, { label: 'ANSI (gaine)' }, { label: 'Remarque', wrap: true }]}
          rows={THERMOCOUPLES}
        />
      </RefSection>
      <RefSection id="din47100" title="Câbles multiconducteurs (DIN 47100)" intro="Ordre des couleurs des câbles de commande et de données (12 premiers conducteurs).">
        <DataTable columns={[{ label: 'N°' }, { label: 'Couleur' }]} rows={DIN47100.map(([n, a, label, b]) => [n, sw(a, label, b)])} />
        <Notes items={['Câbles réseau (paires torsadées) : voir l’Ethernet RJ45 dans les brochages de connecteurs.']} />
      </RefSection>
      <Sources links={SOURCES} />
    </div>
  )
}

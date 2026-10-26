import { DataTable, Notes, RefSection, Sources } from './ui'

/** Boîtiers de composants : traversants, CMS, et tailles des résistances et condensateurs CMS. */

const THROUGH = [
  ['DIP (PDIP)', '2,54', 'Rangées écartées de 7,62 mm (15,24 mm pour les boîtiers larges)', 'NE555, ATmega328P, 74HC595'],
  ['SIP', '2,54', 'Une seule rangée', 'Réseaux de résistances'],
  ['TO-92', '1,27 ou 2,54', 'Pattes souvent formées au pas de 2,54 mm', 'BC547, 2N7000, 78L05, DS18B20'],
  ['TO-126', '2,28', 'Face arrière métallique ou trou de fixation', 'BD139, BD140'],
  ['TO-220', '2,54', 'Languette métallique percée : environ 2 W sans dissipateur', '7805, LM317, IRLZ44N, TIP120'],
  ['TO-247', '5,45', 'Forte puissance', 'IGBT, MOSFET de puissance'],
  ['TO-3', '—', 'Boîtier métallique, deux broches, carcasse = collecteur', '2N3055, anciens régulateurs'],
  ['DO-35', '—', 'Diode axiale en verre', '1N4148, Zener 0,5 W'],
  ['DO-41', '—', 'Diode axiale plastique', '1N4001 à 1N4007, Zener 1 W'],
  ['DO-201', '—', 'Diode axiale de puissance', '1N5400 à 1N5408 (3 A)'],
]

const SMD = [
  ['SOIC', '1,27', 'Corps de 3,9 mm (étroit) ou 7,5 mm (large) ; soudable au fer', 'LM358, 24LC256'],
  ['SSOP', '0,65', 'Version rétrécie du SOIC', 'FT232RL'],
  ['TSSOP', '0,65', 'Corps de 4,4 mm', '74HC595 (suffixe PW), TXS0108E'],
  ['MSOP', '0,65 ou 0,5', 'Corps de 3 mm', 'AOP, références de tension'],
  ['QFP, LQFP, TQFP', '0,8 ; 0,65 ; 0,5', 'Broches sur les quatre côtés', 'ATmega328P-AU (TQFP-32), STM32'],
  ['QFN, DFN', '0,5 ou 0,4', 'Sans pattes, plot thermique central à souder', 'ESP32, RP2040'],
  ['BGA', '1 ; 0,8 ; 0,5', 'Billes sous le boîtier : four de refusion', 'Processeurs, mémoires'],
  ['SOT-23 (3 à 6 broches)', '0,95', '2,9 × 1,3 mm', 'BSS138, AO3400, MMBT3904, LDO 150 mA'],
  ['SOT-89', '1,5', 'Languette centrale', 'Régulateurs, transistors moyens'],
  ['SOT-223', '2,3', '6,5 × 3,5 mm, grande languette', 'AMS1117'],
  ['DPAK (TO-252)', '2,28', 'TO-220 à souder à plat', 'MOSFET, régulateurs'],
  ['D²PAK (TO-263)', '2,54', 'Plus grand que le DPAK', 'MOSFET de puissance'],
  ['SOD-123, SOD-323', '—', 'Diodes CMS', '1N4148W, Zener'],
  ['SMA, SMB, SMC (DO-214)', '—', 'Diodes de puissance', 'SS34, M7, SMBJ (TVS)'],
]

const PASSIVES = [
  ['01005', '0402', '0,4 × 0,2', '1/32 W'],
  ['0201', '0603', '0,6 × 0,3', '1/20 W'],
  ['0402', '1005', '1,0 × 0,5', '1/16 W'],
  ['0603', '1608', '1,6 × 0,8', '1/10 W'],
  ['0805', '2012', '2,0 × 1,25', '1/8 W'],
  ['1206', '3216', '3,2 × 1,6', '1/4 W'],
  ['1210', '3225', '3,2 × 2,5', '1/2 W'],
  ['1812', '4532', '4,5 × 3,2', '≈ 3/4 W'],
  ['2010', '5025', '5,0 × 2,5', '3/4 W'],
  ['2512', '6332', '6,3 × 3,2', '1 W'],
]

const SOURCES = [
  { label: 'List of integrated circuit packaging types (Wikipedia)', url: 'https://en.wikipedia.org/wiki/List_of_integrated_circuit_packaging_types' },
  { label: 'Surface-mount technology (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Surface-mount_technology' },
]

export default function Packages() {
  return (
    <div className="space-y-6">
      <RefSection id="traversants" title="Boîtiers traversants">
        <DataTable searchable placeholder="Boîtier ou composant" columns={[{ label: 'Boîtier' }, { label: 'Pas (mm)', mono: true }, { label: 'Particularités', wrap: true }, { label: 'Exemples', wrap: true }]} rows={THROUGH} />
      </RefSection>
      <RefSection id="cms" title="Boîtiers CMS de circuits et de semi-conducteurs">
        <DataTable searchable placeholder="Boîtier ou composant" columns={[{ label: 'Boîtier' }, { label: 'Pas (mm)', mono: true }, { label: 'Particularités', wrap: true }, { label: 'Exemples', wrap: true }]} rows={SMD} />
        <Notes items={['Au fer à souder : SOIC sans difficulté, TSSOP et QFP avec du flux et de la tresse ; QFN et BGA demandent de l’air chaud ou un four.']} />
      </RefSection>
      <RefSection id="passifs" title="Résistances et condensateurs CMS" intro="Puissance usuelle des résistances à couche épaisse ; les condensateurs ont les mêmes tailles.">
        <DataTable columns={[{ label: 'Code impérial (pouces)', mono: true }, { label: 'Code métrique (mm)', mono: true }, { label: 'Dimensions (mm)' }, { label: 'Puissance' }]} rows={PASSIVES} />
        <Notes
          items={[
            'Attention aux deux codes : « 0603 » impérial (1,6 × 0,8 mm) n’est pas « 0603 » métrique (0,6 × 0,3 mm, soit 0201 impérial).',
            'Le 0805 et le 1206 restent faciles à souder à la main.',
            'Marquage des résistances CMS : voir l’outil Code des résistances CMS.',
          ]}
        />
      </RefSection>
      <Sources links={SOURCES} />
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addressTable, hex } from './data/modules'
import { AhctShifter, Bss138Shifter, DividerShifter, I2cBus, I2sBus, LevelChart, OneWireBus, SpiBus, UartLink } from './BusDiagrams'
import { Links, SearchField } from './ui'

const BUSES = [
  {
    name: 'I2C',
    wires: 'SDA, SCL (+ masse)',
    speed: '100 kHz, 400 kHz, 1 MHz',
    distance: 'environ 1 m (capacité ≤ 400 pF)',
    devices: 'jusqu’à 112 adresses de 7 bits',
    tips: 'Résistances de tirage obligatoires (souvent déjà sur les modules) ; vérifier les adresses.',
  },
  {
    name: 'SPI',
    wires: 'SCK, MOSI (SDO), MISO (SDI), un CS par module',
    speed: '1 à 80 MHz',
    distance: 'quelques dizaines de cm',
    devices: 'autant que de broches CS',
    tips: 'Le plus rapide : écrans, cartes SD, convertisseurs.',
  },
  {
    name: 'UART (série)',
    wires: 'TX → RX et RX → TX (croisés) + masse',
    speed: '9 600 à 1 Mbit/s (256 000 pour un LD2410)',
    distance: 'quelques mètres ; des centaines avec un RS-485',
    devices: 'deux appareils par liaison',
    tips: 'Même débit des deux côtés ; Modbus ajoute des adresses sur un RS-485.',
  },
  {
    name: '1-Wire',
    wires: 'une donnée + masse (+ alimentation)',
    speed: 'environ 16 kbit/s',
    distance: 'des dizaines de mètres avec un bon câble',
    devices: 'nombreux (adresse unique de 64 bits)',
    tips: 'Résistance de 4,7 kΩ vers l’alimentation ; câblage en ligne plutôt qu’en étoile.',
  },
  {
    name: 'I2S',
    wires: 'BCLK, WS (LRCLK), DIN / DOUT',
    speed: 'audio jusqu’à 48 kHz sur 32 bits',
    distance: 'courte (quelques cm à 20 cm)',
    devices: 'un micro et un ampli par bus',
    tips: 'Matériel sur ESP32 ; par PIO sur le Pico.',
  },
]

const LEVELS = [
  { family: 'ATmega328P (Arduino Uno, Nano) en 5 V', vih: '0,6 × VCC = 3,0 V', vil: '0,3 × VCC = 1,5 V', voh: 'proche de 5 V', src: 'atmega' },
  { family: 'Logique TTL 5 V (74HCT, 74AHCT)', vih: '2,0 V', vil: '0,8 V', voh: 'proche de 5 V', src: 'ahct' },
  { family: 'ESP32 en 3,3 V', vih: '0,75 × VDD = 2,5 V', vil: '0,25 × VDD = 0,8 V', voh: '0,8 × VDD = 2,6 V au moins', src: 'esp32' },
  { family: 'RP2040 (Pico) en 3,3 V', vih: '2,0 V', vil: '0,8 V', voh: 'proche de 3,3 V à faible courant', src: 'rp2040' },
  { family: 'LED WS2812B alimentées en 5 V', vih: '0,55 à 0,7 × VDD (2,7 à 3,5 V) selon la révision', vil: '0,3 × VDD', voh: '—', src: 'ws2812' },
]

const LINKS = [
  ['3,3 V → entrée 5 V CMOS (ATmega)', 'Fonctionne en général : 3,3 V dépasse le seuil de 3,0 V, mais avec peu de marge.', 'ok'],
  ['3,3 V → entrée TTL 5 V (74AHCT)', 'Fonctionne : le seuil est à 2,0 V.', 'ok'],
  ['3,3 V → données WS2812B en 5 V', 'À la limite : 74AHCT125 alimenté en 5 V entre les deux.', 'warn'],
  ['5 V → entrée 3,3 V (ESP, Pico, Raspberry Pi)', 'À proscrire : pont diviseur ou adaptateur de niveau.', 'bad'],
  ['I2C entre 3,3 V et 5 V', 'Adaptateur bidirectionnel BSS138 (ou PCA9306) ; les résistances de tirage de chaque côté.', 'warn'],
]

const SHIFTERS = [
  ['Pont diviseur', '5 V → 3,3 V, un sens', 'Deux résistances (1 kΩ et 2 kΩ donnent 3,33 V). Simple, mais lent avec de fortes valeurs.'],
  ['BSS138 (MOSFET)', 'bidirectionnel, lent', 'Le classique pour l’I2C, jusqu’à quelques centaines de kHz.'],
  ['74AHCT125 / 74HCT245', '3,3 V → 5 V, un sens, rapide', 'Pour les LED WS2812 et les signaux de commande 5 V.'],
  ['TXS0108E / TXB0108', 'bidirectionnel automatique', 'TXB : sorties push-pull seulement, jamais d’I2C ni de résistance de tirage.'],
  ['Optocoupleur', 'isolation galvanique', 'Lent ; pour séparer deux masses ou un circuit exposé.'],
]

const REFS = [
  { label: 'NXP UM10204 : spécification I2C', url: 'https://www.nxp.com/docs/en/user-guide/UM10204.pdf' },
  { label: 'NXP AN10441 : adaptation de niveau I2C', url: 'https://www.nxp.com/docs/en/application-note/AN10441.pdf' },
  { label: 'Fiche ESP32 (caractéristiques des E/S)', url: 'https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf' },
  { label: 'Fiche RP2040', url: 'https://datasheets.raspberrypi.com/rp2040/rp2040-datasheet.pdf' },
  { label: 'ATmega328P (Microchip)', url: 'https://www.microchip.com/en-us/product/ATmega328P' },
  { label: 'SN74AHCT125 (Texas Instruments)', url: 'https://www.ti.com/product/SN74AHCT125' },
]

const TONE = { ok: 'Possible', warn: 'Avec précaution', bad: 'Interdit' }
const TONE_CLASS = {
  ok: 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300',
  warn: 'border-amber-500/40 text-amber-800 dark:text-amber-300',
  bad: 'border-red-500/40 text-red-700 dark:text-red-300',
}

function Table({ head, rows, wrap = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
      <table className="table-data">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`align-top ${j === 0 ? 'font-medium' : ''} ${wrap.includes(j) ? 'min-w-[9rem] !whitespace-normal' : ''}`}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const BUS_DIAGRAMS = [
  ['I2C', I2cBus, 'Deux fils pour tous les modules. Les sorties ne savent que tirer à 0 : les résistances Rp ramènent les lignes à l’état haut. Chaque module a son adresse.'],
  ['SPI', SpiBus, 'Horloge et données partagées ; la carte choisit le module à qui elle parle en mettant sa ligne CS à 0.'],
  ['UART', UartLink, 'Le TX de l’un va sur le RX de l’autre, avec une masse commune. Les deux côtés doivent avoir le même débit.'],
  ['1-Wire', OneWireBus, 'Une seule résistance de 4,7 kΩ pour tout le bus ; chaque sonde a une adresse unique de 64 bits.'],
  ['I2S', I2sBus, 'Le micro et l’ampli partagent les horloges BCLK et WS d’un même port ; ESPHome peut aussi leur donner deux ports séparés.'],
]

const SHIFTER_DIAGRAMS = [
  ['Pont diviseur (5 V → 3,3 V)', DividerShifter, 'Pour une sortie 5 V vers une entrée 3,3 V, dans un seul sens.'],
  ['BSS138 (bidirectionnel)', Bss138Shifter, 'Note NXP AN10441 : chaque côté est tiré à sa tension ; un 0 d’un côté rend le MOSFET passant (ou sa diode interne) et tire l’autre côté à 0.'],
  ['74AHCT125 (3,3 V → 5 V)', AhctShifter, 'Alimenté en 5 V, il lit 3,3 V comme un état haut (seuil de 2 V) et sort 5 V ; OE à la masse active la sortie.'],
]

/** Schéma avec son titre et une phrase d'explication. */
function Diagram({ title, schema, caption }) {
  const Schema = schema
  return (
    <figure className="flex flex-col gap-2 rounded-xl border border-night-200 p-3 dark:border-night-800">
      <figcaption className="text-sm font-medium text-night-900 dark:text-night-50">{title}</figcaption>
      <div className="flex flex-1 items-center">
        <Schema />
      </div>
      <p className="text-sm text-night-600 dark:text-night-400">{caption}</p>
    </figure>
  )
}

function Section({ id, title, children }) {
  return (
    <section className="card card-pad space-y-3" aria-labelledby={id}>
      <h2 id={id} className="font-display text-lg font-semibold text-night-900 dark:text-night-50">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function BusGuide() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase().replace(/^0x/, '')
  const addresses = addressTable().filter(([a, mods]) => !q || hex(a).toLowerCase().includes(q) || mods.some((m) => m.name.toLowerCase().includes(q)))

  return (
    <div className="space-y-6">
      <Section id="bus" title="Les bus en un coup d’œil">
        <Table head={['Bus', 'Fils', 'Débit', 'Distance (ordre de grandeur)', 'Modules', 'À retenir']} rows={BUSES.map((b) => [b.name, b.wires, b.speed, b.distance, b.devices, b.tips])} wrap={[1, 2, 3, 4, 5]} />
      </Section>

      <Section id="cablage" title="Câblage des bus">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {BUS_DIAGRAMS.map(([title, Schema, caption]) => (
            <Diagram key={title} title={title} schema={Schema} caption={caption} />
          ))}
        </div>
        <p className="text-sm text-night-600 dark:text-night-400">Alimentation des modules non représentée ; un croisement sans point n’est pas une connexion.</p>
      </Section>

      <Section id="niveaux" title="Niveaux logiques : ce qui est lu comme un 0 ou un 1">
        <LevelChart />
        <Table
          head={['Famille', 'État haut lu à partir de (VIH)', 'État bas lu en dessous de (VIL)', 'Sortie à l’état haut (VOH)']}
          rows={LEVELS.map((l) => [l.family, l.vih, l.vil, l.voh])}
          wrap={[0, 1]}
        />
        <ul className="grid gap-2 md:grid-cols-2">
          {LINKS.map(([what, how, tone]) => (
            <li key={what} className="rounded-xl border border-night-200 px-3 py-2 dark:border-night-800">
              <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-night-900 dark:text-night-50">
                {what}
                <span className={`chip ${TONE_CLASS[tone]}`}>{TONE[tone]}</span>
              </p>
              <p className="text-sm text-night-600 dark:text-night-400">{how}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="adaptateurs" title="Adaptateurs de niveau">
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {SHIFTER_DIAGRAMS.map(([title, Schema, caption]) => (
            <Diagram key={title} title={title} schema={Schema} caption={caption} />
          ))}
        </div>
        <Table head={['Solution', 'Sens', 'Usage']} rows={SHIFTERS} wrap={[2]} />
        <p className="text-sm text-night-600 dark:text-night-400">
          Calculer un pont diviseur :{' '}
          <Link to="/electronique/pont-diviseur" className="text-accent-700 underline dark:text-accent-300">
            Pont diviseur de tension
          </Link>
          . Dimensionner les résistances de tirage :{' '}
          <Link to="/electronique/pull-up-i2c" className="text-accent-700 underline dark:text-accent-300">
            Résistances de tirage I2C
          </Link>
          .
        </p>
      </Section>

      <Section id="adresses" title="Adresses I2C des modules courants">
        <SearchField value={query} onChange={setQuery} placeholder="Adresse (0x76) ou module" />
        <Table
          head={['Adresse', 'Modules']}
          rows={addresses.map(([a, mods]) => [<span key="a" className="font-mono">{hex(a)}</span>, mods.map((m) => m.name).join(' · ')])}
          wrap={[1]}
        />
        <p className="text-sm text-night-600 dark:text-night-400">
          Deux modules à la même adresse ne peuvent pas partager un bus : changer l’adresse de l’un (broche ADDR, SDO ou A0), utiliser le second bus de la
          carte ou un multiplexeur TCA9548A. L’outil{' '}
          <Link to="/electronique/verifier-montage" className="text-accent-700 underline dark:text-accent-300">
            Vérifier un montage
          </Link>{' '}
          fait cette répartition automatiquement.
        </p>
      </Section>

      <Section id="sources" title="Sources">
        <Links links={REFS} />
      </Section>
    </div>
  )
}

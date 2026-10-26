import { useState } from 'react'
import { Battery, Buffer, Capacitor, Diode, Ground, Inductor, Label, Led, Meter, Mosfet, Npn, OpAmp, Resistor, Schematic, Source, Switch, VariableResistor, Wire, Zener } from '../kit/schematic'
import { SearchField } from '../materiel/ui'
import { RefSection, Sources } from './ui'

/**
 * SYMBOLES ÉLECTRONIQUES
 * Symboles de la norme IEC 60617 (utilisée en France), dessinés avec le kit de schémas du site ;
 * l'équivalent américain (ANSI/IEEE 315) est signalé quand il diffère.
 */

const W = 140
const H = 70
const A = [20, 35]
const B = [120, 35]

// Symboles absents du kit, dessinés ici
const UsResistor = () => (
  <>
    <Wire points={[A, [42, 35], [47, 25], [55, 45], [63, 25], [71, 45], [79, 25], [87, 45], [95, 25], [98, 35], B]} />
  </>
)
const PolarCap = () => (
  <>
    <Wire points={[A, [66, 35]]} />
    <line x1="66" y1="20" x2="66" y2="50" strokeWidth="3" />
    <path d="M78 20 Q72 35 78 50" fill="none" strokeWidth="3" />
    <Wire points={[[74, 35], B]} />
    <Label x={56} y={22} size={13}>
      +
    </Label>
  </>
)
const Fuse = () => (
  <>
    <rect x="46" y="28" width="48" height="14" className="fill-white dark:fill-night-900" />
    <Wire points={[A, B]} />
  </>
)
const Lamp = () => (
  <>
    <Wire points={[A, [56, 35]]} />
    <Wire points={[[84, 35], B]} />
    <circle cx="70" cy="35" r="14" className="fill-white dark:fill-night-900" />
    <path d="M60 25 L80 45 M80 25 L60 45" />
  </>
)
const Crystal = () => (
  <>
    <Wire points={[A, [56, 35]]} />
    <Wire points={[[84, 35], B]} />
    <line x1="56" y1="22" x2="56" y2="48" strokeWidth="2.5" />
    <line x1="84" y1="22" x2="84" y2="48" strokeWidth="2.5" />
    <rect x="62" y="24" width="16" height="22" className="fill-white dark:fill-night-900" />
  </>
)
const PushButton = () => (
  <>
    <Wire points={[A, [52, 35]]} />
    <Wire points={[[88, 35], B]} />
    <circle cx="54" cy="35" r="2.5" />
    <circle cx="86" cy="35" r="2.5" />
    <path d="M50 24 L90 24 M70 24 L70 12" />
  </>
)
const Photodiode = () => (
  <>
    <Diode a={A} b={B} />
    <path d="M58 6 l10 12 m0 0 l-6 -1 m6 1 l-1 -6 M70 4 l10 12 m0 0 l-6 -1 m6 1 l-1 -6" strokeWidth="1.5" />
  </>
)
const Pnp = () => (
  <>
    <circle cx="78" cy="35" r="20" className="fill-white dark:fill-night-900" />
    <line x1="40" y1="35" x2="72" y2="35" />
    <line x1="72" y1="23" x2="72" y2="47" strokeWidth="3" />
    <path d="M72 29 L86 19 L86 5 M72 41 L86 51 L86 65" />
    <path d="M74 28 l6.9 -0.7 M74 28 l2.9 -6.4" />
    <Label x={92} y={10} anchor="start" size={10} muted>
      E
    </Label>
    <Label x={92} y={66} anchor="start" size={10} muted>
      C
    </Label>
  </>
)
const NpnSym = () => (
  <>
    <Npn x={52} y={35} />
    <Label x={84} y={10} anchor="start" size={10} muted>
      C
    </Label>
    <Label x={84} y={66} anchor="start" size={10} muted>
      E
    </Label>
  </>
)
const Transformer = () => (
  <>
    <Inductor a={[50, 8]} b={[50, 62]} />
    <line x1="64" y1="10" x2="64" y2="60" />
    <line x1="72" y1="10" x2="72" y2="60" />
    <Inductor a={[86, 8]} b={[86, 62]} />
  </>
)
const Relay = () => (
  <>
    <rect x="22" y="22" width="34" height="26" className="fill-white dark:fill-night-900" />
    <path d="M22 48 L56 22" strokeWidth="1.5" />
    <line x1="56" y1="35" x2="78" y2="35" strokeDasharray="4 3" strokeWidth="1.5" />
    <Switch a={[84, 50]} b={[128, 50]} />
  </>
)
const Speaker = () => (
  <>
    <rect x="52" y="24" width="12" height="22" className="fill-white dark:fill-night-900" />
    <path d="M64 24 L82 10 L82 60 L64 46 Z" className="fill-white dark:fill-night-900" />
    <Wire points={[[30, 30], [52, 30]]} />
    <Wire points={[[30, 40], [52, 40]]} />
  </>
)
const Antenna = () => (
  <>
    <Wire points={[[70, 65], [70, 20]]} />
    <path d="M52 8 L70 26 L88 8 Z" fill="none" />
  </>
)
const ChassisGround = () => (
  <>
    <Wire points={[[70, 10], [70, 34]]} />
    <path d="M56 34 L84 34 M58 34 l-6 10 M70 34 l-6 10 M82 34 l-6 10" />
  </>
)
const SignalGround = () => (
  <>
    <Wire points={[[70, 10], [70, 34]]} />
    <path d="M56 34 L84 34 L70 50 Z" fill="none" />
  </>
)

const SYMBOLS = [
  { name: 'Résistance (IEC)', draw: <Resistor a={A} b={B} />, note: 'Rectangle : norme européenne IEC 60617.' },
  { name: 'Résistance (ANSI)', draw: <UsResistor />, note: 'Zigzag : schémas américains et japonais.' },
  { name: 'Résistance variable', draw: <VariableResistor a={A} b={B} />, note: 'Flèche oblique ; un potentiomètre a une flèche sur le côté (curseur).' },
  { name: 'Condensateur', draw: <Capacitor a={A} b={B} />, note: 'Céramique, film : non polarisé.' },
  { name: 'Condensateur polarisé', draw: <PolarCap />, note: 'Électrolytique, tantale : respecter le + (plaque droite).' },
  { name: 'Bobine (inductance)', draw: <Inductor a={A} b={B} />, note: 'IEC : rectangle plein ou demi-cercles ; avec noyau : traits parallèles.' },
  { name: 'Transformateur', draw: <Transformer />, note: 'Deux bobines couplées par un noyau (deux traits).' },
  { name: 'Diode', draw: <Diode a={A} b={B} />, note: 'Le courant passe dans le sens de la flèche ; le trait est la cathode (bague sur le boîtier).' },
  { name: 'Diode Zener', draw: <Zener a={A} b={B} />, note: 'Montée en inverse, elle fixe une tension.' },
  { name: 'LED', draw: <Led a={A} b={B} />, note: 'Flèches sortantes : la diode émet de la lumière.' },
  { name: 'Photodiode', draw: <Photodiode />, note: 'Flèches entrantes : la diode reçoit de la lumière.' },
  { name: 'Transistor NPN', draw: <NpnSym />, note: 'Flèche sur l’émetteur, vers l’extérieur.' },
  { name: 'Transistor PNP', draw: <Pnp />, note: 'Flèche sur l’émetteur, vers la base.' },
  { name: 'MOSFET canal N', draw: <Mosfet x={70} y={50} />, note: 'Grille isolée en haut ; flèche du substrat vers le canal.' },
  { name: 'Amplificateur opérationnel', draw: <OpAmp x={34} y={35} />, note: 'Entrées − et + à gauche, sortie à la pointe.' },
  { name: 'Tampon (porte OUI)', draw: <Buffer x={50} y={30} />, note: 'Un rond sur une entrée ou une sortie indique une inversion (ici OE actif à 0).' },
  { name: 'Source de tension continue', draw: <Source a={A} b={B} />, note: 'Cercle avec les signes + et − (variante IEC : cercle traversé par le conducteur).' },
  { name: 'Source alternative', draw: <Source ac a={A} b={B} />, note: 'Sinusoïde dans un cercle.' },
  { name: 'Pile, batterie', draw: <Battery a={A} b={B} />, note: 'Trait long = borne +, trait court = borne −.' },
  { name: 'Interrupteur', draw: <Switch a={A} b={B} />, note: 'Représenté ouvert (au repos).' },
  { name: 'Bouton-poussoir', draw: <PushButton />, note: 'Contact à fermeture, revient au repos quand on le lâche.' },
  { name: 'Relais', draw: <Relay />, note: 'Bobine (rectangle) et contact liés par un trait pointillé.' },
  { name: 'Fusible', draw: <Fuse />, note: 'Rectangle traversé par le conducteur.' },
  { name: 'Lampe', draw: <Lamp />, note: 'Cercle barré d’une croix.' },
  { name: 'Quartz', draw: <Crystal />, note: 'Résonateur entre deux électrodes.' },
  { name: 'Voltmètre', draw: <Meter letter="V" a={A} b={B} />, note: 'En parallèle sur ce qu’on mesure. A : ampèremètre, en série.' },
  { name: 'Moteur', draw: <Meter letter="M" a={A} b={B} />, note: 'M dans un cercle ; G pour un générateur.' },
  { name: 'Haut-parleur', draw: <Speaker />, note: 'Aimant et pavillon.' },
  { name: 'Antenne', draw: <Antenna />, note: '' },
  { name: 'Terre, masse', draw: <Ground at={[70, 14]} />, note: 'Trois traits décroissants : terre de protection ou masse commune.' },
  { name: 'Masse châssis', draw: <ChassisGround />, note: 'Reliée à la carcasse métallique.' },
  { name: 'Masse de signal', draw: <SignalGround />, note: 'Référence des signaux, distincte de la masse de puissance.' },
]

const SOURCES = [
  { label: 'Electronic symbol (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Electronic_symbol' },
  { label: 'IEC 60617 (base de données IEC)', url: 'https://std.iec.ch/iec60617' },
]

export default function Symbols() {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const list = SYMBOLS.filter((s) => !q || `${s.name} ${s.note}`.toLowerCase().includes(q))
  return (
    <div className="space-y-6">
      <RefSection id="symboles" title="Symboles des schémas" intro="Norme IEC 60617, en usage en France ; l’équivalent américain est indiqué quand il diffère.">
        <SearchField value={query} onChange={setQuery} placeholder="Symbole (diode, relais…)" />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {list.map((s) => (
            <li key={s.name} className="flex flex-col gap-2 rounded-xl border border-night-200 p-3 dark:border-night-800">
              <p className="text-sm font-medium text-night-900 dark:text-night-50">{s.name}</p>
              <div className="flex h-24 items-center rounded-lg bg-night-50 px-2 dark:bg-night-950">
                <Schematic width={W} height={H} label={s.name} maxWidth={200}>
                  {s.draw}
                </Schematic>
              </div>
              {s.note && <p className="text-xs text-night-600 dark:text-night-400">{s.note}</p>}
            </li>
          ))}
        </ul>
        {!list.length && <p className="text-sm text-night-500">Aucun symbole ne correspond.</p>}
      </RefSection>
      <Sources links={SOURCES} />
    </div>
  )
}

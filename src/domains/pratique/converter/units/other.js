import { LB, NA } from './constants'
import { si, u } from './helpers'

const C = 'Chimie'
const N = 'Informatique'
const V = 'Vie courante'

/** Octets : préfixes décimaux (ko, Mo…) et binaires (Kio, Mio…). */
const BYTES = [
  ['k', 'kilo', 1e3],
  ['M', 'méga', 1e6],
  ['G', 'giga', 1e9],
  ['T', 'téra', 1e12],
  ['P', 'péta', 1e15],
  ['E', 'exa', 1e18],
]
const BIN = [
  ['Ki', 'kibi', 2 ** 10],
  ['Mi', 'mébi', 2 ** 20],
  ['Gi', 'gibi', 2 ** 30],
  ['Ti', 'tébi', 2 ** 40],
  ['Pi', 'pébi', 2 ** 50],
  ['Ei', 'exbi', 2 ** 60],
]

export default [
  // --- Chimie ---
  {
    id: 'quantite-matiere',
    family: C,
    label: 'Quantité de matière',
    defaults: ['mol', 'mmol'],
    units: [...si('mol', 'mole', 'k _ m µ n p'), u('lbmol', 'livre-mole', 'lb-mol', LB * 1000), u('particules', 'nombre d’entités', 'entités', 1 / NA)],
  },
  {
    id: 'concentration-molaire',
    family: C,
    label: 'Concentration molaire',
    defaults: ['moll', 'mmoll'],
    units: [u('molm3', 'mole par mètre cube', 'mol/m³', 1), u('moll', 'mole par litre (molaire)', 'mol/L', 1000), u('mmoll', 'millimole par litre', 'mmol/L', 1), u('umoll', 'micromole par litre', 'µmol/L', 1e-3), u('nmoll', 'nanomole par litre', 'nmol/L', 1e-6), u('molml', 'mole par millilitre', 'mol/mL', 1e6)],
  },
  {
    id: 'concentration-massique',
    family: C,
    label: 'Concentration massique',
    defaults: ['gl', 'mgl'],
    units: [u('kgm3', 'kilogramme par mètre cube', 'kg/m³', 1), u('gl', 'gramme par litre', 'g/L', 1), u('mgl', 'milligramme par litre', 'mg/L', 1e-3), u('ugl', 'microgramme par litre', 'µg/L', 1e-6), u('mgdl', 'milligramme par décilitre', 'mg/dL', 1e-2), u('gdl', 'gramme par décilitre', 'g/dL', 10), u('ugm3', 'microgramme par mètre cube (air)', 'µg/m³', 1e-9), u('mgm3', 'milligramme par mètre cube', 'mg/m³', 1e-6)],
  },
  {
    id: 'masse-molaire',
    family: C,
    label: 'Masse molaire',
    defaults: ['gmol', 'kgmol'],
    units: [u('kgmol', 'kilogramme par mole', 'kg/mol', 1), u('gmol', 'gramme par mole', 'g/mol', 1e-3), u('da', 'dalton (par entité)', 'Da', 1e-3), u('kda', 'kilodalton', 'kDa', 1)],
  },
  {
    id: 'activite-catalytique',
    family: C,
    label: 'Activité catalytique',
    defaults: ['ukat', 'u'],
    units: [u('kat', 'katal', 'kat', 1), u('mkat', 'millikatal', 'mkat', 1e-3), u('ukat', 'microkatal', 'µkat', 1e-6), u('nkat', 'nanokatal', 'nkat', 1e-9), u('u', 'unité enzymatique', 'U', 1e-6 / 60)],
  },
  {
    id: 'proportion',
    family: C,
    label: 'Proportions (sans dimension)',
    defaults: ['pct', 'ppm'],
    units: [u('ratio', 'fraction (0 à 1)', '×', 1), u('pct', 'pourcentage', '%', 1e-2), u('permil', 'pour mille', '‰', 1e-3), u('pcm', 'pour cent mille', 'pcm', 1e-5), u('ppm', 'partie par million', 'ppm', 1e-6), u('ppb', 'partie par milliard', 'ppb', 1e-9), u('ppt', 'partie par billion', 'ppt', 1e-12)],
  },

  // --- Informatique ---
  {
    id: 'donnees',
    family: N,
    label: 'Données numériques',
    defaults: ['go', 'gio'],
    units: [
      u('bit', 'bit', 'bit', 1 / 8),
      u('o', 'octet', 'o', 1),
      ...BYTES.map(([p, name, f]) => u(`${p.toLowerCase()}o`, `${name}octet`, `${p}o`, f)),
      ...BIN.map(([p, name, f]) => u(`${p.toLowerCase()}o`, `${name}octet`, `${p}o`, f)),
      ...BYTES.slice(0, 4).map(([p, name, f]) => u(`${p.toLowerCase()}bit`, `${name}bit`, `${p}bit`, f / 8)),
      u('nibble', 'quartet (nibble)', 'nibble', 0.5),
      u('word', 'mot de 32 bits', 'mot32', 4),
      u('cd', 'CD (700 Mo)', 'CD', 700 * 2 ** 20),
      u('dvd', 'DVD simple couche', 'DVD', 4.7e9),
      u('bluray', 'Blu-ray simple couche', 'BD', 25e9),
    ],
  },
  {
    id: 'debit-donnees',
    family: N,
    label: 'Débit de données',
    defaults: ['mbps', 'mos'],
    units: [
      u('bps', 'bit par seconde', 'bit/s', 1),
      u('kbps', 'kilobit par seconde', 'kbit/s', 1e3),
      u('mbps', 'mégabit par seconde', 'Mbit/s', 1e6),
      u('gbps', 'gigabit par seconde', 'Gbit/s', 1e9),
      u('tbps', 'térabit par seconde', 'Tbit/s', 1e12),
      u('os', 'octet par seconde', 'o/s', 8),
      u('kos', 'kilooctet par seconde', 'ko/s', 8e3),
      u('mos', 'mégaoctet par seconde', 'Mo/s', 8e6),
      u('gos', 'gigaoctet par seconde', 'Go/s', 8e9),
      u('mios', 'mébioctet par seconde', 'Mio/s', 8 * 2 ** 20),
      u('goh', 'gigaoctet par heure', 'Go/h', 8e9 / 3600),
    ],
  },
  {
    id: 'typographie',
    family: V,
    label: 'Typographie et écrans',
    defaults: ['pt', 'mm'],
    units: [u('mm', 'millimètre', 'mm', 1e-3), u('cm', 'centimètre', 'cm', 1e-2), u('in', 'pouce', 'in', 0.0254), u('pt', 'point PostScript (1/72 in)', 'pt', 0.0254 / 72), u('pica', 'pica (12 pt)', 'pc', 0.0254 / 6), u('px96', 'pixel CSS (96 ppp)', 'px', 0.0254 / 96), u('px72', 'pixel à 72 ppp', 'px@72', 0.0254 / 72), u('px300', "pixel d'impression à 300 ppp", 'px@300', 0.0254 / 300), u('didot', 'point Didot', 'p. Didot', 0.376e-3), u('cicero', 'cicéro (12 points Didot)', 'cicéro', 12 * 0.376e-3)],
  },
]

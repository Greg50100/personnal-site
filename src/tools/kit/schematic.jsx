import { useLayoutEffect, useRef } from 'react'

/**
 * SCHÉMAS ÉLECTRIQUES
 * -------------------
 * Symboles SVG (norme IEC 60617 : résistance rectangulaire) à placer sur une grille en pixels.
 * Les dipôles se posent entre deux points a et b (horizontaux ou verticaux, ou en biais) : les fils sont tracés
 * jusqu'au corps du symbole, centré au milieu. Libellé et valeur se placent automatiquement à côté.
 *
 *   <Schematic width={320} height={200} label="Pont diviseur">
 *     <Wire points={[[20, 20], [100, 20]]} />
 *     <Resistor a={[100, 20]} b={[100, 100]} label="R1" value="10 kΩ" />
 *     <Ground at={[100, 180]} />
 *   </Schematic>
 */

const STROKE = 'stroke-night-700 dark:stroke-night-200'
const TEXT = 'fill-night-800 dark:fill-night-100'
const MUTED = 'fill-night-500 dark:fill-night-400'
const ACCENT_TEXT = 'fill-accent-700 dark:fill-accent-300'

const FIT_MARGIN = 4

/** Agrandit le cadre du SVG à la boîte englobante de son contenu (jamais en dessous du cadre prévu). */
function fitViewBox(svg, width, height, maxWidth) {
  const b = svg?.firstChild?.getBBox?.()
  if (!b?.width) return
  const x = Math.floor(Math.min(0, b.x - FIT_MARGIN))
  const y = Math.floor(Math.min(0, b.y - FIT_MARGIN))
  const w = Math.ceil(Math.max(width, b.x + b.width + FIT_MARGIN)) - x
  const h = Math.ceil(Math.max(height, b.y + b.height + FIT_MARGIN)) - y
  svg.setAttribute('viewBox', `${x} ${y} ${w} ${h}`)
  if (maxWidth == null) svg.style.maxWidth = `${w * 1.25}px`
}

/**
 * Cadre du schéma. Le cadre `width` × `height` s'élargit à la mesure si des étiquettes en débordent
 * (valeur saisie longue, police plus large que prévu) : rien n'est jamais coupé.
 */
export function Schematic({ width, height, label, children, maxWidth }) {
  const svg = useRef(null)

  // Remesure après chaque rendu, et quand une police finit de charger (la largeur des textes change).
  useLayoutEffect(() => {
    const fit = () => fitViewBox(svg.current, width, height, maxWidth)
    fit()
    const fonts = document.fonts
    fonts?.addEventListener?.('loadingdone', fit)
    return () => fonts?.removeEventListener?.('loadingdone', fit)
  })

  return (
    <svg ref={svg} viewBox={`0 0 ${width} ${height}`} className="mx-auto block h-auto w-full" style={{ maxWidth: maxWidth ?? width * 1.25 }} role="img" aria-label={label}>
      <g fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={STROKE}>
        {children}
      </g>
    </svg>
  )
}

/** Fil passant par une suite de points (className : couleur d'un bus, par exemple). */
export function Wire({ points, accent, dashed, className }) {
  return (
    <polyline
      points={points.map((p) => p.join(',')).join(' ')}
      className={className ?? (accent ? 'stroke-accent-500 dark:stroke-accent-400' : undefined)}
      strokeDasharray={dashed ? '5 4' : undefined}
    />
  )
}

/** Texte (jamais rempli par l'héritage « fill: none » du groupe). */
export function Label({ x, y, children, anchor = 'middle', size = 12, muted, accent, mono, weight }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      stroke="none"
      className={`${accent ? ACCENT_TEXT : muted ? MUTED : TEXT} ${mono ? 'font-mono' : ''} ${weight === 'bold' ? 'font-semibold' : ''}`}
      style={{ fontSize: size }}
    >
      {children}
    </text>
  )
}

/** Point de connexion. */
export function Dot({ at, accent }) {
  return <circle cx={at[0]} cy={at[1]} r="3.5" stroke="none" className={accent ? 'fill-accent-500 dark:fill-accent-400' : 'fill-night-700 dark:fill-night-200'} />
}

/** Borne (petit cercle ouvert) avec un nom. */
export function Terminal({ at, label, side = 'left', accent }) {
  const [x, y] = at
  const dx = side === 'left' ? -8 : side === 'right' ? 8 : 0
  const dy = side === 'top' ? -10 : side === 'bottom' ? 18 : 4
  return (
    <>
      <circle cx={x} cy={y} r="4" className="fill-white dark:fill-night-900" />
      {label && (
        <Label x={x + dx} y={y + dy} anchor={side === 'left' ? 'end' : side === 'right' ? 'start' : 'middle'} accent={accent} mono weight="bold">
          {label}
        </Label>
      )}
    </>
  )
}

/** Masse. */
export function Ground({ at }) {
  const [x, y] = at
  return (
    <g>
      <line x1={x} y1={y} x2={x} y2={y + 8} />
      <line x1={x - 12} y1={y + 8} x2={x + 12} y2={y + 8} />
      <line x1={x - 7} y1={y + 13} x2={x + 7} y2={y + 13} />
      <line x1={x - 2.5} y1={y + 18} x2={x + 2.5} y2={y + 18} />
    </g>
  )
}

/**
 * Dipôle entre a et b : fils jusqu'au corps de longueur `len`, corps dessiné horizontalement par `body`
 * (centré sur 0,0) puis tourné. Le libellé se place au-dessus (dipôle horizontal) ou à droite (vertical),
 * ou du côté demandé.
 */
function TwoTerminal({ a, b, len, body, label, value, side, gap = 14 }) {
  const [x1, y1] = a
  const [x2, y2] = b
  const L = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / L
  const uy = (y2 - y1) / L
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  const s = Math.min(len, L) / 2
  const vertical = Math.abs(uy) > Math.abs(ux)
  const where = side ?? (vertical ? 'right' : 'top')
  const off = { top: [0, -gap - 4], bottom: [0, gap + 12], right: [gap + 4, 4], left: [-gap - 4, 4] }[where]
  const anchor = where === 'right' ? 'start' : where === 'left' ? 'end' : 'middle'
  return (
    <g>
      <line x1={x1} y1={y1} x2={mx - ux * s} y2={my - uy * s} />
      <line x1={mx + ux * s} y1={my + uy * s} x2={x2} y2={y2} />
      <g transform={`translate(${mx} ${my}) rotate(${angle})`}>{typeof body === 'function' ? body(angle) : body}</g>
      {label && (
        <Label x={mx + off[0]} y={my + off[1] - (value && (where === 'right' || where === 'left') ? 7 : 0)} anchor={anchor} weight="bold">
          {label}
        </Label>
      )}
      {value && (
        <Label
          x={mx + off[0]}
          y={my + off[1] + (where === 'right' || where === 'left' ? 9 : where === 'top' ? -14 : 14)}
          anchor={anchor}
          muted
          mono
          size={11}
        >
          {value}
        </Label>
      )}
    </g>
  )
}

export function Resistor(props) {
  return <TwoTerminal len={36} body={<rect x="-18" y="-7" width="36" height="14" rx="1" className="fill-white dark:fill-night-900" />} {...props} />
}

/** Résistance variable (potentiomètre réglable) : rectangle barré d'une flèche. */
export function VariableResistor(props) {
  return (
    <TwoTerminal
      len={36}
      body={
        <g>
          <rect x="-18" y="-7" width="36" height="14" rx="1" className="fill-white dark:fill-night-900" />
          <line x1="-16" y1="12" x2="16" y2="-12" />
          <path d="M16 -12 l-7 1 m7 -1 l-2 7" />
        </g>
      }
      {...props}
    />
  )
}

export function Capacitor(props) {
  return (
    <TwoTerminal
      len={10}
      body={
        <g>
          <line x1="-5" y1="-13" x2="-5" y2="13" strokeWidth="2.5" />
          <line x1="5" y1="-13" x2="5" y2="13" strokeWidth="2.5" />
        </g>
      }
      {...props}
    />
  )
}

export function Inductor(props) {
  return <TwoTerminal len={40} body={<path d="M-20 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0 a5 5 0 0 1 10 0" />} {...props} />
}

function diodeBody(extra) {
  return (
    <g>
      <path d="M-9 -10 L9 0 L-9 10 Z" className="fill-white dark:fill-night-900" />
      {extra}
    </g>
  )
}

export function Diode(props) {
  return <TwoTerminal len={20} body={diodeBody(<line x1="9" y1="-10" x2="9" y2="10" />)} {...props} />
}

export function Zener(props) {
  return <TwoTerminal len={20} body={diodeBody(<path d="M5 -13 L9 -10 L9 10 L13 13" />)} {...props} />
}

export function Led(props) {
  return (
    <TwoTerminal
      len={20}
      body={diodeBody(
        <g>
          <line x1="9" y1="-10" x2="9" y2="10" />
          <path d="M2 -12 l8 -9 m0 0 l-6 1 m6 -1 l-1 6" strokeWidth="1.5" />
          <path d="M9 -8 l8 -9 m0 0 l-6 1 m6 -1 l-1 6" strokeWidth="1.5" />
        </g>,
      )}
      {...props}
    />
  )
}

/** Source de tension continue (cercle, + du côté de a) ou alternative (sinusoïde). */
export function Source({ ac, ...props }) {
  // Les signes + et − gardent leur orientation à l'écran quelle que soit celle du dipôle
  const sign = (cx, plus, angle) => (
    <g transform={`translate(${cx} 0) rotate(${-angle})`} strokeWidth="1.6">
      <line x1="-3.5" y1="0" x2="3.5" y2="0" />
      {plus && <line x1="0" y1="-3.5" x2="0" y2="3.5" />}
    </g>
  )
  return (
    <TwoTerminal
      len={30}
      body={(angle) => (
        <g>
          <circle r="15" className="fill-white dark:fill-night-900" />
          {ac ? (
            <path d="M-8 0 q4 -9 8 0 t8 0" transform={`rotate(${-angle})`} />
          ) : (
            <>
              {sign(-8, true, angle)}
              {sign(8, false, angle)}
            </>
          )}
        </g>
      )}
      {...props}
    />
  )
}

/** Pile ou batterie : trait long (+) du côté de a. */
export function Battery(props) {
  return (
    <TwoTerminal
      len={10}
      body={
        <g>
          <line x1="-5" y1="-14" x2="-5" y2="14" />
          <line x1="5" y1="-7" x2="5" y2="7" strokeWidth="3.5" />
        </g>
      }
      {...props}
    />
  )
}

/** Interrupteur ouvert. */
export function Switch(props) {
  return (
    <TwoTerminal
      len={30}
      body={
        <g>
          <circle cx="-14" cy="0" r="2.5" />
          <circle cx="14" cy="0" r="2.5" />
          <line x1="-12" y1="-1" x2="12" y2="-13" />
        </g>
      }
      {...props}
    />
  )
}

/** Appareil de mesure (V, A, G…). */
export function Meter({ letter, ...props }) {
  return (
    <TwoTerminal
      len={28}
      body={
        <g>
          <circle r="14" className="fill-white dark:fill-night-900" />
          <text x="0" y="5" textAnchor="middle" stroke="none" className={`${TEXT} font-semibold`} style={{ fontSize: 13 }}>
            {letter}
          </text>
        </g>
      }
      {...props}
    />
  )
}

/** Charge générique (rectangle), par exemple un appareil alimenté. */
export function Load(props) {
  return <TwoTerminal len={40} body={<rect x="-20" y="-11" width="40" height="22" rx="3" className="fill-night-100 dark:fill-night-800" />} {...props} />
}

/**
 * Amplificateur opérationnel : sommet à droite. Entrées à (x, y ∓ 15), sortie à (x + 70, y).
 * plusOnTop : entrée non inverseuse en haut.
 */
export function OpAmp({ x, y, plusOnTop }) {
  const top = plusOnTop ? '+' : '−'
  const bottom = plusOnTop ? '−' : '+'
  return (
    <g>
      <path d={`M${x + 8} ${y - 34} L${x + 8} ${y + 34} L${x + 62} ${y} Z`} className="fill-white dark:fill-night-900" />
      <line x1={x} y1={y - 15} x2={x + 8} y2={y - 15} />
      <line x1={x} y1={y + 15} x2={x + 8} y2={y + 15} />
      <line x1={x + 62} y1={y} x2={x + 70} y2={y} />
      <Label x={x + 17} y={y - 10} size={15}>
        {top}
      </Label>
      <Label x={x + 17} y={y + 20} size={15}>
        {bottom}
      </Label>
    </g>
  )
}

/** Transistor NPN : base à (x, y), collecteur en haut (x + 26, y − 30), émetteur en bas (x + 26, y + 30). */
export function Npn({ x, y, label }) {
  return (
    <g>
      <circle cx={x + 18} cy={y} r="20" className="fill-white dark:fill-night-900" />
      <line x1={x} y1={y} x2={x + 12} y2={y} />
      <line x1={x + 12} y1={y - 12} x2={x + 12} y2={y + 12} strokeWidth="3" />
      <path d={`M${x + 12} ${y - 6} L${x + 26} ${y - 16} L${x + 26} ${y - 30}`} />
      <path d={`M${x + 12} ${y + 6} L${x + 26} ${y + 16} L${x + 26} ${y + 30}`} />
      <path d={`M${x + 26} ${y + 16} l-8 -1 m8 1 l-4 -7`} />
      {label && (
        <Label x={x + 44} y={y + 4} anchor="start" weight="bold">
          {label}
        </Label>
      )}
    </g>
  )
}

/**
 * MOSFET canal N à enrichissement, canal horizontal : source à gauche (x − 28, y), drain à droite (x + 28, y),
 * grille en haut (x, y − 34). Le substrat est relié à la source.
 */
export function Mosfet({ x, y, label }) {
  return (
    <g>
      <line x1={x - 28} y1={y} x2={x} y2={y} />
      <line x1={x + 12} y1={y} x2={x + 28} y2={y} />
      <path d={`M${x - 12} ${y} L${x - 12} ${y - 11} M${x + 12} ${y} L${x + 12} ${y - 11}`} />
      <path d={`M${x} ${y} L${x} ${y - 10} M${x - 4} ${y - 5} L${x} ${y - 10} L${x + 4} ${y - 5}`} strokeWidth="1.75" />
      <path d={`M${x - 17} ${y - 11} L${x - 7} ${y - 11} M${x - 4} ${y - 11} L${x + 4} ${y - 11} M${x + 7} ${y - 11} L${x + 17} ${y - 11}`} strokeWidth="3" />
      <line x1={x - 17} y1={y - 20} x2={x + 17} y2={y - 20} strokeWidth="2.5" />
      <line x1={x} y1={y - 20} x2={x} y2={y - 34} />
      {label && (
        <Label x={x + 21} y={y - 22} anchor="start" weight="bold" size={11}>
          {label}
        </Label>
      )}
    </g>
  )
}

/**
 * Tampon (porte non inverseuse) avec validation active à l'état bas : entrée (x − 12, y), sortie (x + 42, y),
 * validation OE en bas (x + 12, y + 28).
 */
export function Buffer({ x, y, label }) {
  return (
    <g>
      <line x1={x - 12} y1={y} x2={x} y2={y} />
      <path d={`M${x} ${y - 17} L${x} ${y + 17} L${x + 30} ${y} Z`} className="fill-white dark:fill-night-900" />
      <line x1={x + 30} y1={y} x2={x + 42} y2={y} />
      <circle cx={x + 12} cy={y + 13} r="3" className="fill-white dark:fill-night-900" />
      <line x1={x + 12} y1={y + 16} x2={x + 12} y2={y + 28} />
      {label && (
        <Label x={x + 12} y={y - 24} weight="bold" size={11}>
          {label}
        </Label>
      )}
    </g>
  )
}

/** Boîtier (circuit intégré, module, carte) avec des broches nommées à gauche et à droite. */
export function Box({ x, y, w, h, title, left = [], right = [], top = [], bottom = [], pitch = 22 }) {
  const pins = {}
  const place = (list, side) =>
    list.map((name, i) => {
      if (!name) return null
      const along = (side === 'left' || side === 'right' ? h : w) / (list.length + 1)
      const px = side === 'left' ? x : side === 'right' ? x + w : x + along * (i + 1)
      const py = side === 'top' ? y : side === 'bottom' ? y + h : y + (list.length > 1 && pitch ? (h - pitch * (list.length - 1)) / 2 + pitch * i : along * (i + 1))
      pins[name] = [px, py]
      const tx = side === 'left' ? px + 6 : side === 'right' ? px - 6 : px
      const ty = side === 'top' ? py + 14 : side === 'bottom' ? py - 6 : py + 4
      return (
        <Label key={`${side}${name}`} x={tx} y={ty} anchor={side === 'left' ? 'start' : side === 'right' ? 'end' : 'middle'} size={10.5} mono>
          {name}
        </Label>
      )
    })
  return {
    pins,
    node: (
      <g>
        <rect x={x} y={y} width={w} height={h} rx="6" className="fill-night-50 dark:fill-night-800" />
        {title && (
          <Label x={x + w / 2} y={y - 8} weight="bold">
            {title}
          </Label>
        )}
        {place(left, 'left')}
        {place(right, 'right')}
        {place(top, 'top')}
        {place(bottom, 'bottom')}
      </g>
    ),
  }
}

/** Flèche de tension (de b vers a) avec son nom, le long d'un dipôle vertical. */
export function VoltageArrow({ x, y1, y2, label }) {
  return (
    <g className="stroke-accent-500 dark:stroke-accent-400">
      <line x1={x} y1={y2} x2={x} y2={y1 + 4} strokeWidth="1.5" />
      <path d={`M${x - 4} ${y1 + 10} L${x} ${y1 + 2} L${x + 4} ${y1 + 10}`} strokeWidth="1.5" />
      <Label x={x + 6} y={(y1 + y2) / 2 + 4} anchor="start" accent weight="bold">
        {label}
      </Label>
    </g>
  )
}

/** Flèche de courant sur un fil horizontal ou vertical. */
export function CurrentArrow({ at, dir = 'right', label }) {
  const [x, y] = at
  const d = { right: `M${x - 5} ${y - 5} L${x + 3} ${y} L${x - 5} ${y + 5}`, left: `M${x + 5} ${y - 5} L${x - 3} ${y} L${x + 5} ${y + 5}`, down: `M${x - 5} ${y - 5} L${x} ${y + 3} L${x + 5} ${y - 5}`, up: `M${x - 5} ${y + 5} L${x} ${y - 3} L${x + 5} ${y + 5}` }[dir]
  return (
    <g className="stroke-accent-500 dark:stroke-accent-400">
      <path d={d} strokeWidth="2" />
      {label && (
        <Label x={dir === 'down' || dir === 'up' ? x + 9 : x} y={dir === 'down' || dir === 'up' ? y + 4 : y - 9} anchor={dir === 'down' || dir === 'up' ? 'start' : 'middle'} accent weight="bold">
          {label}
        </Label>
      )}
    </g>
  )
}

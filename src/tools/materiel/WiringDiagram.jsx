import { Link } from 'react-router-dom'
import { Dot, Ground, Label, Schematic } from '../kit/schematic'
import { WIRE_STROKE } from './colors'

/**
 * SCHÉMA DE CÂBLAGE D'UN MODULE
 * -----------------------------
 * La carte à gauche, le module à droite, un fil par ligne de data/wiring.js. Les composants intercalés
 * (résistance de tirage, pont diviseur, tampon) se dessinent sur le fil, avec leur valeur.
 */

const BOX = 104
const GAP = 156
const MX = BOX + GAP
const PITCH = 26
const ABOVE = 34
const BELOW = 46

function ResBody({ x, y, vertical }) {
  return vertical ? (
    <rect x={x - 4.5} y={y - 11} width="9" height="22" rx="1" strokeWidth="1.5" className="fill-white dark:fill-night-900" />
  ) : (
    <rect x={x - 12} y={y - 4.5} width="24" height="9" rx="1" strokeWidth="1.5" className="fill-white dark:fill-night-900" />
  )
}

function Chevron({ x, y, dir, className }) {
  const d = dir === '>' ? `M${x - 3} ${y - 4} L${x + 2} ${y} L${x - 3} ${y + 4}` : `M${x + 3} ${y - 4} L${x - 2} ${y} L${x + 3} ${y + 4}`
  return <path d={d} strokeWidth="1.75" className={className} />
}

/** Composants intercalés sur un fil horizontal à la hauteur y. */
function Inline({ y, via }) {
  const parts = []
  const series = via.series && (via.chip ? 236 : via.pulldown ? 160 : 204)
  if (via.chip) {
    parts.push(
      <g key="chip">
        <rect x="132" y={y - 10} width="76" height="20" rx="3" strokeWidth="1.5" className="fill-white dark:fill-night-900" />
        <Label x={170} y={y + 3.5} size={9.5} mono>
          {via.chip}
        </Label>
      </g>,
    )
  }
  if (series) {
    parts.push(
      <g key="series">
        <ResBody x={series} y={y} />
        <Label x={series} y={y - 9} size={9.5} muted mono>
          {via.series}
        </Label>
      </g>,
    )
  }
  const down = via.pulldown ?? via.divider?.[1]
  if (down) {
    const jx = via.divider ? 172 : series ? 214 : 182
    parts.push(
      <g key="down">
        <Dot at={[jx, y]} />
        <line x1={jx} y1={y} x2={jx} y2={y + 30} strokeWidth="1.5" />
        <ResBody x={jx} y={y + 16} vertical />
        <Ground at={[jx, y + 30]} />
        <Label x={jx + 9} y={y + 20} anchor="start" size={9.5} muted mono>
          {down}
        </Label>
      </g>,
    )
  }
  if (via.divider) {
    parts.push(
      <g key="divider">
        <ResBody x={220} y={y} />
        <Label x={220} y={y - 9} size={9.5} muted mono>
          {via.divider[0]}
        </Label>
      </g>,
    )
  }
  if (via.pullup) {
    const jx = 182
    parts.push(
      <g key="up">
        <Dot at={[jx, y]} />
        <line x1={jx} y1={y} x2={jx} y2={y - 28} strokeWidth="1.5" />
        <ResBody x={jx} y={y - 14} vertical />
        <line x1={jx - 10} y1={y - 28} x2={jx + 10} y2={y - 28} strokeWidth="1.5" className={WIRE_STROKE.pwr} />
        <Label x={jx - 13} y={y - 24} anchor="end" size={9.5} weight="bold">
          3,3 V
        </Label>
        <Label x={jx + 9} y={y - 10} anchor="start" size={9.5} muted mono>
          {via.pullup}
        </Label>
      </g>,
    )
  }
  return parts
}

/** Hauteur de chaque fil : place en plus au-dessus (tirage) ou en dessous (vers la masse). */
function layout(rows) {
  const placed = []
  let cursor = 34
  for (const [board, module, signal, dir, via = {}] of rows) {
    cursor += (via.pullup ? ABOVE : 0) + PITCH / 2
    placed.push({ board, module, signal, dir, via: via ?? {}, y: cursor })
    cursor += PITCH / 2 + (via?.pulldown || via?.divider ? BELOW : 0)
  }
  return { placed, bottom: cursor }
}

export default function WiringDiagram({ wiring }) {
  const { title, rows, notes } = wiring
  const { placed, bottom } = layout(rows)
  const H = bottom + 8
  const optional = placed.some((r) => r.via.opt)
  const summary = placed.map((r) => `${r.board} → ${r.module}`).join(', ')

  return (
    <figure className="space-y-2">
      <figcaption className="label">Câblage type</figcaption>
      <Schematic width={MX + BOX} height={H + 4} maxWidth={440} label={`Câblage de ${title} sur une carte en 3,3 V : ${summary}`}>
        <Label x={BOX / 2} y={16} weight="bold">
          Carte 3,3 V
        </Label>
        <Label x={MX + BOX / 2} y={16} weight="bold">
          {title}
        </Label>
        <rect x="0" y="24" width={BOX} height={H - 24} rx="6" strokeWidth="1.5" className="fill-night-50 dark:fill-night-800/60" />
        <rect x={MX} y="24" width={BOX} height={H - 24} rx="6" strokeWidth="1.5" className="fill-night-50 dark:fill-night-800/60" />
        {placed.map((r, i) => {
          const stroke = WIRE_STROKE[r.signal] ?? WIRE_STROKE.gpio
          return (
            <g key={i}>
              <line x1={BOX} y1={r.y} x2={MX} y2={r.y} strokeWidth="2.25" strokeDasharray={r.via.opt ? '5 4' : undefined} className={stroke} />
              {(r.dir === '>' || r.dir === '<') && <Chevron x={118} y={r.y} dir={r.dir} className={stroke} />}
              <Inline y={r.y} via={r.via} />
              <circle cx={BOX} cy={r.y} r="3" strokeWidth="1.5" className={`fill-white dark:fill-night-900 ${stroke}`} />
              <circle cx={MX} cy={r.y} r="3" strokeWidth="1.5" className={`fill-white dark:fill-night-900 ${stroke}`} />
              <Label x={BOX - 8} y={r.y + 4} anchor="end" size={10.5} mono>
                {r.board}
              </Label>
              <Label x={MX + 8} y={r.y + 4} anchor="start" size={10.5} mono>
                {r.module}
              </Label>
            </g>
          )
        })}
      </Schematic>
      <p className="text-xs text-night-500">
        Sur une carte en 3,3 V (ESP32, Pico, Raspberry Pi){optional ? ' ; en pointillés, les fils facultatifs' : ''}. Broches exactes :{' '}
        <Link to="/materiel/brochages" className="text-accent-700 underline dark:text-accent-300">
          brochages des cartes
        </Link>
        .
      </p>
      {notes.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-night-700 dark:text-night-300">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      )}
    </figure>
  )
}

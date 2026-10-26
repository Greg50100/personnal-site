import { KIND_STYLE } from './kinds'

/**
 * VUE DE FACE D'UN CONNECTEUR
 * ---------------------------
 * Dessine les contacts d'après `connector.view` (rangées de numéros, décalages en quinconce, forme du boîtier).
 * Chaque contact est teinté selon sa nature ; le survol ou le focus clavier désigne la broche (prop onPick).
 */

/** Nom court sous un contact : la première variante (« SCL / SIG1 » → « SCL »), 7 caractères au plus. */
function shortName(signal) {
  const first = signal.split(' / ')[0]
  return first.length > 7 ? `${first.slice(0, 6)}…` : first
}

function Contact({ x, y, pin, label, w, h, round, active, onPick, nameY }) {
  const k = KIND_STYLE[pin?.kind] ?? KIND_STYLE.nc
  const pick = () => onPick(pin?.n ?? label)
  return (
    <g
      tabIndex={0}
      role="button"
      aria-label={pin ? `Broche ${pin.n} : ${pin.signal}, ${pin.role}` : `Broche ${label}`}
      onMouseEnter={pick}
      onFocus={pick}
      onClick={pick}
      className="cursor-pointer outline-none"
    >
      {active && (round ? <circle cx={x} cy={y} r={w / 2 + 5} className="fill-accent-400/25" /> : <rect x={x - w / 2 - 4} y={y - h / 2 - 4} width={w + 8} height={h + 8} rx="5" className="fill-accent-400/25" />)}
      {/* Fond opaque sous la teinte : le numéro reste lisible quel que soit le boîtier */}
      {round ? <circle cx={x} cy={y} r={w / 2} className="fill-white dark:fill-night-900" /> : <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="2.5" className="fill-white dark:fill-night-900" />}
      {round ? (
        <circle cx={x} cy={y} r={w / 2} className={`${k.fill} ${k.stroke}`} fillOpacity="0.22" strokeWidth="1.75" strokeDasharray={k.dashed ? '3 2' : undefined} />
      ) : (
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx="2.5" className={`${k.fill} ${k.stroke}`} fillOpacity="0.22" strokeWidth="1.75" strokeDasharray={k.dashed ? '3 2' : undefined} />
      )}
      <text x={x} y={y + 3.5} textAnchor="middle" className="fill-night-900 font-mono text-[10px] font-semibold dark:fill-night-50">
        {label}
      </text>
      {nameY != null && pin && (
        <text x={x} y={nameY} textAnchor="middle" className="fill-night-600 font-mono text-[8.5px] dark:fill-night-300">
          {shortName(pin.signal)}
        </text>
      )}
    </g>
  )
}

/** Rangées de contacts : positions et contour. */
function Grid({ connector, view, active, onPick }) {
  const byN = Object.fromEntries(connector.pins.map((x) => [String(x.n), x]))
  const dense = Math.max(...view.rows.map((r) => r.length)) > 9
  const P = view.shape === 'stadium' ? 30 : dense ? 30 : 36
  const round = view.contact === 'pin'
  const w = round ? 22 : view.shape === 'stadium' ? 20 : 22
  const h = round ? 22 : view.shape === 'rj45' ? 34 : 26
  const offsets = view.offsets ?? view.rows.map(() => 0)
  const n = Math.max(...view.rows.map((r, i) => r.length + offsets[i]))
  const rowGap = view.shape === 'rj45' ? 0 : view.shape === 'stadium' ? 44 : round ? 34 : 40
  const names = view.shape !== 'dsub' && !dense
  const twoRows = view.rows.length > 1
  const padX = 40
  const top = 40
  const W = padX * 2 + n * P
  const H = top * 2 + (view.rows.length - 1) * rowGap + h + (view.shape === 'rj45' ? 80 : view.shape === 'rect' ? 12 : 0)
  const x = (r, i) => padX + P / 2 + (offsets[r] + i) * P
  const y = (r) => top + h / 2 + r * rowGap

  // Contour du boîtier
  const xs = view.rows.map((row, r) => [x(r, 0), x(r, row.length - 1)])
  const minX = Math.min(...xs.map((a) => a[0])) - w / 2 - 14
  const maxX = Math.max(...xs.map((a) => a[1])) + w / 2 + 14
  const y0 = top - 16
  const y1 = y(view.rows.length - 1) + h / 2 + 16
  let shell = null
  if (view.shape === 'dsub') {
    const inset = P / 2
    shell = (
      <path
        d={`M${minX} ${y0} L${maxX} ${y0} L${maxX - inset} ${y1} L${minX + inset} ${y1} Z`}
        strokeLinejoin="round"
        className="fill-night-100 stroke-night-400 dark:fill-night-800 dark:stroke-night-500"
        strokeWidth="2"
      />
    )
  } else if (view.shape === 'stadium') {
    const r = (y1 - y0) / 2
    shell = (
      <>
        <rect x={minX - 8} y={y0} width={maxX - minX + 16} height={y1 - y0} rx={r} className="fill-night-100 stroke-night-400 dark:fill-night-800 dark:stroke-night-500" strokeWidth="2" />
        <rect x={minX + 6} y={(y0 + y1) / 2 - 4} width={maxX - minX - 12} height="8" rx="3" className="fill-night-300 dark:fill-night-600" />
      </>
    )
  } else if (view.shape === 'rj45') {
    shell = (
      <>
        <rect x={minX} y={y0 - 6} width={maxX - minX} height={y1 - y0 + 70} rx="6" className="fill-night-100 stroke-night-400 dark:fill-night-800 dark:stroke-night-500" strokeWidth="2" />
        <rect x={(minX + maxX) / 2 - 22} y={y1 + 70} width="44" height="26" className="fill-night-300 dark:fill-night-600" />
        <rect x={(minX + maxX) / 2 - 40} y={y1 + 10} width="80" height="44" rx="4" strokeDasharray="5 4" className="fill-transparent stroke-night-400" strokeWidth="1.5" />
        <text x={(minX + maxX) / 2} y={y1 + 36} textAnchor="middle" className="fill-night-500 text-[10px]">
          ergot (dessous)
        </text>
      </>
    )
  } else if (view.shape === 'header') {
    shell = <rect x={minX + 4} y={y0 + 2} width={maxX - minX - 8} height={y1 - y0 - 4} rx="4" className="fill-night-800 stroke-night-900 dark:fill-night-950 dark:stroke-night-700" strokeWidth="2" />
  } else {
    shell = (
      <>
        <rect x={minX} y={y0 - 10} width={maxX - minX} height={y1 - y0 + 20} rx="5" className="fill-night-100 stroke-night-400 dark:fill-night-800 dark:stroke-night-500" strokeWidth="2" />
        <rect x={minX + 10} y={y0 + 2} width={maxX - minX - 20} height={y1 - y0 - 4} rx="3" className="fill-night-200 dark:fill-night-700" />
      </>
    )
  }
  const header = view.shape === 'header'

  return (
    <svg viewBox={`0 0 ${W} ${H + (names ? 10 : 0)}`} className="mx-auto block h-auto w-full" style={{ maxWidth: W * 1.3 }} role="img" aria-label={`Vue de face : ${connector.name}`}>
      {shell}
      {view.rows.map((row, r) =>
        row.map((label, i) => {
          const pin = byN[String(label)]
          const first = header && view.square && String(label) === '1'
          return (
            <g key={`${r}-${label}`}>
              {header && <rect x={x(r, i) - w / 2 - 3} y={y(r) - h / 2 - 3} width={w + 6} height={h + 6} rx={first ? 1 : 12} className={first ? 'fill-amber-300/30 stroke-amber-500' : 'fill-transparent stroke-transparent'} strokeWidth="1.5" />}
              <Contact
                x={x(r, i)}
                y={y(r)}
                pin={pin}
                label={label}
                w={w}
                h={h}
                round={round}
                active={pin && String(active) === String(pin.n)}
                onPick={onPick}
                nameY={!names ? null : view.shape === 'rj45' ? y0 - 14 : r === 0 && twoRows ? y0 - 6 : y1 + (view.shape === 'rect' ? 24 : 14)}
              />
            </g>
          )
        }),
      )}
    </svg>
  )
}

/** Corps (manchon) long, bagues et pointe plus courtes, isolants entre eux ; du corps (à gauche) à la pointe. */
function jackLayout(segments) {
  const gap = 8
  const parts = []
  let cursor = 30
  for (const s of [...segments].reverse()) {
    const w = s === 'S' ? 150 : s === 'T' ? 46 : 40
    parts.push({ s, x: cursor, w })
    cursor += w + gap
  }
  return { parts, W: cursor + 30, gap }
}

/** Fiche jack vue de profil, contacts nommés. */
function Jack({ connector, view, active, onPick }) {
  const byN = Object.fromEntries(connector.pins.map((x) => [x.n, x]))
  const { parts, W, gap } = jackLayout(view.segments)
  return (
    <svg viewBox={`0 0 ${W} 150`} className="mx-auto block h-auto w-full max-w-xl" role="img" aria-label={`Fiche ${connector.name} vue de profil`}>
      {parts.map((part, i) => {
        const pin = byN[part.s]
        const k = KIND_STYLE[pin?.kind] ?? KIND_STYLE.nc
        const tip = part.s === 'T'
        const yTop = 45
        const hgt = 34
        const pick = () => onPick(part.s)
        return (
          <g key={part.s} tabIndex={0} role="button" aria-label={`${part.s} : ${pin?.signal}`} onMouseEnter={pick} onFocus={pick} onClick={pick} className="cursor-pointer outline-none">
            {String(active) === part.s && <rect x={part.x - 4} y={yTop - 6} width={part.w + 8} height={hgt + 12} rx="6" className="fill-accent-400/25" />}
            {tip ? (
              <path d={`M${part.x} ${yTop} L${part.x + part.w - 16} ${yTop} Q${part.x + part.w} ${yTop + hgt / 2} ${part.x + part.w - 16} ${yTop + hgt} L${part.x} ${yTop + hgt} Z`} className={`${k.fill} ${k.stroke}`} fillOpacity="0.25" strokeWidth="2" />
            ) : (
              <rect x={part.x} y={yTop} width={part.w} height={hgt} rx="2" className={`${k.fill} ${k.stroke}`} fillOpacity="0.25" strokeWidth="2" />
            )}
            {i < parts.length - 1 && <rect x={part.x + part.w} y={yTop + 3} width={gap} height={hgt - 6} className="fill-night-800 dark:fill-night-300" />}
            <text x={part.x + part.w / 2} y={yTop + hgt / 2 + 4} textAnchor="middle" className="fill-night-900 font-mono text-[12px] font-bold dark:fill-night-50">
              {part.s}
            </text>
            <text x={part.x + part.w / 2} y={yTop + hgt + 22} textAnchor="middle" className="fill-night-700 text-[11px] dark:fill-night-200">
              {pin?.signal}
            </text>
          </g>
        )
      })}
      <rect x="4" y="38" width="26" height="48" rx="4" className="fill-night-300 dark:fill-night-600" />
      <text x={W / 2} y="22" textAnchor="middle" className="fill-night-500 text-[10px]">
        corps (S) · bagues (R) · pointe (T)
      </text>
    </svg>
  )
}

/** Symbole de polarité « centre positif ». */
function Barrel() {
  return (
    <svg viewBox="0 0 260 90" className="mx-auto block h-auto w-full max-w-sm" role="img" aria-label="Symbole de polarité : centre positif, manchon négatif">
      <g className="stroke-night-700 dark:stroke-night-200" strokeWidth="2.5" fill="none">
        <circle cx="40" cy="45" r="16" />
        <line x1="32" y1="45" x2="48" y2="45" />
        <line x1="56" y1="45" x2="96" y2="45" />
        <path d="M118 25 A 22 22 0 1 0 118 65" />
        <line x1="130" y1="45" x2="198" y2="45" />
        <circle cx="220" cy="45" r="16" />
        <line x1="212" y1="45" x2="228" y2="45" />
        <line x1="220" y1="37" x2="220" y2="53" />
      </g>
      <circle cx="130" cy="45" r="6" className="fill-night-700 dark:fill-night-200" />
      <text x="40" y="82" textAnchor="middle" className="fill-night-600 text-[10px] dark:fill-night-300">
        manchon −
      </text>
      <text x="220" y="82" textAnchor="middle" className="fill-night-600 text-[10px] dark:fill-night-300">
        centre +
      </text>
    </svg>
  )
}

export default function ConnectorFace({ connector, active, onPick }) {
  const view = connector.view
  if (!view) return null
  const body =
    view.shape === 'jack' ? (
      <Jack connector={connector} view={view} active={active} onPick={onPick} />
    ) : view.shape === 'barrel' ? (
      <Barrel />
    ) : (
      <Grid connector={connector} view={view} active={active} onPick={onPick} />
    )
  return (
    <figure className="space-y-2">
      <div className="overflow-x-auto rounded-xl bg-night-50 p-3 dark:bg-night-950">{body}</div>
      <figcaption className="text-center text-xs text-night-500">{view.caption}</figcaption>
    </figure>
  )
}


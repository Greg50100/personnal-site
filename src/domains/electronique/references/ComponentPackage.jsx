import { KIND_STYLE } from './kinds'

/**
 * DESSIN DU BOÎTIER D'UN COMPOSANT
 * --------------------------------
 * TO-92, TO-126, TO-220 vus de face, SOT-23 et SOT-223 vus de dessus, DIP vu de dessus (encoche en haut).
 * Chaque broche porte son numéro et son nom ; le survol ou le focus clavier la désigne (onPick).
 */

const BODY = 'fill-night-700 stroke-night-900 dark:fill-night-600 dark:stroke-night-400'
const METAL = 'fill-night-300 stroke-night-500 dark:fill-night-400 dark:stroke-night-300'
const INK = 'fill-night-900 dark:fill-night-50'

function Pick({ pin, active, onPick, children }) {
  const [n, name, role] = pin
  const pick = () => onPick(n)
  return (
    <g tabIndex={0} role="button" aria-label={`Broche ${n} : ${name}, ${role}`} onMouseEnter={pick} onFocus={pick} onClick={pick} className="cursor-pointer outline-none" opacity={active != null && active !== n ? 0.55 : 1}>
      {children}
    </g>
  )
}

const tint = (kind) => KIND_STYLE[kind] ?? KIND_STYLE.nc

/** « broche 2 (OUT) » : la broche reliée à la languette métallique. */
const tabLabel = (c) => `broche ${c.tab} (${c.pins.find((p) => p[0] === c.tab)?.[1] ?? '?'})`

/** Numéro dans une pastille teintée selon la nature de la broche. */
function Badge({ x, y, pin, active }) {
  const k = tint(pin[3])
  return (
    <g>
      {active && <circle cx={x} cy={y} r="15" className="fill-accent-400/30" />}
      <circle cx={x} cy={y} r="11" className="fill-white dark:fill-night-900" />
      <circle cx={x} cy={y} r="11" className={`${k.fill} ${k.stroke}`} fillOpacity="0.22" strokeWidth="1.75" strokeDasharray={k.dashed ? '3 2' : undefined} />
      <text x={x} y={y + 3.5} textAnchor="middle" className={`${INK} font-mono text-[10px] font-semibold`}>
        {pin[0]}
      </text>
    </g>
  )
}

/** Boîtiers à trois pattes vus de face (TO-92, TO-126, TO-220). */
function ThroughHole({ component, active, onPick }) {
  const pkg = component.package
  const W = 300
  const cx = W / 2
  const pins = component.pins
  const bodyTop = pkg === 'TO-220' ? 70 : 24
  const bodyH = pkg === 'TO-92' ? 74 : 84
  const bodyW = pkg === 'TO-92' ? 92 : 108
  const pitch = pkg === 'TO-92' ? 22 : 30
  const legTop = bodyTop + bodyH
  const spread = 84
  const footY = legTop + 70
  const H = footY + 52
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-sm" role="img" aria-label={`Boîtier ${pkg} vu de face`}>
      {pkg === 'TO-220' && (
        <g>
          <rect x={cx - bodyW / 2 - 4} y="22" width={bodyW + 8} height="56" rx="3" className={METAL} strokeWidth="1.5" />
          <circle cx={cx} cy="44" r="11" className="fill-night-50 stroke-night-500 dark:fill-night-950" strokeWidth="1.5" />
          {component.tab && (
            <text x={cx} y="14" textAnchor="middle" className="fill-night-600 text-[10px] dark:fill-night-300">
              languette = {tabLabel(component)}
            </text>
          )}
        </g>
      )}
      {pkg === 'TO-92' ? (
        <path d={`M${cx - bodyW / 2} ${legTop} L${cx - bodyW / 2} ${bodyTop + 22} Q${cx - bodyW / 2} ${bodyTop} ${cx - bodyW / 2 + 22} ${bodyTop} L${cx + bodyW / 2 - 22} ${bodyTop} Q${cx + bodyW / 2} ${bodyTop} ${cx + bodyW / 2} ${bodyTop + 22} L${cx + bodyW / 2} ${legTop} Z`} className={BODY} strokeWidth="1.5" />
      ) : (
        <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} rx="3" className={BODY} strokeWidth="1.5" />
      )}
      {pkg === 'TO-126' && <circle cx={cx} cy={bodyTop + 22} r="9" className="fill-night-50 stroke-night-500 dark:fill-night-950" strokeWidth="1.5" />}
      <text x={cx} y={legTop - 14} textAnchor="middle" className="fill-night-100 font-mono text-[11px] font-semibold">
        {component.name.split(' ')[0]}
      </text>
      {pins.map((p, i) => {
        const x0 = cx + (i - 1) * pitch
        const x1 = cx + (i - 1) * spread
        return (
          <Pick key={p[0]} pin={p} active={active} onPick={onPick}>
            <path d={`M${x0} ${legTop} L${x0} ${legTop + 14} L${x1} ${legTop + 44} L${x1} ${footY - 12}`} fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-night-400 dark:stroke-night-300" />
            <Badge x={x1} y={footY} pin={p} active={active === p[0]} />
            <text x={x1} y={footY + 30} textAnchor="middle" className={`${INK} font-mono text-[12px] font-bold`}>
              {p[1]}
            </text>
          </Pick>
        )
      })}
    </svg>
  )
}

/** Boîtiers CMS à trois broches vus de dessus (SOT-23, SOT-223). */
function Smd({ component, active, onPick }) {
  const big = component.package === 'SOT-223'
  const W = 300
  const cx = W / 2
  const bodyW = big ? 130 : 90
  const bodyH = big ? 70 : 54
  const top = 70
  const pins = component.pins
  const pos = big ? [cx - 44, cx, cx + 44] : [cx - 28, cx + 28, cx]
  const padW = big ? 20 : 18
  const H = top + bodyH + (big ? 110 : 100)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-sm" role="img" aria-label={`Boîtier ${component.package} vu de dessus`}>
      {big && (
        <g>
          <rect x={cx - 52} y={top - 34} width="104" height="34" rx="2" className={METAL} strokeWidth="1.5" />
          {component.tab && (
            <text x={cx} y={top - 42} textAnchor="middle" className="fill-night-600 text-[10px] dark:fill-night-300">
              languette = {tabLabel(component)}
            </text>
          )}
        </g>
      )}
      <rect x={cx - bodyW / 2} y={top} width={bodyW} height={bodyH} rx="4" className={BODY} strokeWidth="1.5" />
      <circle cx={cx - bodyW / 2 + 12} cy={top + bodyH - 12} r="4" className="fill-night-300" />
      {pins.map((p, i) => {
        const up = !big && i === 2
        const x = pos[i]
        const y0 = up ? top - 22 : top + bodyH
        const by = up ? top - 46 : top + bodyH + 44
        return (
          <Pick key={p[0]} pin={p} active={active} onPick={onPick}>
            <rect x={x - padW / 2} y={y0} width={padW} height="22" rx="2" className={METAL} strokeWidth="1.5" />
            <Badge x={x} y={by} pin={p} active={active === p[0]} />
            <text x={big ? x : x + 16} y={big ? by + 28 : by + 4} textAnchor={big ? 'middle' : 'start'} className={`${INK} font-mono text-[12px] font-bold`}>
              {p[1].split(' ')[0]}
            </text>
          </Pick>
        )
      })}
    </svg>
  )
}

/** Boîtier DIP vu de dessus : broche 1 en haut à gauche, sens inverse des aiguilles d'une montre. */
function Dip({ component, active, onPick }) {
  const pins = component.pins
  const half = pins.length / 2
  const pitch = 28
  const bodyW = 110
  const labelW = 120
  const W = labelW * 2 + bodyW + 60
  const bx = labelW + 30
  const top = 24
  const bodyH = half * pitch + 16
  const H = top + bodyH + 24
  const y = (i) => top + 8 + pitch / 2 + i * pitch
  const side = (p) => {
    const n = p[0]
    return n <= half ? { left: true, i: n - 1 } : { left: false, i: pins.length - n }
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-md" role="img" aria-label={`Boîtier ${component.package} vu de dessus`}>
      <rect x={bx} y={top} width={bodyW} height={bodyH} rx="5" className={BODY} strokeWidth="1.5" />
      <path d={`M${bx + bodyW / 2 - 12} ${top} A 12 12 0 0 0 ${bx + bodyW / 2 + 12} ${top}`} className="fill-night-50 stroke-night-900 dark:fill-night-950 dark:stroke-night-400" strokeWidth="1.5" />
      <circle cx={bx + 14} cy={top + 16} r="4" className="fill-night-300" />
      <text x={bx + bodyW / 2} y={top + bodyH / 2 + 4} textAnchor="middle" transform={`rotate(-90 ${bx + bodyW / 2} ${top + bodyH / 2})`} className="fill-night-100 font-mono text-[11px] font-semibold">
        {component.name.split(' ')[0]}
      </text>
      {pins.map((p) => {
        const { left, i } = side(p)
        const py = y(i)
        const legX = left ? bx - 14 : bx + bodyW
        const bxl = left ? bx - 30 : bx + bodyW + 30
        const k = tint(p[3])
        return (
          <Pick key={p[0]} pin={p} active={active} onPick={onPick}>
            <rect x={legX} y={py - 5} width="14" height="10" rx="1.5" className={METAL} strokeWidth="1" />
            <rect x={left ? bx - 2 : bx + bodyW - 4} y={py - 3} width="6" height="6" className={k.fill} />
            <Badge x={bxl} y={py} pin={p} active={active === p[0]} />
            <text x={left ? bxl - 16 : bxl + 16} y={py + 4} textAnchor={left ? 'end' : 'start'} className={`${INK} font-mono text-[11px] font-semibold`}>
              {p[1]}
            </text>
          </Pick>
        )
      })}
    </svg>
  )
}

export default function ComponentPackage({ component, caption, active, onPick }) {
  const pkg = component.package
  const body = pkg.startsWith('DIP') ? (
    <Dip component={component} active={active} onPick={onPick} />
  ) : pkg.startsWith('SOT') ? (
    <Smd component={component} active={active} onPick={onPick} />
  ) : (
    <ThroughHole component={component} active={active} onPick={onPick} />
  )
  return (
    <figure className="space-y-2">
      <div className="overflow-x-auto rounded-xl bg-night-50 p-3 dark:bg-night-950">{body}</div>
      <figcaption className="text-center text-xs text-night-500">
        {pkg} · {caption}
      </figcaption>
    </figure>
  )
}

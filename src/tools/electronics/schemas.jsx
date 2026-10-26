import { formatSI, parseSI } from '../../lib/si'
import { Battery, Box, Capacitor, CurrentArrow, Dot, Ground, Inductor, Label, Led, Load, Meter, Npn, OpAmp, Resistor, Schematic, Source, Switch, Terminal, VoltageArrow, Wire, Zener } from '../kit/schematic'
import { npnPins, opAmpPins } from '../kit/schematicPins'

/**
 * SCHÉMAS DES CALCULATEURS D'ÉLECTRONIQUE
 * ---------------------------------------
 * Chaque schéma reçoit les valeurs saisies (`values`, déjà converties) et affiche les composants avec leur valeur.
 * Déclaré dans une spec par `schematic: ZenerSchema`, affiché par le kit Calculator.
 */

const q = (v, unit, digits = 3) => (Number.isFinite(v) ? formatSI(v, unit, digits) : '?')

/** Régulateur Zener : source, Rs, diode Zener et charge. */
export function ZenerSchema({ values: v }) {
  return (
    <Schematic width={290} height={180} label="Schéma du régulateur Zener">
      <Source a={[30, 40]} b={[30, 140]} label="Vin" value={q(v.vin, 'V')} side="left" />
      <Wire points={[[30, 40], [55, 40]]} />
      <Resistor a={[55, 40]} b={[125, 40]} label="Rs" />
      <Wire points={[[125, 40], [205, 40]]} />
      <Dot at={[125, 40]} />
      <Zener a={[125, 140]} b={[125, 40]} label="Dz" value={q(v.vz, 'V')} />
      <Resistor a={[205, 40]} b={[205, 140]} label="RL" value={q(v.rl, 'Ω')} />
      <Wire points={[[30, 140], [205, 140]]} />
      <Dot at={[125, 140]} />
      <Ground at={[30, 140]} />
      <VoltageArrow x={268} y1={44} y2={136} label="Vz" />
    </Schematic>
  )
}

/** Pont de Wheatstone : R1/R2 à gauche, R3/Rx à droite, galvanomètre entre les points milieux. */
export function WheatstoneSchema({ values: v }) {
  const val = (id) => (v.unknown === id ? 'à calculer' : q(v[id], 'Ω'))
  return (
    <Schematic width={280} height={230} label="Schéma du pont de Wheatstone">
      <Battery a={[30, 40]} b={[30, 200]} label="E" side="left" />
      <Wire points={[[30, 40], [210, 40]]} />
      <Wire points={[[30, 200], [210, 200]]} />
      <Dot at={[90, 40]} />
      <Dot at={[90, 200]} />
      <Resistor a={[90, 40]} b={[90, 120]} label="R1" value={val('r1')} side="left" />
      <Resistor a={[90, 120]} b={[90, 200]} label="R2" value={val('r2')} side="left" />
      <Resistor a={[210, 40]} b={[210, 120]} label="R3" value={val('r3')} />
      <Resistor a={[210, 120]} b={[210, 200]} label="Rx" value={val('rx')} />
      <Meter a={[90, 120]} b={[210, 120]} letter="G" />
      <Dot at={[90, 120]} />
      <Dot at={[210, 120]} />
    </Schematic>
  )
}

/** Conversion triangle-étoile : les deux réseaux entre les bornes A, B et C. */
export function TriangleEtoileSchema({ values: v }) {
  const d2y = v.dir !== 'y2d'
  const A = [30, 40]
  const B = [130, 40]
  const C = [80, 140]
  const sA = [170, 40]
  const sB = [270, 40]
  const sC = [220, 140]
  const centre = [220, 80]
  return (
    <Schematic width={300} height={175} label="Schéma triangle et étoile">
      <Label x={80} y={170} muted size={11}>
        Triangle{d2y ? ' (connu)' : ''}
      </Label>
      <Resistor a={A} b={B} label="Rab" value={d2y ? q(v.a, 'Ω') : null} />
      <Resistor a={B} b={C} label="Rbc" side="right" value={d2y ? q(v.b, 'Ω') : null} />
      <Resistor a={C} b={A} label="Rca" side="left" value={d2y ? q(v.c, 'Ω') : null} />
      <Label x={220} y={170} muted size={11}>
        Étoile{d2y ? '' : ' (connue)'}
      </Label>
      <Resistor a={sA} b={centre} label="R1" side="left" value={d2y ? null : q(v.a, 'Ω')} />
      <Resistor a={sB} b={centre} label="R2" side="right" value={d2y ? null : q(v.b, 'Ω')} />
      <Resistor a={sC} b={centre} label="R3" value={d2y ? null : q(v.c, 'Ω')} />
      <Dot at={centre} />
      {[
        [A, 'A', 'left'],
        [B, 'B', 'right'],
        [C, 'C', 'bottom'],
        [sA, 'A', 'left'],
        [sB, 'B', 'right'],
        [sC, 'C', 'bottom'],
      ].map(([p, n, side], i) => (
        <Terminal key={i} at={p} label={n} side={side} />
      ))}
    </Schematic>
  )
}

/** Montages de l'amplificateur opérationnel. */
export function AmpliOpSchema({ values: v }) {
  const c = v.config
  const x = 120
  const y = 110
  const p = opAmpPins(x, y)
  const out = p.out
  return (
    <Schematic width={290} height={c === 'diff' ? 230 : 200} label="Schéma de l’amplificateur opérationnel">
      <OpAmp x={x} y={y} />
      <Wire points={[out, [260, out[1]]]} />
      <Dot at={[215, out[1]]} />
      <Terminal at={[260, out[1]]} label="Vout" side="bottom" accent />
      {c === 'follower' ? (
        <>
          <Wire points={[[215, out[1]], [215, 55], [100, 55], [100, p.top[1]], p.top]} />
          <Terminal at={[30, p.bottom[1]]} label="Vin" side="left" />
          <Wire points={[[30, p.bottom[1]], p.bottom]} />
        </>
      ) : (
        <>
          {/* Contre-réaction Rf entre l'entrée inverseuse et la sortie */}
          <Wire points={[[100, p.top[1]], p.top]} />
          <Dot at={[100, p.top[1]]} />
          <Wire points={[[100, p.top[1]], [100, 50]]} />
          <Resistor a={[100, 50]} b={[215, 50]} label="Rf" value={q(v.rf, 'Ω')} />
          <Wire points={[[215, 50], [215, out[1]]]} />
          {c === 'inv' && (
            <>
              <Terminal at={[20, p.top[1]]} label="Vin" side="top" />
              <Resistor a={[20, p.top[1]]} b={[100, p.top[1]]} label="R1" side="bottom" value={q(v.r1, 'Ω')} />
              <Wire points={[p.bottom, [105, p.bottom[1]], [105, 160]]} />
              <Ground at={[105, 160]} />
            </>
          )}
          {c === 'noninv' && (
            <>
              <Resistor a={[100, p.top[1]]} b={[100, 175]} label="R1" side="left" value={q(v.r1, 'Ω')} />
              <Ground at={[100, 175]} />
              <Terminal at={[20, p.bottom[1]]} label="Vin" side="top" />
              <Wire points={[[20, p.bottom[1]], [85, p.bottom[1]], [85, p.bottom[1]], p.bottom]} />
            </>
          )}
          {c === 'diff' && (
            <>
              <Terminal at={[20, p.top[1]]} label="V1" side="top" />
              <Resistor a={[20, p.top[1]]} b={[100, p.top[1]]} label="R1" side="bottom" value={q(v.r1, 'Ω')} />
              <Terminal at={[20, 170]} label="V2" side="top" />
              <Resistor a={[20, 170]} b={[95, 170]} label="R1" side="bottom" />
              <Wire points={[[95, 170], [108, 170], [108, p.bottom[1]], p.bottom]} />
              <Dot at={[108, 170]} />
              <Resistor a={[108, 170]} b={[108, 220]} label="Rf" side="right" />
              <Ground at={[108, 220]} />
            </>
          )}
        </>
      )}
    </Schematic>
  )
}

/** Filtre passif du premier ordre (RC, RL) ou LC : élément série et élément en dérivation. */
export function FiltreSchema({ values: v }) {
  const type = v.type ?? 'rc'
  const low = v.pass !== 'high'
  const parts = {
    rc: low ? ['R', 'C'] : ['C', 'R'],
    rl: low ? ['L', 'R'] : ['R', 'L'],
    lc: low ? ['L', 'C'] : ['C', 'L'],
  }[type]
  const comp = (kind, a, b, side) => {
    const props = { a, b, side, label: kind, value: q(v[kind.toLowerCase()], { R: 'Ω', C: 'F', L: 'H' }[kind]) }
    return kind === 'R' ? <Resistor {...props} /> : kind === 'C' ? <Capacitor {...props} /> : <Inductor {...props} />
  }
  return (
    <Schematic width={280} height={160} label={`Schéma du filtre ${low ? 'passe-bas' : 'passe-haut'}`}>
      <Terminal at={[20, 40]} label="Ve" side="top" />
      <Terminal at={[20, 130]} />
      {comp(parts[0], [20, 40], [150, 40])}
      <Dot at={[150, 40]} />
      <Wire points={[[150, 40], [255, 40]]} />
      {comp(parts[1], [150, 40], [150, 130], 'right')}
      <Wire points={[[20, 130], [255, 130]]} />
      <Dot at={[150, 130]} />
      <Terminal at={[255, 40]} label="Vs" side="top" accent />
      <Terminal at={[255, 130]} />
      <Ground at={[200, 130]} />
    </Schematic>
  )
}

/** Charge d'un circuit RC (ou établissement du courant dans un RL). */
export function ConstanteTempsSchema({ values: v }) {
  const rc = v.type !== 'rl'
  return (
    <Schematic width={280} height={170} label={`Schéma du circuit ${rc ? 'RC' : 'RL'}`}>
      <Source a={[30, 40]} b={[30, 140]} label="U" value={q(v.u, 'V')} side="left" />
      <Switch a={[30, 40]} b={[90, 40]} label="K" />
      <Resistor a={[90, 40]} b={[180, 40]} label="R" value={q(v.r, 'Ω')} />
      <Wire points={[[180, 40], [220, 40]]} />
      {rc ? <Capacitor a={[220, 40]} b={[220, 140]} label="C" value={q(v.c, 'F')} /> : <Inductor a={[220, 40]} b={[220, 140]} label="L" value={q(v.l, 'H')} />}
      <Wire points={[[30, 140], [220, 140]]} />
      <Ground at={[30, 140]} />
      <CurrentArrow at={[202, 40]} label="i" />
    </Schematic>
  )
}

/** Polarisation d'un transistor NPN par pont diviseur, résistances de collecteur et d'émetteur. */
export function BjtSchema({ values: v }) {
  const t = npnPins(110, 120)
  return (
    <Schematic width={280} height={230} label="Schéma de polarisation du transistor">
      <Label x={100} y={14} weight="bold">
        Vcc = {q(v.vcc, 'V')}
      </Label>
      <Wire points={[[60, 24], [t.collector[0], 24]]} />
      <Resistor a={[60, 24]} b={[60, 120]} label="R1" value={q(v.r1, 'Ω')} side="left" />
      <Resistor a={[60, 120]} b={[60, 205]} label="R2" value={q(v.r2, 'Ω')} side="left" />
      <Wire points={[[60, 120], t.base]} />
      <Dot at={[60, 120]} />
      <Npn x={110} y={120} />
      <Wire points={[[t.collector[0], 24], [t.collector[0], 40]]} />
      <Resistor a={[t.collector[0], 40]} b={t.collector} label="RC" value={q(v.rc, 'Ω')} />
      <Resistor a={t.emitter} b={[t.emitter[0], 205]} label="RE" value={q(v.re, 'Ω')} />
      <Wire points={[[60, 205], [t.emitter[0], 205]]} />
      <Ground at={[100, 205]} />
      <Wire points={[t.collector, [205, t.collector[1]]]} />
      <Terminal at={[205, t.collector[1]]} label="Vc" side="right" accent />
    </Schematic>
  )
}

/** Circuit RLC série (avec source alternative) ou parallèle. */
export function RlcSchema({ values: v }) {
  if (v.mode === 'parallel') {
    return (
      <Schematic width={280} height={160} label="Schéma du circuit RLC parallèle">
        <Source ac a={[30, 30]} b={[30, 130]} label="u" value={Number.isFinite(v.f) ? q(v.f, 'Hz') : null} side="left" />
        <Wire points={[[30, 30], [240, 30]]} />
        <Wire points={[[30, 130], [240, 130]]} />
        <Resistor a={[110, 30]} b={[110, 130]} label="R" value={q(v.r, 'Ω')} />
        <Inductor a={[175, 30]} b={[175, 130]} label="L" value={q(v.l, 'H')} />
        <Capacitor a={[240, 30]} b={[240, 130]} label="C" value={q(v.c, 'F')} side="left" />
        {[110, 175].map((x) => (
          <g key={x}>
            <Dot at={[x, 30]} />
            <Dot at={[x, 130]} />
          </g>
        ))}
      </Schematic>
    )
  }
  return (
    <Schematic width={290} height={160} label="Schéma du circuit RLC série">
      <Source ac a={[30, 40]} b={[30, 130]} label="u" value={Number.isFinite(v.f) ? q(v.f, 'Hz') : null} side="left" />
      <Resistor a={[30, 40]} b={[110, 40]} label="R" value={q(v.r, 'Ω')} />
      <Inductor a={[110, 40]} b={[190, 40]} label="L" value={q(v.l, 'H')} />
      <Wire points={[[190, 40], [250, 40]]} />
      <Capacitor a={[250, 40]} b={[250, 130]} label="C" value={q(v.c, 'F')} side="left" />
      <Wire points={[[30, 130], [250, 130]]} />
      <CurrentArrow at={[220, 40]} label="i" />
    </Schematic>
  )
}

/** Transformateur : primaire et secondaire couplés par un noyau. */
export function TransformateurSchema({ values: v }) {
  return (
    <Schematic width={310} height={170} label="Schéma du transformateur">
      <Source ac a={[30, 40]} b={[30, 140]} label="Vp" value={q(v.vp, 'V')} side="left" />
      <Wire points={[[30, 40], [140, 40]]} />
      <Wire points={[[30, 140], [140, 140]]} />
      <Inductor a={[140, 40]} b={[140, 140]} label="Np" value={Number.isFinite(v.np) ? `${Math.round(v.np)} sp.` : null} side="left" gap={16} />
      <line x1="158" y1="45" x2="158" y2="135" />
      <line x1="166" y1="45" x2="166" y2="135" />
      <Inductor a={[184, 40]} b={[184, 140]} label="Ns" value={Number.isFinite(v.ns) ? `${Math.round(v.ns)} sp.` : null} side="right" gap={16} />
      <Wire points={[[184, 40], [270, 40]]} />
      <Wire points={[[184, 140], [270, 140]]} />
      <Load a={[270, 40]} b={[270, 140]} />
      <VoltageArrow x={294} y1={44} y2={136} label="Vs" />
    </Schematic>
  )
}

/** Associations série et parallèle d'une liste de composants (quatre au plus dessinés). */
export function SerieParalleleSchema({ values: v }) {
  const kind = v.kind ?? 'r'
  const parts = String(v.list ?? '')
    .split(/[\s;]+/)
    .filter(Boolean)
  const shown = parts.slice(0, 4)
  const more = parts.length - shown.length
  const unit = { r: 'Ω', c: 'F', l: 'H' }[kind]
  const letter = { r: 'R', c: 'C', l: 'L' }[kind]
  const Comp = { r: Resistor, c: Capacitor, l: Inductor }[kind]
  const valueOf = (p) => q(parseSI(p), unit, 3)
  const n = Math.max(shown.length, 1)
  const step = 220 / n
  return (
    <Schematic width={280} height={250} label="Schémas en série et en parallèle">
      <Label x={20} y={18} anchor="start" muted size={11}>
        En série
      </Label>
      <Terminal at={[20, 60]} />
      <Terminal at={[260, 60]} />
      {shown.map((p, i) => (
        <Comp key={`s${i}`} a={[30 + step * i, 60]} b={[30 + step * (i + 1), 60]} label={`${letter}${i + 1}`} value={valueOf(p)} />
      ))}
      <Wire points={[[20, 60], [30, 60]]} />
      <Wire points={[[30 + step * n, 60], [260, 60]]} />
      <Label x={20} y={118} anchor="start" muted size={11}>
        En parallèle
      </Label>
      <Terminal at={[20, 140]} />
      <Terminal at={[20, 225]} />
      <Wire points={[[20, 140], [40 + 55 * (n - 1), 140]]} />
      <Wire points={[[20, 225], [40 + 55 * (n - 1), 225]]} />
      {shown.map((p, i) => (
        <Comp key={`p${i}`} a={[40 + 55 * i, 140]} b={[40 + 55 * i, 225]} label={`${letter}${i + 1}`} side="right" gap={kind === 'c' ? 14 : 10} />
      ))}
      {more > 0 && (
        <Label x={260} y={190} anchor="end" muted size={11}>
          + {more} autre{more > 1 ? 's' : ''}
        </Label>
      )}
    </Schematic>
  )
}

/** Ligne d'alimentation : source, conducteurs (aller et retour) et charge. */
export function CableSchema({ values: v }) {
  const two = v.circuit !== '1'
  return (
    <Schematic width={290} height={170} label="Schéma de la ligne d’alimentation">
      <Source a={[30, 40]} b={[30, 140]} label="U" value={q(v.u, 'V')} side="left" />
      <Resistor a={[30, 40]} b={[200, 40]} label="R du conducteur" value={Number.isFinite(v.len) ? `${q(v.len, 'm')} de câble` : null} />
      {two ? (
        <Resistor a={[200, 140]} b={[30, 140]} label="R du retour" side="bottom" />
      ) : (
        <Wire points={[[30, 140], [200, 140]]} />
      )}
      <Wire points={[[200, 40], [240, 40]]} />
      <Wire points={[[200, 140], [240, 140]]} />
      <Load a={[240, 40]} b={[240, 140]} />
      <CurrentArrow at={[220, 40]} label={Number.isFinite(v.i) ? q(v.i, 'A') : 'I'} />
      <VoltageArrow x={270} y1={44} y2={136} label="U − ΔU" />
    </Schematic>
  )
}

/** Réactance d'un condensateur ou d'une inductance en alternatif. */
export function ReactanceSchema({ values: v }) {
  const c = v.type !== 'l'
  return (
    <Schematic width={240} height={160} label={`Schéma de la réactance ${c ? 'capacitive' : 'inductive'}`}>
      <Source ac a={[40, 40]} b={[40, 130]} label="u" value={q(v.f, 'Hz')} side="left" />
      <Wire points={[[40, 40], [170, 40]]} />
      <Wire points={[[40, 130], [170, 130]]} />
      {c ? <Capacitor a={[170, 40]} b={[170, 130]} label="C" value={q(v.c, 'F')} /> : <Inductor a={[170, 40]} b={[170, 130]} label="L" value={q(v.l, 'H')} />}
      <CurrentArrow at={[110, 40]} label="i" />
    </Schematic>
  )
}

/** Bobine à air monocouche : vue de profil avec ses cotes. */
export function BobineSchema({ values: v }) {
  const turns = Math.max(3, Math.min(14, Math.round(v.n) || 8))
  const x0 = 50
  const x1 = 230
  const pitch = (x1 - x0) / turns
  const path = Array.from({ length: turns }, (_, i) => {
    const x = x0 + i * pitch
    return `M${x} 110 C${x + pitch * 0.2} 60 ${x + pitch * 0.8} 60 ${x + pitch} 110`
  }).join(' ')
  const back = Array.from({ length: turns }, (_, i) => {
    const x = x0 + i * pitch
    return `M${x} 110 C${x + pitch * 0.2} 160 ${x + pitch * 0.8} 160 ${x + pitch} 110`
  }).join(' ')
  return (
    <Schematic width={280} height={210} label="Schéma de la bobine">
      <path d={back} strokeDasharray="3 3" className="stroke-night-400" />
      <path d={path} className="stroke-accent-600 dark:stroke-accent-400" />
      <Wire points={[[20, 110], [x0, 110]]} />
      <Wire points={[[x1, 110], [x1 + 10, 110]]} />
      {/* Longueur */}
      <Wire points={[[x0, 175], [x1, 175]]} />
      <path d={`M${x0 + 8} 170 L${x0} 175 L${x0 + 8} 180 M${x1 - 8} 170 L${x1} 175 L${x1 - 8} 180`} />
      <Label x={(x0 + x1) / 2} y={196} muted size={11}>
        longueur {q(v.len, 'm')}
      </Label>
      {/* Diamètre */}
      <Wire points={[[x1 + 26, 70], [x1 + 26, 150]]} />
      <path d={`M${x1 + 21} 78 L${x1 + 26} 70 L${x1 + 31} 78 M${x1 + 21} 142 L${x1 + 26} 150 L${x1 + 31} 142`} />
      <Label x={x1 + 34} y={114} anchor="start" muted size={11}>
        ⌀ {q(v.d, 'm')}
      </Label>
      <Label x={(x0 + x1) / 2} y={44} weight="bold">
        N = {Number.isFinite(v.n) ? Math.round(v.n) : '?'} spires
      </Label>
    </Schematic>
  )
}

/** Résistance de limitation d'une ou plusieurs LED en série. */
export function LedSchema({ supply, count = 1, resistor, current }) {
  const n = Math.max(1, Math.min(4, count))
  const y = 40
  const x0 = 160
  return (
    <Schematic width={290} height={170 + (n > 2 ? 40 : 0)} label="Schéma de la LED et de sa résistance">
      <Source a={[30, y]} b={[30, 140 + (n > 2 ? 40 : 0)]} label="Vs" value={supply} side="left" />
      <Resistor a={[30, y]} b={[x0 - 20, y]} label="R" value={resistor} />
      <Wire points={[[x0 - 20, y], [240, y]]} />
      {Array.from({ length: n }, (_, i) => {
        const y1 = y + i * (n > 2 ? 35 : 50)
        const y2 = y1 + (n > 2 ? 35 : 50)
        return <Led key={i} a={[240, y1]} b={[240, y2]} label={n > 1 ? `D${i + 1}` : 'LED'} />
      })}
      <Wire points={[[240, y + n * (n > 2 ? 35 : 50)], [240, 140 + (n > 2 ? 40 : 0)], [30, 140 + (n > 2 ? 40 : 0)]]} />
      <Ground at={[30, 140 + (n > 2 ? 40 : 0)]} />
      {current && <CurrentArrow at={[180, y]} label={current} />}
    </Schematic>
  )
}

/** Loi d'Ohm : source, résistance, courant et tension. */
export function OhmSchema({ u, i, r }) {
  return (
    <Schematic width={240} height={170} label="Schéma de la loi d’Ohm">
      <Source a={[40, 40]} b={[40, 140]} label="U" value={u} side="left" />
      <Wire points={[[40, 40], [170, 40]]} />
      <Resistor a={[170, 40]} b={[170, 140]} label="R" value={r} side="left" />
      <Wire points={[[40, 140], [170, 140]]} />
      <CurrentArrow at={[110, 40]} label={i ? `I = ${i}` : 'I'} />
      <VoltageArrow x={198} y1={44} y2={136} label="U" />
    </Schematic>
  )
}

/** NE555 en astable ou en monostable (brochage du boîtier DIP-8). */
export function Ne555Schema({ mode, r1, r2, c }) {
  const box = Box({ x: 110, y: 40, w: 90, h: 150, title: 'NE555', left: ['7 DIS', '6 THR', '2 TRIG'], right: ['8 VCC', '4 RST', '3 OUT', '5 CV'], bottom: ['1 GND'] })
  const P = box.pins
  const astable = mode !== 'monostable'
  return (
    <Schematic width={300} height={260} label={`Schéma du NE555 en ${astable ? 'astable' : 'monostable'}`}>
      <Label x={40} y={14} weight="bold">
        +Vcc
      </Label>
      <Wire points={[[40, 22], [250, 22]]} />
      {box.node}
      {/* VCC et RESET au +, sortie, CV par 10 nF */}
      <Wire points={[[250, 22], [250, P['8 VCC'][1]], P['8 VCC']]} />
      <Wire points={[[250, P['8 VCC'][1]], [250, P['4 RST'][1]], P['4 RST']]} />
      <Dot at={[250, P['8 VCC'][1]]} />
      <Wire points={[P['3 OUT'], [285, P['3 OUT'][1]]]} />
      <Terminal at={[285, P['3 OUT'][1]]} label="OUT" side="top" accent />
      <Capacitor a={P['5 CV']} b={[240, P['5 CV'][1]]} />
      <Wire points={[[240, P['5 CV'][1]], [240, 235]]} />
      <Label x={234} y={P['5 CV'][1] + 24} anchor="end" muted size={10}>
        10 nF
      </Label>
      <Wire points={[P['1 GND'], [P['1 GND'][0], 235]]} />
      <Wire points={[[40, 235], [240, 235]]} />
      <Ground at={[150, 235]} />
      {astable ? (
        <>
          <Resistor a={[40, 22]} b={[40, P['7 DIS'][1]]} label="R1" value={r1} side="left" />
          <Wire points={[[40, P['7 DIS'][1]], P['7 DIS']]} />
          <Dot at={[40, P['7 DIS'][1]]} />
          <Resistor a={[40, P['7 DIS'][1]]} b={[40, P['6 THR'][1] + 20]} label="R2" value={r2} side="left" />
          <Wire points={[[40, P['6 THR'][1] + 20], [80, P['6 THR'][1] + 20], [80, P['6 THR'][1]], P['6 THR']]} />
          <Wire points={[[80, P['6 THR'][1]], [80, P['2 TRIG'][1]], P['2 TRIG']]} />
          <Dot at={[80, P['6 THR'][1]]} />
          <Dot at={[80, P['2 TRIG'][1]]} />
          <Capacitor a={[80, P['2 TRIG'][1]]} b={[80, 235]} label="C" value={c} side="left" />
        </>
      ) : (
        <>
          <Resistor a={[60, 22]} b={[60, P['7 DIS'][1]]} label="R" value={r1} side="left" />
          <Wire points={[[60, P['7 DIS'][1]], P['7 DIS']]} />
          <Wire points={[[60, P['7 DIS'][1]], [60, P['6 THR'][1]], P['6 THR']]} />
          <Dot at={[60, P['7 DIS'][1]]} />
          <Dot at={[60, P['6 THR'][1]]} />
          <Capacitor a={[60, P['6 THR'][1]]} b={[60, 235]} label="C" value={c} side="left" />
          <Terminal at={[90, P['2 TRIG'][1] + 0]} />
          <Wire points={[[90, P['2 TRIG'][1]], P['2 TRIG']]} />
          <Label x={86} y={P['2 TRIG'][1] + 20} anchor="end" muted size={10}>
            déclenchement ↓
          </Label>
        </>
      )}
    </Schematic>
  )
}

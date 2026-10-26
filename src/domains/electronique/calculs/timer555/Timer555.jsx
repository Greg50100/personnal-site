import { useState } from 'react'
import Segmented from '../../../../components/Segmented'
import { fmt } from '../../../../lib/format'
import { nearestInSeries } from '../resistor/colors'
import { formatSI, parseSI } from '../../../../lib/si'
import { Result, SIField } from '../../../../kit/fields'
import { astable, designAstable, monostable } from './timer555'
import { Ne555Schema } from '../schemas'

/** Chronogramme du signal de sortie (2 périodes en astable, une impulsion en monostable). */
function Waveform({ duty: rawDuty }) {
  const duty = rawDuty == null ? null : Math.min(0.95, Math.max(0.05, rawDuty))
  const W = 320
  const H = 90
  const hi = 18
  const lo = 72
  let d
  if (duty == null) {
    d = `M0,${lo} L60,${lo} L60,${hi} L220,${hi} L220,${lo} L${W},${lo}`
  } else {
    const p = (W - 20) / 2
    const x = (k) => 10 + k * p
    d = `M0,${lo} L10,${lo} L10,${hi} L${x(duty)},${hi} L${x(duty)},${lo} L${x(1)},${lo} L${x(1)},${hi} L${x(1 + duty)},${hi} L${x(1 + duty)},${lo} L${W},${lo}`
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Chronogramme de la sortie">
      <line x1="0" x2={W} y1={lo} y2={lo} className="stroke-night-300 dark:stroke-night-700" strokeDasharray="3 3" />
      <path d={d} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinejoin="round" />
      {duty != null && (
        <>
          <text x={10 + (duty * (W - 20)) / 4} y={hi - 5} textAnchor="middle" className="fill-night-500 font-mono text-[10px]">
            t haut
          </text>
          <text x={10 + ((duty + 1) * (W - 20)) / 4} y={lo + 13} textAnchor="middle" className="fill-night-500 font-mono text-[10px]">
            t bas
          </text>
        </>
      )}
      {duty == null && (
        <text x="140" y={hi - 5} textAnchor="middle" className="fill-night-500 font-mono text-[10px]">
          impulsion T
        </text>
      )}
    </svg>
  )
}

const siOr = (x, unit) => (Number.isFinite(x) ? formatSI(x, unit, 3) : '?')

export default function Timer555() {
  const [mode, setMode] = useState('astable')
  const [v, setV] = useState({ r1: '10k', r2: '47k', r: '10k', c: '10µ', f: '1k', duty: '60', cd: '10n' })
  const set = (key) => (value) => setV((s) => ({ ...s, [key]: value }))

  const a = mode === 'astable' ? astable({ r1: parseSI(v.r1), r2: parseSI(v.r2), c: parseSI(v.c) }) : null
  const m = mode === 'monostable' ? monostable({ r: parseSI(v.r), c: parseSI(v.c) }) : null
  const design = mode === 'design' ? designAstable({ frequency: parseSI(v.f), duty: parseSI(v.duty) / 100, c: parseSI(v.cd) }) : null

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="card card-pad space-y-5">
        <Segmented
          value={mode}
          onChange={setMode}
          ariaLabel="Mode du 555"
          options={[
            { value: 'astable', label: 'Astable' },
            { value: 'monostable', label: 'Monostable' },
            { value: 'design', label: 'Conception astable' },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          {mode === 'astable' && (
            <>
              <SIField id="t-r1" label="R1 (Ω)" unit="Ω" value={v.r1} onChange={set('r1')} placeholder="ex. 10k" />
              <SIField id="t-r2" label="R2 (Ω)" unit="Ω" value={v.r2} onChange={set('r2')} placeholder="ex. 47k" />
              <SIField id="t-c" label="Condensateur C (F)" unit="F" value={v.c} onChange={set('c')} placeholder="ex. 10µ" />
            </>
          )}
          {mode === 'monostable' && (
            <>
              <SIField id="t-r" label="R (Ω)" unit="Ω" value={v.r} onChange={set('r')} placeholder="ex. 10k" />
              <SIField id="t-cm" label="Condensateur C (F)" unit="F" value={v.c} onChange={set('c')} placeholder="ex. 10µ" />
            </>
          )}
          {mode === 'design' && (
            <>
              <SIField id="t-f" label="Fréquence voulue (Hz)" unit="Hz" value={v.f} onChange={set('f')} placeholder="ex. 1k" />
              <SIField id="t-duty" label="Rapport cyclique (%)" unit="%" value={v.duty} onChange={set('duty')} placeholder="> 50" />
              <SIField id="t-cd" label="Condensateur C (F)" unit="F" value={v.cd} onChange={set('cd')} placeholder="ex. 10n" />
            </>
          )}
        </div>

        <div className="border-t border-night-200 pt-4 dark:border-night-800">
          {mode === 'astable' &&
            (a ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Result main label="Fréquence" value={formatSI(a.frequency, 'Hz', 4)} />
                <Result label="Période" value={formatSI(a.period, 's', 4)} />
                <Result label="Rapport cyclique" value={`${fmt(a.duty * 100, 1)} %`} />
                <Result label="Temps haut" value={formatSI(a.high, 's', 4)} hint="ln 2 × (R1 + R2) × C" />
                <Result label="Temps bas" value={formatSI(a.low, 's', 4)} hint="ln 2 × R2 × C" />
              </div>
            ) : (
              <p className="text-sm text-night-500">R1, R2 et C doivent être strictement positifs.</p>
            ))}

          {mode === 'monostable' &&
            (m ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Result main label="Durée de l'impulsion T" value={formatSI(m.width, 's', 4)} hint="T = ln 3 × R × C ≈ 1,1 × R × C" />
              </div>
            ) : (
              <p className="text-sm text-night-500">R et C doivent être strictement positifs.</p>
            ))}

          {mode === 'design' &&
            (design ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Result main label="R1" value={formatSI(design.r1, 'Ω', 4)} hint={`proches en E24 : ${nearestInSeries(design.r1).map((x) => formatSI(x, 'Ω')).join(' / ')}`} />
                <Result main label="R2" value={formatSI(design.r2, 'Ω', 4)} hint={`proches en E24 : ${nearestInSeries(design.r2).map((x) => formatSI(x, 'Ω')).join(' / ')}`} />
              </div>
            ) : (
              <p className="text-sm text-night-500">
                Le rapport cyclique doit être compris entre 50 et 100 % (montage astable classique, sans diode).
              </p>
            ))}
        </div>
      </div>

      <div className="card card-pad">
        <figure className="mb-4">
          <figcaption className="label">Schéma</figcaption>
          <Ne555Schema
            mode={mode === 'monostable' ? 'monostable' : 'astable'}
            r1={siOr(mode === 'design' ? design?.r1 : mode === 'monostable' ? parseSI(v.r) : parseSI(v.r1), 'Ω')}
            r2={siOr(mode === 'design' ? design?.r2 : parseSI(v.r2), 'Ω')}
            c={siOr(parseSI(mode === 'design' ? v.cd : v.c), 'F')}
          />
        </figure>
        <p className="label">Signal de sortie</p>
        <Waveform duty={mode === 'monostable' ? null : mode === 'astable' ? (a?.duty ?? 0.6) : (parseSI(v.duty) / 100 || 0.6)} />
        <div className="mt-4 space-y-2 text-xs text-night-500">
          <p>
            En astable, la sortie reste à l'état haut pendant la charge de C (via R1 + R2) et à l'état bas pendant sa décharge (via R2) : le
            rapport cyclique est donc toujours supérieur à 50 %.
          </p>
          <p>Pour descendre sous 50 %, ajoutez une diode en parallèle sur R2.</p>
        </div>
      </div>
    </div>
  )
}

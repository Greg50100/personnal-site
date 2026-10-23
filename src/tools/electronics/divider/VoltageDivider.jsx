import { useState } from 'react'
import Segmented from '../../../components/Segmented'
import { fmt } from '../../../lib/format'
import { formatSI, parseSI } from '../../../lib/si'
import { Result, SIField } from '../../kit/fields'
import { findR2, solveDivider } from './divider'

/** Schéma du pont : Vin en haut, R1, point milieu Vout, R2 vers la masse, charge RL facultative. */
function Schematic({ withLoad }) {
  const stroke = 'currentColor'
  const resistor = (x, y) => <rect x={x - 9} y={y} width="18" height="44" rx="2" fill="none" stroke={stroke} strokeWidth="2" />
  return (
    <svg viewBox="0 0 200 240" className="mx-auto h-auto w-full max-w-[220px] text-night-500" role="img" aria-label="Schéma du pont diviseur">
      <text x="60" y="16" textAnchor="middle" className="fill-accent-500 font-mono text-[12px] font-bold">
        Vin
      </text>
      <line x1="60" y1="22" x2="60" y2="40" stroke={stroke} strokeWidth="2" />
      {resistor(60, 40)}
      <text x="80" y="66" className="fill-current font-mono text-[12px]">
        R1
      </text>
      <line x1="60" y1="84" x2="60" y2="130" stroke={stroke} strokeWidth="2" />
      <circle cx="60" cy="107" r="3.5" fill="#f59e0b" />
      <line x1="60" y1="107" x2={withLoad ? 140 : 110} y2="107" stroke="#f59e0b" strokeWidth="2" />
      <text x={withLoad ? 100 : 116} y={withLoad ? 100 : 111} textAnchor={withLoad ? 'middle' : 'start'} className="fill-accent-500 font-mono text-[12px] font-bold">
        Vout
      </text>
      {resistor(60, 130)}
      <text x="80" y="156" className="fill-current font-mono text-[12px]">
        R2
      </text>
      <line x1="60" y1="174" x2="60" y2="205" stroke={stroke} strokeWidth="2" />
      {withLoad && (
        <>
          <line x1="140" y1="107" x2="140" y2="130" stroke={stroke} strokeWidth="2" />
          {resistor(140, 130)}
          <text x="158" y="156" className="fill-current font-mono text-[12px]">
            RL
          </text>
          <line x1="140" y1="174" x2="140" y2="195" stroke={stroke} strokeWidth="2" />
          <line x1="60" y1="195" x2="140" y2="195" stroke={stroke} strokeWidth="2" />
        </>
      )}
      <line x1="44" y1="205" x2="76" y2="205" stroke={stroke} strokeWidth="2" />
      <line x1="50" y1="211" x2="70" y2="211" stroke={stroke} strokeWidth="2" />
      <line x1="56" y1="217" x2="64" y2="217" stroke={stroke} strokeWidth="2" />
    </svg>
  )
}

export default function VoltageDivider() {
  const [mode, setMode] = useState('vout')
  const [v, setV] = useState({ vin: '12', r1: '10k', r2: '4k7', rl: '', target: '3.3', series: 'E24' })
  const set = (key) => (value) => setV((s) => ({ ...s, [key]: value }))

  const vin = parseSI(v.vin)
  const r1 = parseSI(v.r1)
  const res = mode === 'vout' ? solveDivider({ vin, r1, r2: parseSI(v.r2), rl: parseSI(v.rl) }) : null
  const design = mode === 'r2' ? findR2({ vin, vout: parseSI(v.target), r1 }, v.series) : null
  const withLoad = mode === 'vout' && v.rl.trim() !== '' && Number.isFinite(parseSI(v.rl))

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="card card-pad space-y-5">
        <Segmented
          value={mode}
          onChange={setMode}
          ariaLabel="Mode de calcul"
          options={[
            { value: 'vout', label: 'Calculer Vout' },
            { value: 'r2', label: 'Trouver R2' },
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <SIField id="div-vin" label="Tension d'entrée Vin (V)" unit="V" value={v.vin} onChange={set('vin')} placeholder="ex. 12" />
          <SIField id="div-r1" label="Résistance R1 (Ω)" unit="Ω" value={v.r1} onChange={set('r1')} placeholder="ex. 10k" />
          {mode === 'vout' ? (
            <>
              <SIField id="div-r2" label="Résistance R2 (Ω)" unit="Ω" value={v.r2} onChange={set('r2')} placeholder="ex. 4k7" />
              <SIField id="div-rl" label="Charge RL (Ω)" unit="Ω" value={v.rl} onChange={set('rl')} placeholder="ex. 100k" optional />
            </>
          ) : (
            <>
              <SIField id="div-target" label="Tension souhaitée Vout (V)" unit="V" value={v.target} onChange={set('target')} placeholder="ex. 3.3" />
              <div>
                <label htmlFor="div-series" className="label">
                  Série normalisée
                </label>
                <select id="div-series" className="input" value={v.series} onChange={(e) => set('series')(e.target.value)}>
                  {['E12', 'E24', 'E96'].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-night-200 pt-4 dark:border-night-800">
          {mode === 'vout' &&
            (res ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Result main label="Tension de sortie Vout" value={formatSI(res.vout, 'V', 5)} hint={`${fmt(res.ratio * 100, 2)} % de Vin`} />
                {withLoad && <Result label="Vout à vide (sans charge)" value={formatSI(res.unloaded, 'V', 5)} hint={`chute de ${fmt((1 - res.vout / res.unloaded) * 100, 1)} %`} />}
                <Result label="Courant dans R1" value={formatSI(res.current, 'A', 4)} />
                <Result label="Puissance dans R1" value={formatSI(res.p1, 'W', 3)} />
                <Result label="Puissance dans R2" value={formatSI(res.p2, 'W', 3)} />
                {withLoad && <Result label="Puissance dans la charge" value={formatSI(res.pLoad, 'W', 3)} />}
              </div>
            ) : (
              <p className="text-sm text-night-500">Saisissez Vin, R1 et R2.</p>
            ))}

          {mode === 'r2' &&
            (design ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Result main label="R2 exacte" value={formatSI(design.r2, 'Ω', 5)} hint="R2 = R1 × Vout ÷ (Vin − Vout)" />
                </div>
                <p className="label mt-4">Valeurs normalisées {v.series} les plus proches</p>
                <table className="table-data">
                  <thead>
                    <tr>
                      <th>R2</th>
                      <th>Vout obtenue</th>
                      <th>Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {design.candidates.map((c) => (
                      <tr key={c.r2}>
                        <td className="font-mono">{formatSI(c.r2, 'Ω')}</td>
                        <td className="font-mono">{formatSI(c.vout, 'V', 5)}</td>
                        <td className="font-mono">
                          {c.error >= 0 ? '+' : '−'}
                          {fmt(Math.abs(c.error) * 100, 2)} %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-sm text-night-500">Vout doit être positive et inférieure à Vin, R1 strictement positive.</p>
            ))}
        </div>
      </div>

      <div className="card card-pad">
        <p className="label">Schéma</p>
        <Schematic withLoad={withLoad} />
        <p className="mt-3 text-center font-mono text-sm">Vout = Vin × R2 ÷ (R1 + R2)</p>
        <p className="mt-2 text-xs text-night-500">
          Avec une charge, R2 est remplacée par R2 ∥ RL : prenez RL au moins 10 fois plus grande que R2 pour une chute négligeable.
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { fmt } from '../../../lib/format'
import { formatSI, parseSI } from '../../../lib/si'
import { Result, SIField } from '../../kit/fields'
import { LED_PRESETS, solveLed } from './led'

const FRACTIONS = { 0.125: '1/8 W', 0.25: '1/4 W', 0.5: '1/2 W' }
const ratingLabel = (w) => FRACTIONS[w] ?? `${w} W`

export default function LedResistor() {
  const [v, setV] = useState({ supply: '5', vf: '2', current: '20m', count: 1, series: 'E24' })
  const set = (key) => (value) => setV((s) => ({ ...s, [key]: value }))

  const res = solveLed(
    { supply: parseSI(v.supply), vf: parseSI(v.vf), currentA: parseSI(v.current), count: v.count },
    v.series,
  )
  const preset = LED_PRESETS.find((p) => Math.abs(p.vf - parseSI(v.vf)) < 1e-9)

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="card card-pad space-y-5">
        <div>
          <p className="label">Couleur de la LED (tension directe typique)</p>
          <div className="flex flex-wrap gap-2">
            {LED_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => set('vf')(String(p.vf))}
                aria-pressed={preset?.id === p.id}
                className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-sm transition-colors ${
                  preset?.id === p.id
                    ? 'border-accent-500 bg-accent-500/10 text-accent-700 dark:text-accent-400'
                    : 'border-night-200 text-night-600 hover:border-accent-500/50 dark:border-night-800 dark:text-night-400'
                }`}
              >
                <span className="h-3 w-3 rounded-full border border-black/20" style={{ backgroundColor: p.color }} />
                {p.label}
                <span className="font-mono text-xs text-night-500">{String(p.vf).replace('.', ',')} V</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <SIField id="led-supply" label="Tension d'alimentation (V)" unit="V" value={v.supply} onChange={set('supply')} placeholder="ex. 5" />
          <SIField id="led-vf" label="Tension directe Vf d'une LED (V)" unit="V" value={v.vf} onChange={set('vf')} placeholder="ex. 2" />
          <SIField id="led-current" label="Courant souhaité (A)" unit="A" value={v.current} onChange={set('current')} placeholder="ex. 20m" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="led-count" className="label">
                LED en série
              </label>
              <input
                id="led-count"
                type="number"
                min="1"
                max="20"
                className="input font-mono text-lg"
                value={v.count}
                onChange={(e) => set('count')(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              />
            </div>
            <div>
              <label htmlFor="led-series" className="label">
                Série
              </label>
              <select id="led-series" className="input" value={v.series} onChange={(e) => set('series')(e.target.value)}>
                {['E12', 'E24', 'E96'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-night-200 pt-4 dark:border-night-800">
          {res.error === 'missing' && <p className="text-sm text-night-500">Saisissez la tension d'alimentation, la tension directe et le courant.</p>}
          {res.error === 'voltage' && (
            <p className="text-sm text-red-500">
              L'alimentation doit dépasser la somme des tensions directes ({formatSI(res.totalVf, 'V', 4)}) : réduisez le nombre de LED en série ou
              augmentez la tension.
            </p>
          )}
          {!res.error && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Result main label={`Résistance normalisée ${v.series}`} value={formatSI(res.standard, 'Ω')} hint="valeur immédiatement supérieure" />
              <Result label="Résistance exacte" value={formatSI(res.r, 'Ω', 5)} hint="R = (Vs − n·Vf) ÷ I" />
              <Result label="Courant réel" value={formatSI(res.actualCurrent, 'A', 4)} />
              <Result
                label="Puissance dans la résistance"
                value={formatSI(res.pResistor, 'W', 3)}
                hint={res.rating ? `choisir au moins ${ratingLabel(res.rating)}` : 'plus de 10 W : revoir le montage'}
              />
              <Result label="Puissance des LED" value={formatSI(res.pLed, 'W', 3)} />
              <Result label="Rendement" value={`${fmt(res.efficiency * 100, 0)} %`} hint="part de l'énergie utile aux LED" />
            </div>
          )}
        </div>
      </div>

      <div className="card card-pad text-sm text-night-600 dark:text-night-400">
        <p className="label">À savoir</p>
        <ul className="list-disc space-y-2 pl-4">
          <li>Les tensions directes sont typiques : consultez la fiche technique de votre LED pour un calcul précis.</li>
          <li>Une LED classique de 5 mm supporte 20 mA ; 5 à 10 mA suffisent souvent pour un voyant.</li>
          <li>Prendre la valeur normalisée immédiatement supérieure garantit un courant légèrement inférieur à la consigne.</li>
          <li>Pour plusieurs LED en parallèle, prévoyez une résistance par LED.</li>
        </ul>
      </div>
    </div>
  )
}

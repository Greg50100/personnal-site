import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { formatSI, parseSI } from '../../../../lib/si'
import { solveOhm } from './ohm'
import { OhmSchema } from '../schemas'

const FIELDS = [
  { id: 'U', label: 'Tension', unit: 'V', placeholder: 'ex. 12' },
  { id: 'I', label: 'Courant', unit: 'A', placeholder: 'ex. 20m' },
  { id: 'R', label: 'Résistance', unit: 'Ω', placeholder: 'ex. 4k7' },
  { id: 'P', label: 'Puissance', unit: 'W', placeholder: 'ex. 0.25' },
]

const FORMULAS = {
  U: ['R × I', 'P ÷ I', '√(P × R)'],
  I: ['U ÷ R', 'P ÷ U', '√(P ÷ R)'],
  R: ['U ÷ I', 'U² ÷ P', 'P ÷ I²'],
  P: ['U × I', 'R × I²', 'U² ÷ R'],
}

export default function OhmsLaw() {
  const [values, setValues] = useState({ U: '12', I: '', R: '470', P: '' })
  const parsed = Object.fromEntries(FIELDS.map((f) => [f.id, parseSI(values[f.id])]))
  const filled = FIELDS.filter((f) => values[f.id].trim() !== '')
  const invalid = filled.filter((f) => !Number.isFinite(parsed[f.id]))
  const result = filled.length === 2 && !invalid.length ? solveOhm(parsed) : null
  const unitOf = (id) => FIELDS.find((f) => f.id === id).unit
  const shown = (id) => {
    const value = result ? result[id] : parsed[id]
    return Number.isFinite(value) ? formatSI(value, unitOf(id), 3) : null
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="card card-pad">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-night-600 dark:text-night-400">Remplissez exactement deux champs (préfixes acceptés : m, µ/u, k, M…).</p>
          <button type="button" className="btn-icon" onClick={() => setValues({ U: '', I: '', R: '', P: '' })} aria-label="Tout effacer" title="Tout effacer">
            <RotateCcw size={15} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => {
            const computed = result && values[f.id].trim() === ''
            const disabled = filled.length >= 2 && values[f.id].trim() === ''
            return (
              <div key={f.id}>
                <label htmlFor={`ohm-${f.id}`} className="label">
                  {f.label} {f.id} ({f.unit})
                </label>
                <input
                  id={`ohm-${f.id}`}
                  className={`input font-mono text-lg ${
                    computed ? 'border-accent-500/50 bg-accent-500/5 font-semibold text-accent-700 dark:bg-accent-500/5 dark:text-accent-400' : ''
                  } ${invalid.includes(f) ? 'border-red-500' : ''}`}
                  inputMode="decimal"
                  placeholder={disabled ? '' : f.placeholder}
                  value={computed ? formatSI(result[f.id], f.unit, 5) : values[f.id]}
                  onChange={(e) => setValues({ ...values, [f.id]: e.target.value })}
                  disabled={disabled && !computed}
                  readOnly={computed}
                  title={computed ? 'Valeur calculée : videz un autre champ pour la saisir' : undefined}
                />
                {!computed && Number.isFinite(parsed[f.id]) && (
                  <p className="mt-1 font-mono text-xs text-night-500">= {formatSI(parsed[f.id], f.unit, 6)}</p>
                )}
              </div>
            )
          })}
        </div>
        {invalid.length > 0 && <p className="mt-3 text-sm text-red-500">Valeur non reconnue : {invalid.map((f) => f.id).join(', ')}.</p>}
        {filled.length > 2 && <p className="mt-3 text-sm text-amber-600">Videz un champ : seules deux valeurs doivent être saisies.</p>}
      </div>

      <div className="card card-pad">
        <figure className="mb-4">
          <figcaption className="label">Schéma</figcaption>
          <OhmSchema
            u={shown('U')}
            i={shown('I')}
            r={shown('R')}
          />
        </figure>
        <p className="label">Formulaire</p>
        <ul className="space-y-3 font-mono text-sm">
          {Object.entries(FORMULAS).map(([k, list]) => (
            <li key={k}>
              <span className="font-bold text-accent-700 dark:text-accent-400">{k}</span> = {list.join('  ·  ')}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

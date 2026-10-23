import { useState } from 'react'
import { formatInBase, groupDigits, parseInBase } from './bases'

const FIXED = [
  { base: 2, label: 'Binaire', group: 4 },
  { base: 8, label: 'Octal', group: 3 },
  { base: 10, label: 'Décimal', group: 3 },
  { base: 16, label: 'Hexadécimal', group: 4 },
]

export default function NumberBases() {
  // La source est la base dans laquelle l'utilisateur tape : les autres champs en sont déduits.
  const [source, setSource] = useState({ base: 10, text: '2026' })
  const [customBase, setCustomBase] = useState(36)
  const value = parseInBase(source.text, source.base)
  const invalid = source.text.trim() !== '' && value === null

  const field = (base) => (base === source.base ? source.text : value === null ? '' : formatInBase(value, base))
  const bits = value === null ? 0 : (value < 0n ? -value : value).toString(2).length

  return (
    <div className="grid gap-6">
      <div className="card card-pad grid gap-4">
        {[...FIXED, { base: customBase, label: 'Base personnalisée', custom: true }].map((b) => (
          <div key={b.custom ? 'custom' : b.base}>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label htmlFor={`base-${b.custom ? 'c' : b.base}`} className="label mb-0">
                {b.label} {!b.custom && `(base ${b.base})`}
              </label>
              {b.custom && (
                <select
                  className="input w-auto py-1 text-xs"
                  value={customBase}
                  onChange={(e) => {
                    if (source.base === customBase) setSource({ base: 10, text: value === null ? '' : value.toString() })
                    setCustomBase(Number(e.target.value))
                  }}
                  aria-label="Choix de la base"
                >
                  {Array.from({ length: 35 }, (_, i) => i + 2).map((n) => (
                    <option key={n} value={n}>
                      base {n}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <input
              id={`base-${b.custom ? 'c' : b.base}`}
              className={`input font-mono text-lg ${b.base === source.base && invalid ? 'border-red-500' : ''}`}
              value={field(b.base)}
              onChange={(e) => setSource({ base: b.base, text: e.target.value })}
              spellCheck={false}
              autoComplete="off"
            />
            {b.group && value !== null && b.base !== 10 && (
              <p className="mt-1 break-all font-mono text-xs text-zinc-500">{groupDigits(formatInBase(value, b.base), b.group)}</p>
            )}
          </div>
        ))}
        {invalid && <p className="text-sm text-red-500">Chiffre non valide pour la base {source.base}.</p>}
      </div>
      {value !== null && (
        <div className="card card-pad grid gap-2 text-sm sm:grid-cols-3">
          <p>
            <span className="label">Bits nécessaires</span>
            <span className="font-mono">{bits}</span>
          </p>
          <p>
            <span className="label">Octets</span>
            <span className="font-mono">{Math.ceil(bits / 8) || 0}</span>
          </p>
          <p>
            <span className="label">Caractère (si code Unicode)</span>
            <span className="font-mono">{value >= 32n && value <= 0x10ffffn ? String.fromCodePoint(Number(value)) : '—'}</span>
          </p>
        </div>
      )}
    </div>
  )
}

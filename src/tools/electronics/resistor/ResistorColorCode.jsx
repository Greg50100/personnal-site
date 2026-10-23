import { useState } from 'react'
import Segmented from '../../../components/Segmented'
import { fmt } from '../../../lib/format'
import { formatSI, parseSI } from '../si'
import { COLOR, LAYOUTS, ROLE_LABEL, decode, eSeriesOf, encode, nearestInSeries, optionsFor } from './colors'

const DEFAULT_BANDS = {
  4: ['jaune', 'violet', 'rouge', 'or'],
  5: ['jaune', 'violet', 'noir', 'marron', 'marron'],
  6: ['jaune', 'violet', 'noir', 'marron', 'marron', 'marron'],
}

function ResistorDrawing({ bands }) {
  const n = bands.length
  // Anneaux répartis sur le corps, le dernier (tolérance) un peu écarté comme sur les vrais composants.
  const xs = bands.map((_, i) => (i < n - 1 ? 92 + i * 28 : 92 + (n - 2) * 28 + 44))
  return (
    <svg viewBox="0 0 400 110" className="mx-auto h-auto w-full max-w-lg" role="img" aria-label="Résistance">
      <line x1="0" y1="55" x2="400" y2="55" stroke="#a1a1aa" strokeWidth="6" strokeLinecap="round" />
      <rect x="60" y="20" width="280" height="70" rx="30" fill="#e7d5b0" stroke="#b49a6a" strokeWidth="2" />
      {bands.map((id, i) => (
        <rect key={i} x={xs[i]} y="20" width="16" height="70" fill={COLOR[id].hex} stroke="#00000033" />
      ))}
      <rect x="66" y="26" width="268" height="12" rx="6" fill="#ffffff" opacity="0.25" />
    </svg>
  )
}

export default function ResistorColorCode() {
  const [count, setCount] = useState(4)
  const [bandsByCount, setBandsByCount] = useState(DEFAULT_BANDS)
  const [reverse, setReverse] = useState('')
  const bands = bandsByCount[count]
  const layout = LAYOUTS[count]
  const { ohms, tolerance, tcr } = decode(bands)
  const series = eSeriesOf(ohms)

  const setBand = (i, id) => setBandsByCount((b) => ({ ...b, [count]: b[count].map((x, j) => (j === i ? id : x)) }))

  const reverseValue = parseSI(reverse)
  const encoded = Number.isFinite(reverseValue) ? encode(reverseValue, count === 4 ? 2 : 3) : null
  const applyReverse = () => {
    if (!encoded) return
    setBandsByCount((b) => ({ ...b, [count]: [...encoded.digits, encoded.mult, ...b[count].slice(encoded.digits.length + 1)] }))
  }

  return (
    <div className="grid gap-6">
      <div className="card card-pad">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Segmented
            ariaLabel="Nombre d'anneaux"
            value={count}
            onChange={setCount}
            options={[
              { value: 4, label: '4 anneaux' },
              { value: 5, label: '5 anneaux' },
              { value: 6, label: '6 anneaux' },
            ]}
          />
        </div>
        <ResistorDrawing bands={bands} />
        <div className="mt-4 text-center">
          <p className="font-mono text-4xl font-bold text-orange-600 dark:text-orange-400">{formatSI(ohms, 'Ω', 6)}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            ± {fmt(tolerance, tolerance < 1 ? 2 : 0)} % · de {formatSI(ohms * (1 - tolerance / 100), 'Ω', 5)} à {formatSI(ohms * (1 + tolerance / 100), 'Ω', 5)}
            {tcr !== null && <> · {tcr} ppm/K</>}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {series ? `Valeur normalisée de la série ${series}` : `Valeur hors séries E — proches en E24 : ${nearestInSeries(ohms).map((v) => formatSI(v, 'Ω')).join(' / ')}`}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {layout.map((role, i) => (
          <fieldset key={`${count}-${i}`} className="card p-3">
            <legend className="sr-only">
              Anneau {i + 1} : {ROLE_LABEL[role]}
            </legend>
            <p className="label">
              Anneau {i + 1} · {ROLE_LABEL[role]}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {optionsFor(role).map((c) => {
                const active = bands[i] === c.id
                const detail = role === 'digit' ? c.digit : role === 'mult' ? `×${formatSI(c.mult, '', 3).trim()}` : role === 'tol' ? `±${String(c.tol).replace('.', ',')} %` : `${c.tcr} ppm`
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setBand(i, c.id)}
                    title={`${c.label} (${detail})`}
                    aria-label={`${c.label} (${detail})`}
                    aria-pressed={active}
                    className={`h-8 w-8 rounded-md border-2 transition-transform ${active ? 'scale-110 border-orange-500 ring-2 ring-orange-500/40' : 'border-zinc-300 dark:border-zinc-700'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                )
              })}
            </div>
            <p className="mt-2 text-xs text-zinc-500">{COLOR[bands[i]].label}</p>
          </fieldset>
        ))}
      </div>

      <div className="card card-pad">
        <label htmlFor="reverse" className="label">
          Valeur → couleurs
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="reverse"
            className="input font-mono"
            placeholder="ex. 4k7, 220, 1.5M, 10R"
            value={reverse}
            onChange={(e) => setReverse(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyReverse()}
          />
          <button type="button" className="btn-primary shrink-0" onClick={applyReverse} disabled={!encoded}>
            Appliquer
          </button>
        </div>
        {reverse && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {encoded
              ? `${encoded.digits.map((id) => COLOR[id].label).join(', ')}, ${COLOR[encoded.mult].label}${encoded.exact ? '' : ' (valeur arrondie)'}`
              : 'Valeur non représentable avec ces anneaux.'}
          </p>
        )}
      </div>
    </div>
  )
}

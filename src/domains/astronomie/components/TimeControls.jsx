import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Radio } from 'lucide-react'
import { toDateTimeLocal, utcOffsetLabel } from '../../../lib/format'

/** Choix de l'instant : temps réel, saisie libre et pas de ±1 h / ±1 j. */
export default function TimeControls({ clock, steps = ['day', 'hour'], className = '' }) {
  const { date, live, setDate, goLive } = clock
  const shift = (ms) => setDate(new Date(date.getTime() + ms))
  const H = 3_600_000
  const D = 24 * H

  return (
    <div className={`flex min-w-0 max-w-full flex-wrap items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={goLive}
        className={`btn ${live ? 'border-emerald-500/60 text-emerald-600 dark:text-emerald-400' : ''}`}
        title="Revenir à l'heure actuelle, mise à jour automatique"
      >
        <Radio size={15} className={live ? 'animate-pulse' : ''} />
        {live ? 'Temps réel' : 'Maintenant'}
      </button>
      <div className="flex w-full min-w-0 items-center gap-1 sm:w-auto">
        {steps.includes('day') && (
          <button type="button" className="btn-icon" onClick={() => shift(-D)} aria-label="Un jour plus tôt" title="−1 jour">
            <ChevronsLeft size={16} />
          </button>
        )}
        {steps.includes('hour') && (
          <button type="button" className="btn-icon" onClick={() => shift(-H)} aria-label="Une heure plus tôt" title="−1 heure">
            <ChevronLeft size={16} />
          </button>
        )}
        <input
          type="datetime-local"
          className="input min-w-0 flex-1 font-mono sm:w-auto sm:flex-none"
          value={toDateTimeLocal(date)}
          onChange={(e) => {
            const d = new Date(e.target.value)
            if (!Number.isNaN(d.getTime())) setDate(d)
          }}
          aria-label="Date et heure"
        />
        {steps.includes('hour') && (
          <button type="button" className="btn-icon" onClick={() => shift(H)} aria-label="Une heure plus tard" title="+1 heure">
            <ChevronRight size={16} />
          </button>
        )}
        {steps.includes('day') && (
          <button type="button" className="btn-icon" onClick={() => shift(D)} aria-label="Un jour plus tard" title="+1 jour">
            <ChevronsRight size={16} />
          </button>
        )}
      </div>
      <span className="font-mono text-[11px] text-night-500">heure locale ({utcOffsetLabel(date)})</span>
    </div>
  )
}

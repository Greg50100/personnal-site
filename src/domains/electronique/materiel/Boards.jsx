import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GitCompare, ListChecks, X } from 'lucide-react'
import { BOARDS, FAMILIES, WIRELESS, wirelessTags } from './data/boards'
import { Links, LogicBadge, SearchField, SpecList, ToggleChip } from './ui'
import { PINOUTS } from './data/pinouts'
import PinoutDiagram from './PinoutDiagram'
import PinTable from './PinTable'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { DEFAULT_MONTAGE, MONTAGE_KEY } from './check'

const MAX_COMPARE = 4

const tolerance = (b) => (b.tolerant5v === true ? 'Oui (carte 5 V)' : b.tolerant5v === 'partiel' ? 'En partie (voir les broches)' : 'Non')
const radio = (b) => (b.wireless.length ? b.wireless.join(' · ') : 'Aucune')

const ROWS = [
  ['Puce', (b) => b.chip],
  ['Processeur', (b) => b.cpu],
  ['Mémoire', (b) => b.ram],
  ['Stockage', (b) => b.flash],
  ['Niveau logique', (b) => (b.logic === 5 ? '5 V' : '3,3 V')],
  ['Tolérance 5 V', tolerance],
  ['Alimentation', (b) => b.supply],
  ['Entrées-sorties', (b) => b.gpio],
  ['Analogique', (b) => b.adc],
  ['Sortie analogique', (b) => b.dac],
  ['Bus', (b) => b.buses],
  ['USB', (b) => b.usb],
  ['Radio', radio],
  ['Courant par broche', (b) => b.pinCurrent],
  ['Veille', (b) => b.sleep],
  ['ESPHome', (b) => (b.esphome ? 'Oui' : 'Non')],
  ['Programmation', (b) => b.software.join(', ')],
]

function matches(b, family, wireless, query) {
  if (family && b.family !== family) return false
  if (wireless) {
    const tags = wirelessTags(b)
    if (wireless === 'none' ? tags.length : !tags.includes(wireless)) return false
  }
  if (query) {
    const q = query.toLowerCase()
    return [b.name, b.chip, b.summary, b.cpu].some((t) => t.toLowerCase().includes(q))
  }
  return true
}

function BoardDetail({ board, onClose, onUse }) {
  return (
    <section className="card card-pad" aria-labelledby="board-detail-title">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="board-detail-title" className="font-display text-xl font-semibold text-night-900 dark:text-night-50">
            {board.name}
          </h2>
          <p className="text-sm text-night-600 dark:text-night-400">{board.summary}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={onUse}>
            <ListChecks size={14} /> Vérifier un montage avec cette carte
          </button>
          <button type="button" className="btn-icon" onClick={onClose} aria-label="Fermer la fiche">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <SpecList className="min-w-0" rows={ROWS.map(([k, f]) => [k, f(board)])} />
        <div className="min-w-0 space-y-5">
          <div>
            <p className="label">Broches particulières</p>
            <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
              <table className="table-data">
                <tbody>
                  {board.pins.map(([pin, note]) => (
                    <tr key={pin}>
                      <td className="align-top font-mono font-medium">{pin}</td>
                      <td className="!whitespace-normal">{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div>
            <p className="label">À savoir</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-night-700 dark:text-night-300">
              {board.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label">Fiches techniques et documentation</p>
            <Links links={board.links} />
          </div>
        </div>
      </div>
      {PINOUTS[board.id] && (
        <div className="mt-6 space-y-5 border-t border-night-200 pt-4 dark:border-night-800">
          <h3 className="font-display text-lg font-semibold text-night-900 dark:text-night-50">Brochage</h3>
          <PinoutDiagram key={board.id} pinout={PINOUTS[board.id]} />
          <PinTable key={`table-${board.id}`} pinout={PINOUTS[board.id]} />
        </div>
      )}
    </section>
  )
}

function CompareTable({ boards, onRemove }) {
  return (
    <section className="card card-pad" aria-labelledby="compare-title">
      <h2 id="compare-title" className="label">
        Comparaison
      </h2>
      <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
        <table className="table-data">
          <thead>
            <tr>
              <th />
              {boards.map((b) => (
                <th key={b.id} className="min-w-[12rem]">
                  <span className="flex items-center justify-between gap-2">
                    {b.name}
                    <button type="button" onClick={() => onRemove(b.id)} aria-label={`Retirer ${b.name} de la comparaison`} className="text-night-400 hover:text-accent-600">
                      <X size={14} />
                    </button>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, f]) => (
              <tr key={label}>
                <td className="font-medium text-night-600 dark:text-night-300">{label}</td>
                {boards.map((b) => (
                  <td key={b.id} className="!whitespace-normal align-top">
                    {f(b)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default function Boards() {
  const [family, setFamily] = useState(null)
  const [wireless, setWireless] = useState(null)
  const [query, setQuery] = useState('')
  const [compare, setCompare] = useState([])
  // Carte ouverte dans l'adresse (?carte=esp32) : lien direct vers une fiche et son brochage
  const [params, setParams] = useSearchParams()
  const selected = BOARDS.some((b) => b.id === params.get('carte')) ? params.get('carte') : null
  const setSelected = (id) => setParams(id ? { carte: id } : {}, { replace: true })
  const [, setMontage] = useLocalStorage(MONTAGE_KEY, DEFAULT_MONTAGE)
  const [used, setUsed] = useState(false)
  const topRef = useRef(null)

  const list = BOARDS.filter((b) => matches(b, family, wireless, query))
  const compared = compare.map((id) => BOARDS.find((b) => b.id === id))
  const detail = BOARDS.find((b) => b.id === selected)

  const toggleCompare = (id) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < MAX_COMPARE ? [...c, id] : c))
  const open = (id) => {
    setSelected(id)
    setUsed(false)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const pickBoard = () => {
    setMontage((m) => ({ ...m, board: selected }))
    setUsed(true)
  }

  return (
    <div className="space-y-6" ref={topRef}>
      <div className="card card-pad space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-night-500">Famille</span>
          <ToggleChip active={!family} onClick={() => setFamily(null)}>
            Toutes
          </ToggleChip>
          {FAMILIES.map((f) => (
            <ToggleChip key={f.id} active={family === f.id} onClick={() => setFamily(family === f.id ? null : f.id)}>
              {f.label}
            </ToggleChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-night-500">Radio</span>
          {WIRELESS.map((w) => (
            <ToggleChip key={w.id} active={wireless === w.id} onClick={() => setWireless(wireless === w.id ? null : w.id)}>
              {w.label}
            </ToggleChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Rechercher une carte ou une puce" />
          <p className="text-xs text-night-500">
            {list.length} carte{list.length > 1 ? 's' : ''} · cochez jusqu’à {MAX_COMPARE} cartes pour les comparer
          </p>
        </div>
      </div>

      {detail && (
        <>
          <BoardDetail board={detail} onClose={() => setSelected(null)} onUse={pickBoard} />
          {used && (
            <p className="text-sm text-night-600 dark:text-night-300">
              {detail.name} est choisie dans l’outil{' '}
              <Link to="/electronique/verifier-montage" className="text-accent-700 underline dark:text-accent-300">
                Vérifier un montage
              </Link>
              .
            </p>
          )}
        </>
      )}
      {compared.length >= 2 && <CompareTable boards={compared} onRemove={toggleCompare} />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((b) => (
          <article key={b.id} className={`card card-pad flex flex-col gap-3 ${selected === b.id ? 'ring-2 ring-accent-400' : ''}`}>
            <div>
              <h3 className="font-display text-base font-semibold text-night-900 dark:text-night-50">{b.name}</h3>
              <p className="mt-0.5 text-sm text-night-600 dark:text-night-400">{b.summary}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <LogicBadge volts={b.logic} />
              {b.wireless.map((w) => (
                <span key={w} className="chip">
                  {w}
                </span>
              ))}
              {b.esphome && <span className="chip">ESPHome</span>}
            </div>
            <SpecList
              className="text-xs"
              rows={[
                ['Processeur', b.cpu],
                ['Mémoire', b.ram],
                ['E/S', b.gpio],
                ['Analogique', b.adc],
              ]}
            />
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              <button type="button" className="btn flex-1" onClick={() => open(b.id)}>
                Fiche et brochage
              </button>
              <label className="chip cursor-pointer gap-1.5 px-2.5 py-1.5 text-xs">
                <input
                  type="checkbox"
                  className="accent-amber-500"
                  checked={compare.includes(b.id)}
                  disabled={!compare.includes(b.id) && compare.length >= MAX_COMPARE}
                  onChange={() => toggleCompare(b.id)}
                />
                <GitCompare size={12} /> Comparer
              </label>
            </div>
          </article>
        ))}
      </div>
      {!list.length && <p className="text-sm text-night-500">Aucune carte ne correspond à ces filtres.</p>}
    </div>
  )
}

import { CircleCheck, Info, Minus, OctagonAlert, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { BOARDS, FAMILIES } from './data/boards'
import { BUSES, KINDS, MODULES, hex } from './data/modules'
import { DEFAULT_MONTAGE, MONTAGE_KEY, checkMontage } from './check'
import { LogicBadge } from './ui'
import { ResultTiles } from '../kit/Calculator'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { fmt } from '../../lib/format'

const LEVEL = {
  error: { label: 'Erreur', Icon: OctagonAlert, className: 'border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-300' },
  warning: { label: 'Attention', Icon: TriangleAlert, className: 'border-amber-500/40 bg-amber-500/5 text-amber-800 dark:text-amber-300' },
  info: { label: 'À savoir', Icon: Info, className: 'border-sky-500/40 bg-sky-500/5 text-sky-800 dark:text-sky-300' },
  ok: { label: 'Bon', Icon: CircleCheck, className: 'border-emerald-500/40 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300' },
}
const V = (v) => (v == null ? '—' : `${String(v).replace('.', ',')} V`)
const byId = (id) => MODULES.find((m) => m.id === id)
/** Courant en mA : une décimale sous 10 mA. */
const mA = (x) => `${x < 10 ? fmt(x, 1) : fmt(x, 0)} mA`

export default function MontageCheck() {
  const [montage, setMontage] = useLocalStorage(MONTAGE_KEY, DEFAULT_MONTAGE)
  const [pick, setPick] = useState('bme280')
  const board = BOARDS.find((b) => b.id === montage.board) ?? BOARDS[0]
  const modules = montage.modules.map(byId).filter(Boolean)
  const result = checkMontage(board, modules)

  const counts = new Map()
  for (const m of modules) counts.set(m.id, (counts.get(m.id) ?? 0) + 1)
  const setBoard = (id) => setMontage((s) => ({ ...s, board: id }))
  const addModule = (id) => setMontage((s) => ({ ...s, modules: [...s.modules, id] }))
  const removeOne = (id) =>
    setMontage((s) => {
      const i = s.modules.lastIndexOf(id)
      return { ...s, modules: s.modules.filter((_, j) => j !== i) }
    })

  const r = result.rail
  const tiles = [
    { label: 'Adresses I2C occupées', value: String(result.i2cMap.length), format: 'text' },
    { label: 'Liaisons série', value: `${result.uart.used} / ${result.uart.free} libre${result.uart.free > 1 ? 's' : ''}`, format: 'text' },
    { label: 'Entrées analogiques', value: `${result.adc.used} / ${result.adc.available}`, format: 'text' },
    { label: 'Modules sur le 3,3 V', value: mA(r[3.3].typ), format: 'text', hint: `pointes ≈ ${mA(r[3.3].peak)}` },
    { label: 'Modules sur le 5 V', value: mA(r[5].typ), format: 'text', hint: `pointes ≈ ${mA(r[5].peak)}` },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
      <div className="card card-pad h-fit space-y-5">
        <div>
          <label htmlFor="montage-board" className="label">
            Carte
          </label>
          <select id="montage-board" className="input" value={board.id} onChange={(e) => setBoard(e.target.value)}>
            {FAMILIES.map((f) => (
              <optgroup key={f.id} label={f.label}>
                {BOARDS.filter((b) => b.family === f.id).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="mt-2 flex flex-wrap gap-1">
            <LogicBadge volts={board.logic} />
            <span className="chip">{board.i2cBuses} bus I2C</span>
            {board.esphome && <span className="chip">ESPHome</span>}
          </div>
        </div>

        <div>
          <label htmlFor="montage-module" className="label">
            Ajouter un module
          </label>
          <div className="flex gap-2">
            <select id="montage-module" className="input" value={pick} onChange={(e) => setPick(e.target.value)}>
              {KINDS.filter((k) => k.id !== 'alimentation').map((k) => (
                <optgroup key={k.id} label={k.label}>
                  {MODULES.filter((m) => m.kind === k.id && m.bus !== 'power').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button type="button" className="btn-primary shrink-0" onClick={() => addModule(pick)}>
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <p className="mt-1 text-xs text-night-500">
            Ou depuis le catalogue{' '}
            <Link to="/materiel/capteurs-modules" className="text-accent-700 underline dark:text-accent-300">
              Capteurs et modules
            </Link>
            .
          </p>
        </div>

        <div>
          <p className="label">Modules du montage</p>
          {counts.size === 0 && <p className="text-sm text-night-500">Aucun module pour l’instant.</p>}
          <ul className="space-y-1.5">
            {[...counts].map(([id, n]) => (
              <li key={id} className="flex items-center justify-between gap-2 rounded-lg bg-night-50 px-3 py-1.5 text-sm dark:bg-night-950">
                <span className="min-w-0">
                  {byId(id).name}
                  <span className="ml-1.5 text-xs text-night-500">{BUSES[byId(id).bus]}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button type="button" className="btn-icon h-7 w-7" onClick={() => removeOne(id)} aria-label={`Retirer un ${byId(id).name}`}>
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center font-mono">{n}</span>
                  <button type="button" className="btn-icon h-7 w-7" onClick={() => addModule(id)} aria-label={`Ajouter un ${byId(id).name}`}>
                    <Plus size={12} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
          {counts.size > 0 && (
            <button type="button" className="btn mt-3 w-full" onClick={() => setMontage((s) => ({ ...s, modules: [] }))}>
              <Trash2 size={14} /> Tout retirer
            </button>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-6">
        <div className="card card-pad space-y-4">
          <ResultTiles results={tiles} />
          {result.findings.length === 0 && <p className="text-sm text-night-500">Ajoutez des modules pour vérifier le montage.</p>}
          <ul className="space-y-2">
            {result.findings.map((f, i) => {
              const { label, Icon, className } = LEVEL[f.level]
              return (
                <li key={`${f.title}-${i}`} className={`flex gap-3 rounded-xl border px-3 py-2.5 ${className}`}>
                  <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">
                      <span className="sr-only">{label} : </span>
                      {f.title}
                    </p>
                    {f.detail && <p className="text-sm text-night-700 dark:text-night-300">{f.detail}</p>}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        {result.rows.length > 0 && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className="card card-pad min-w-0">
              <h2 className="label">Alimentation et niveaux</h2>
              <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
                <table className="table-data">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Alimenter en</th>
                      <th>Signaux envoyés</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr key={`${row.name}-${i}`}>
                        <td className="!whitespace-normal">{row.name}</td>
                        <td className="font-mono">{row.external ? `${V(row.supply)} (séparée)` : V(row.supply)}</td>
                        <td className="font-mono">{V(row.level)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            {result.i2cMap.length > 0 && (
              <section className="card card-pad min-w-0">
                <h2 className="label">Plan d’adressage I2C</h2>
                <div className="overflow-x-auto rounded-xl border border-night-200 dark:border-night-800">
                  <table className="table-data">
                    <thead>
                      <tr>
                        <th>Adresse</th>
                        <th>Module</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.i2cMap.map((a) => (
                        <tr key={`${a.address}-${a.name}`}>
                          <td className="font-mono">{hex(a.address)}</td>
                          <td className="!whitespace-normal">
                            {a.name}
                            {!a.default && <span className="ml-1.5 text-xs text-night-500">(adresse à régler)</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        )}
        <p className="text-xs text-night-500">
          Vérification indicative, d’après les fiches techniques et les modules les plus courants : un module peut intégrer un régulateur ou un
          adaptateur de niveau qui change la donne. Les courants sont des ordres de grandeur.
        </p>
      </div>
    </div>
  )
}

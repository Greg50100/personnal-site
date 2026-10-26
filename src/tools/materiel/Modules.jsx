import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { BUSES, KINDS, MODULES, hex } from './data/modules'
import { Links, SearchField, SpecList, ToggleChip } from './ui'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { DEFAULT_MONTAGE, MONTAGE_KEY } from './check'
import { wiringOf } from './data/wiring'
import WiringDiagram from './WiringDiagram'

const volts = (v) => String(v).replace('.', ',')
const supplyText = ([a, b]) => (a === b ? `${volts(a)} V` : `${volts(a)} à ${volts(b)} V`)
const levelText = (m) => (m.levels === '3v3' ? 'toujours 3,3 V' : m.levels === 'vcc' ? 'ceux de son alimentation' : null)

function matches(m, kind, bus, query) {
  if (kind && m.kind !== kind) return false
  if (bus && m.bus !== bus) return false
  if (query) {
    const q = query.toLowerCase()
    return [m.name, m.role, ...m.specs.flat()].some((t) => t.toLowerCase().includes(q))
  }
  return true
}

function ModuleCard({ module: m, open, onToggle, onAdd, count }) {
  const addresses = [...(m.i2c ?? []), ...(m.i2cExtra ?? [])]
  const wiring = open ? wiringOf(m) : null
  return (
    <article className="card card-pad flex flex-col gap-3">
      <div>
        <h3 className="font-display text-base font-semibold text-night-900 dark:text-night-50">{m.name}</h3>
        <p className="mt-0.5 text-sm text-night-600 dark:text-night-400">{m.role}</p>
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="chip">{m.iface}</span>
        <span className="chip">{supplyText(m.supply)}</span>
        {addresses.length > 0 && <span className="chip font-mono">{addresses.length > 4 ? `${hex(addresses[0])} à ${hex(addresses.at(-1))}` : addresses.map(hex).join(' · ')}</span>}
        {m.external && <span className="chip border-amber-500/40 text-amber-700 dark:text-amber-300">Alimentation séparée</span>}
      </div>
      <SpecList className="text-xs" rows={m.specs} />
      {open && (
        <div className="space-y-3 border-t border-night-200 pt-3 dark:border-night-800">
          {wiring && <WiringDiagram wiring={wiring} />}
          <SpecList
            className="text-xs"
            rows={[
              ['Signaux envoyés', levelText(m)],
              ['Courant (ordre de grandeur)', m.current.peak ? `${volts(m.current.typ)} mA, pointes ${volts(m.current.peak)} mA` : null],
              ['ESPHome', m.esphome ? m.esphome.platform : 'Pas de composant dédié'],
            ]}
          />
          <ul className="list-disc space-y-1 pl-5 text-sm text-night-700 dark:text-night-300">
            {m.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <Links links={[...(m.esphome ? [{ label: 'Documentation ESPHome', url: m.esphome.url }] : []), ...m.links]} />
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <button type="button" className="btn flex-1" onClick={onToggle} aria-expanded={open}>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {open ? 'Moins' : 'Câblage et conseils'}
        </button>
        {m.bus !== 'power' && (
          <button type="button" className="btn" onClick={onAdd} aria-label={`Ajouter ${m.name} au montage`}>
            <Plus size={14} /> Montage{count ? ` (${count})` : ''}
          </button>
        )}
      </div>
    </article>
  )
}

export default function Modules() {
  const [kind, setKind] = useState(null)
  const [bus, setBus] = useState(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(() => new Set())
  const [montage, setMontage] = useLocalStorage(MONTAGE_KEY, DEFAULT_MONTAGE)

  const list = MODULES.filter((m) => matches(m, kind, bus, query))
  const toggle = (id) =>
    setOpen((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const add = (id) => setMontage((m) => ({ ...m, modules: [...m.modules, id] }))
  const countOf = (id) => montage.modules.filter((x) => x === id).length

  return (
    <div className="space-y-6">
      <div className="card card-pad space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-night-500">Catégorie</span>
          <ToggleChip active={!kind} onClick={() => setKind(null)}>
            Toutes
          </ToggleChip>
          {KINDS.map((k) => (
            <ToggleChip key={k.id} active={kind === k.id} onClick={() => setKind(kind === k.id ? null : k.id)}>
              {k.label}
            </ToggleChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-night-500">Liaison</span>
          {Object.entries(BUSES).map(([id, label]) => (
            <ToggleChip key={id} active={bus === id} onClick={() => setBus(bus === id ? null : id)}>
              {label}
            </ToggleChip>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchField value={query} onChange={setQuery} placeholder="Rechercher (CO2, lux, BME280…)" />
          <p className="text-xs text-night-500">
            {list.length} module{list.length > 1 ? 's' : ''}
            {montage.modules.length > 0 && (
              <>
                {' · '}
                <Link to="/materiel/verifier-montage" className="text-accent-700 underline dark:text-accent-300">
                  {montage.modules.length} dans le montage : le vérifier
                </Link>
              </>
            )}
          </p>
        </div>
      </div>

      {KINDS.filter((k) => list.some((m) => m.kind === k.id)).map((k) => (
        <section key={k.id} aria-labelledby={`kind-${k.id}`}>
          <h2 id={`kind-${k.id}`} className="mb-3 font-display text-lg font-semibold text-night-900 dark:text-night-50">
            {k.label}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {list
              .filter((m) => m.kind === k.id)
              .map((m) => (
                <ModuleCard key={m.id} module={m} open={open.has(m.id)} onToggle={() => toggle(m.id)} onAdd={() => add(m.id)} count={countOf(m.id)} />
              ))}
          </div>
        </section>
      ))}
      {!list.length && <p className="text-sm text-night-500">Aucun module ne correspond à ces filtres.</p>}
    </div>
  )
}

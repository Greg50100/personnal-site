import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AWG_RANGE, METRIC_SECTIONS, awgArea, awgDiameter, awgFromArea, awgLabel, nearestAwg, resistancePerKm } from './data/wires'
import { DataTable, Notes, RefSection, Sources } from './ui'
import { parseNumber, smartNumber } from '../../../lib/format'

const fmt = (x, digits = 3) => smartNumber(x, digits)

const SOURCES = [
  { label: 'American wire gauge (Wikipedia)', url: 'https://en.wikipedia.org/wiki/American_wire_gauge' },
  { label: 'IEC 60228 : âmes des câbles isolés (Wikipedia)', url: 'https://en.wikipedia.org/wiki/IEC_60228' },
]

/** Convertisseur AWG ↔ mm². */
function Converter() {
  const [awg, setAwg] = useState('22')
  const [mm2, setMm2] = useState('1.5')
  const n = awg.trim().match(/^(\d)\/0$/) ? 1 - Number(awg.trim()[0]) : parseNumber(awg)
  const s = parseNumber(mm2)
  const validN = Number.isFinite(n) && n >= -3 && n <= 50
  const validS = Number.isFinite(s) && s > 0
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-night-200 p-3 dark:border-night-800">
        <label htmlFor="awg-in" className="label">
          Jauge AWG (22, 1/0…)
        </label>
        <input id="awg-in" className="input" value={awg} onChange={(e) => setAwg(e.target.value)} inputMode="decimal" />
        {validN ? (
          <p className="mt-2 text-sm text-night-700 dark:text-night-300">
            ⌀ <strong>{fmt(awgDiameter(n))} mm</strong> · section <strong>{fmt(awgArea(n))} mm²</strong> · {fmt(resistancePerKm(awgArea(n)))} Ω/km
          </p>
        ) : (
          <p className="mt-2 text-sm text-night-500">Une jauge de 4/0 à 50.</p>
        )}
      </div>
      <div className="rounded-xl border border-night-200 p-3 dark:border-night-800">
        <label htmlFor="mm2-in" className="label">
          Section (mm²)
        </label>
        <input id="mm2-in" className="input" value={mm2} onChange={(e) => setMm2(e.target.value)} inputMode="decimal" />
        {validS ? (
          <p className="mt-2 text-sm text-night-700 dark:text-night-300">
            AWG <strong>{fmt(awgFromArea(s), 3)}</strong> (le plus proche : <strong>{awgLabel(nearestAwg(s))}</strong>) · ⌀ {fmt(Math.sqrt((4 * s) / Math.PI))} mm · {fmt(resistancePerKm(s))} Ω/km
          </p>
        ) : (
          <p className="mt-2 text-sm text-night-500">Une section positive.</p>
        )}
      </div>
    </div>
  )
}

export default function Wires() {
  const awgRows = AWG_RANGE.map((n) => {
    const a = awgArea(n)
    return [awgLabel(n), fmt(awgDiameter(n)), fmt(a), fmt(resistancePerKm(a)), fmt(resistancePerKm(a) * 0.3048, 3)]
  })
  // Au-delà de 1/0, la jauge « exacte » n'a plus de sens (échelle 1/0, 2/0…) : seule la plus proche est donnée
  const metricRows = METRIC_SECTIONS.map((s) => [fmt(s), fmt(Math.sqrt((4 * s) / Math.PI)), awgLabel(nearestAwg(s)), awgFromArea(s) >= 0.5 ? fmt(awgFromArea(s), 3) : '—', fmt(resistancePerKm(s))])

  return (
    <div className="space-y-6">
      <RefSection id="convertir" title="Convertir">
        <Converter />
      </RefSection>
      <div className="grid gap-6 xl:grid-cols-2">
        <RefSection id="awg" title="Jauges AWG" intro="Fil plein de cuivre recuit, résistance à 20 °C.">
          <DataTable
            columns={[{ label: 'AWG' }, { label: '⌀ (mm)', align: 'right' }, { label: 'Section (mm²)', align: 'right' }, { label: 'Ω/km', align: 'right' }, { label: 'Ω/1000 ft', align: 'right' }]}
            rows={awgRows}
          />
        </RefSection>
        <RefSection id="metrique" title="Sections métriques (IEC 60228)" intro="Équivalent AWG et résistance des sections normalisées des câbles.">
          <DataTable
            columns={[{ label: 'Section (mm²)' }, { label: '⌀ plein (mm)', align: 'right' }, { label: 'AWG le plus proche', align: 'right' }, { label: 'AWG exact', align: 'right' }, { label: 'Ω/km', align: 'right' }]}
            rows={metricRows}
          />
          <Notes
            items={[
              'Un fil souple (multibrin) de même section a un diamètre extérieur un peu plus grand que le fil plein.',
              'Le courant admissible dépend de l’isolant, de la pose et de la température : voir l’outil Section de câble.',
              'Repères : 3 jauges AWG de moins = section doublée ; 6 de moins = diamètre doublé ; 10 de moins = section × 10.',
            ]}
          />
          <p className="text-sm">
            <Link to="/electronique/section-cable" className="text-accent-700 underline dark:text-accent-300">
              Section de câble et chute de tension
            </Link>
          </p>
        </RefSection>
      </div>
      <Sources links={SOURCES} />
    </div>
  )
}

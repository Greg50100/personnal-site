import { fmt, fmtDuration, smartNumber } from '../lib/format'
import { formatSI } from '../lib/si'

/** Met en forme un résultat de calculateur selon son format. */
export function formatResult(r) {
  if (r.format === 'text' || typeof r.value === 'string') return r.value
  if (!Number.isFinite(r.value)) return '—'
  const unit = r.unit ? ` ${r.unit}` : ''
  switch (r.format) {
    case 'num':
      return `${fmt(r.value, r.digits ?? 2)}${unit}`
    case 'auto':
      return `${smartNumber(r.value, r.digits ?? 6)}${unit}`
    case 'percent':
      return `${fmt(r.value * 100, r.digits ?? 1)} %`
    case 'duration':
      return fmtDuration(r.value)
    default:
      return r.unit !== undefined ? formatSI(r.value, r.unit, r.digits ?? 4) : smartNumber(r.value, r.digits ?? 6)
  }
}

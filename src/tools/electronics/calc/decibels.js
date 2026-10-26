/**
 * DÉCIBELS
 * Rapport de puissances : dB = 10 log₁₀(P₂ / P₁) ; rapport de tensions (même impédance) : dB = 20 log₁₀(U₂ / U₁).
 * Références absolues : dBm (1 mW), dBW (1 W), dBV (1 V eff.), dBu (0,775 V eff., 1 mW sur 600 Ω), dBµV (1 µV).
 */

const DBU_REF = Math.sqrt(0.6) // 0,7746 V : 1 mW dans 600 Ω

export const powerRatioToDb = (r) => 10 * Math.log10(r)
export const voltageRatioToDb = (r) => 20 * Math.log10(r)
export const dbmToWatts = (dbm) => 1e-3 * 10 ** (dbm / 10)

const fmtDb = (x) => `${x.toFixed(2).replace('.', ',').replace('-', '−')} dB`

export default {
  inputs: [
    {
      id: 'mode',
      label: 'Partir de',
      type: 'choice',
      value: 'db',
      options: [
        { value: 'db', label: 'Un gain en dB' },
        { value: 'power', label: 'Un rapport de puissances' },
        { value: 'voltage', label: 'Un rapport de tensions' },
        { value: 'dbm', label: 'Une puissance en dBm' },
        { value: 'watts', label: 'Une puissance en watts' },
        { value: 'volts', label: 'Une tension efficace' },
      ],
    },
    {
      id: 'x',
      label: (v) => ({ db: 'Gain (dB)', power: 'Rapport P₂ / P₁', voltage: 'Rapport U₂ / U₁', dbm: 'Puissance (dBm)', watts: 'Puissance (W ; 100m = 100 mW)', volts: 'Tension efficace (V ; 775m = 0,775 V)' })[v.mode],
      value: '3',
    },
  ],
  compute(v) {
    const x = v.x
    if (!Number.isFinite(x)) return null
    if (['power', 'voltage', 'watts', 'volts'].includes(v.mode) && !(x > 0)) return { error: 'Une valeur strictement positive.' }
    if (v.mode === 'db' || v.mode === 'power' || v.mode === 'voltage') {
      const db = v.mode === 'db' ? x : v.mode === 'power' ? powerRatioToDb(x) : voltageRatioToDb(x)
      return {
        results: [
          { label: 'Gain', value: fmtDb(db), format: 'text', main: v.mode !== 'db' },
          { label: 'Rapport de puissances', value: 10 ** (db / 10), format: 'auto', digits: 5, main: v.mode === 'db' },
          { label: 'Rapport de tensions (ou de courants)', value: 10 ** (db / 20), format: 'auto', digits: 5 },
        ],
      }
    }
    if (v.mode === 'dbm' || v.mode === 'watts') {
      const p = v.mode === 'dbm' ? dbmToWatts(x) : x
      const dbm = powerRatioToDb(p / 1e-3)
      return {
        results: [
          v.mode === 'dbm' ? { label: 'Puissance', value: p, unit: 'W', main: true } : { label: 'Niveau', value: `${dbm.toFixed(2).replace('.', ',').replace('-', '−')} dBm`, format: 'text', main: true },
          { label: 'En dBW', value: `${(dbm - 30).toFixed(2).replace('.', ',').replace('-', '−')} dBW`, format: 'text' },
          { label: 'Tension sur 50 Ω', value: Math.sqrt(p * 50), unit: 'V', hint: 'efficace' },
          { label: 'Tension sur 600 Ω', value: Math.sqrt(p * 600), unit: 'V', hint: 'efficace' },
        ],
      }
    }
    // Tension efficace
    return {
      results: [
        { label: 'dBV (réf. 1 V)', value: fmtDb(voltageRatioToDb(x)).replace('dB', 'dBV'), format: 'text', main: true },
        { label: 'dBu (réf. 0,775 V)', value: fmtDb(voltageRatioToDb(x / DBU_REF)).replace('dB', 'dBu'), format: 'text' },
        { label: 'dBµV (réf. 1 µV)', value: fmtDb(voltageRatioToDb(x / 1e-6)).replace('dB', 'dBµV'), format: 'text' },
        { label: 'Puissance sur 50 Ω', value: `${powerRatioToDb((x * x) / 50 / 1e-3).toFixed(2).replace('.', ',').replace('-', '−')} dBm`, format: 'text' },
        { label: 'Puissance sur 600 Ω', value: `${powerRatioToDb((x * x) / 600 / 1e-3).toFixed(2).replace('.', ',').replace('-', '−')} dBm`, format: 'text' },
      ],
    }
  },
  formulas: [{ f: 'Puissances : G = 10 log₁₀(P₂ / P₁)', ref: 'decibel' }, { f: 'Tensions : G = 20 log₁₀(U₂ / U₁)', ref: 'decibel' }, 'dBm = 10 log₁₀(P / 1 mW) ; dBu = 20 log₁₀(U / 0,775 V)'],
  notes: [
    'Repères : +3 dB ≈ puissance × 2 ; +6 dB ≈ tension × 2 ; +10 dB = puissance × 10 ; +20 dB = tension × 10.',
    'Les gains en dB s’additionnent : deux étages de 10 dB font 20 dB.',
    'Le rapport de tensions en 20 log ne donne le rapport de puissances que si les impédances sont égales.',
  ],
  references: [{ id: 'decibel', label: 'Decibel (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Decibel' }],
}

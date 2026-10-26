/**
 * Autonomie d'un montage qui se réveille périodiquement (veille profonde d'un ESP, d'un Arduino…) :
 *   I moyen = (Iréveil × tréveil + Iveille × (T − tréveil)) / T
 *   autonomie = capacité utilisable / I moyen
 */
export const averageCurrent = (iAwake, tAwake, iSleep, period) => (iAwake * tAwake + iSleep * (period - tAwake)) / period

const PERIODS = [1, 2, 5, 10, 15, 30, 60, 120, 240]

export default {
  inputs: [
    { id: 'cap', label: 'Capacité de la batterie', type: 'number', unit: 'mAh', value: '2500', presets: [{ label: '2 piles AA', value: '2500' }, { label: '18650', value: '3000' }, { label: 'CR2032', value: '220' }] },
    { id: 'usable', label: 'Capacité réellement utilisable', type: 'number', unit: '%', value: '80', hint: 'Tension de coupure, froid, vieillissement' },
    { id: 'ia', label: 'Courant éveillé', type: 'number', unit: 'mA', value: '80', hint: 'ESP32 avec le Wi-Fi : 80 à 150 mA en moyenne' },
    { id: 'ta', label: 'Durée d’éveil', type: 'number', unit: 's', value: '4', hint: 'Connexion Wi-Fi, mesure et envoi (1 à 2 s avec une adresse IP fixe)' },
    { id: 'is', label: 'Courant en veille', type: 'number', unit: 'µA', value: '20', hint: 'Toute la carte : régulateur, LED et convertisseur USB compris' },
    { id: 'period', label: 'Intervalle entre deux réveils', type: 'number', unit: 'min', value: '10' },
  ],
  compute(v) {
    const T = v.period * 60
    if (!(T > 0) || !(v.ta >= 0) || v.ta >= T) return { error: 'L’intervalle doit être plus long que la durée d’éveil.' }
    if (!(v.cap > 0) || !(v.usable > 0)) return { error: 'La capacité doit être positive.' }
    const iSleep = v.is / 1000
    const avg = averageCurrent(v.ia, v.ta, iSleep, T)
    if (!(avg > 0)) return { error: 'La consommation doit être positive.' }
    const capacity = (v.cap * v.usable) / 100
    const hours = capacity / avg
    const awakeShare = (v.ia * v.ta) / (v.ia * v.ta + iSleep * (T - v.ta))
    const points = PERIODS.map((p) => [p, capacity / averageCurrent(v.ia, v.ta, iSleep, p * 60) / 24]).filter(([p]) => p * 60 > v.ta)
    return {
      results: [
        { label: 'Autonomie estimée', value: hours, format: 'duration', main: true },
        { label: 'En jours', value: hours / 24, unit: 'j', format: 'num', digits: 1 },
        { label: 'Courant moyen', value: avg * 1000, unit: 'µA', format: 'num', digits: 1 },
        { label: 'Part de l’éveil dans la consommation', value: awakeShare, format: 'percent' },
        { label: 'Réveils par jour', value: 86400 / T, format: 'num', digits: 0 },
      ],
      chart: {
        title: 'Autonomie selon l’intervalle entre deux réveils',
        x: { label: 'Intervalle (min)', log: true },
        y: { label: 'Autonomie (jours)', min: 0 },
        series: [{ name: 'Autonomie (jours)', color: '#f59e0b', points }],
        markers: [{ x: v.period, y: hours / 24, label: 'Votre réglage' }],
      },
      notes: [
        awakeShare > 0.9
          ? 'L’éveil représente presque toute la consommation : raccourcir la connexion (adresse IP fixe, envoi groupé) ou espacer les réveils.'
          : awakeShare < 0.5
            ? 'La veille pèse plus que l’éveil : c’est la consommation de la carte au repos qu’il faut réduire (régulateur à faible courant de repos, LED, convertisseur USB).'
            : null,
      ].filter(Boolean),
    }
  },
  formulas: [
    { f: 'I moyen = (Iéveil × téveil + Iveille × (T − téveil)) / T', ref: 'idfSleep' },
    'Autonomie = capacité × part utilisable / I moyen',
  ],
  notes: [
    { text: 'Une puce ESP32 en veille profonde consomme environ 10 µA, mais une carte de développement souvent 100 µA à quelques mA : mesurer la carte entière.', ref: ['idfSleep', 'esphomeSleep'] },
    'L’autodécharge de la batterie (quelques % par mois pour le lithium) s’ajoute sur les très longues durées.',
  ],
  references: [
    { id: 'idfSleep', label: 'Espressif, ESP-IDF : « Sleep Modes » (veilles légère et profonde, sources de réveil)', url: 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/sleep_modes.html' },
    { id: 'esphomeSleep', label: 'ESPHome : composant deep_sleep', url: 'https://esphome.io/components/deep_sleep.html' },
  ],
}
